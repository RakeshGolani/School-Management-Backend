const BaseController = require('../BaseController');
const { Teacher, School, TeacherClassAssignment, SchoolClass, AcademicYear, sequelize } = require('../../../Models');
const { Op } = require('sequelize');
const TeacherResource = require('../../Resources/Teacher/TeacherResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcryptjs');

/**
 * AdminTeacherController
 * Dedicated Controller for Super Admin to manage / view teachers across schools.
 */
class AdminTeacherController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  /**
   * Get filtered list of teachers for admin
   */
  async index(req, res) {
    try {
      const { search, subject, status, schoolId, academic_year_id } = req.query;
      const pageNum = parseInt(req.query.page, 10) || 1;
      const limitNum = parseInt(req.query.limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const whereClause = {};
      if (schoolId && schoolId !== 'all' && schoolId !== '') {
        const isUuid = typeof schoolId === 'string' && schoolId.includes('-');
        if (isUuid) {
          const sch = await School.findOne({ where: { uuid: schoolId } });
          if (sch) whereClause.school_id = sch.id;
        } else {
          whereClause.school_id = parseInt(schoolId, 10);
        }
      }
      if (status && status !== 'all' && status !== '') {
        whereClause.status = status;
      }
      if (subject && subject !== 'all' && subject !== '') {
        whereClause.subject = { [Op.like]: `%${subject}%` };
      }
      if (search) {
        const trimmedSearch = search.trim();
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { email: { [Op.like]: `%${trimmedSearch}%` } },
          { employee_id: { [Op.like]: `%${trimmedSearch}%` } },
          { subject: { [Op.like]: `%${trimmedSearch}%` } },
          { nfc_card_uid: { [Op.like]: `%${trimmedSearch}%` } },
          { phone: { [Op.like]: `%${trimmedSearch}%` } }
        ];
      }

      const assignmentInclude = {
        model: TeacherClassAssignment,
        as: 'assignedClasses',
        required: false,
        include: [{ model: SchoolClass, as: 'schoolClass' }]
      };

      if (academic_year_id) {
        assignmentInclude.where = { academic_year_id };
      }

      const { count, rows: teachers } = await Teacher.findAndCountAll({
        where: whereClause,
        include: [assignmentInclude, { model: School, as: 'school' }],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / limitNum);
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Teachers retrieved successfully',
        data: TeacherResource.collection(teachers),
        meta: { total: count, page: pageNum, limit: limitNum, totalPages }
      });
    } catch (error) {
      console.error('Error fetching teachers in admin:', error);
      return this.sendError(res, 'Failed to fetch teachers: ' + error.message, 500);
    }
  }

  /**
   * Get single teacher details for admin
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const teacher = await this.findByUuidOrPk(Teacher, id, {
        include: [
          { 
            model: TeacherClassAssignment, 
            as: 'assignedClasses',
            include: [
              { model: SchoolClass, as: 'schoolClass' },
              { model: AcademicYear, as: 'academicYear' }
            ]
          },
          { model: School, as: 'school' }
        ]
      });

      if (!teacher) {
        return this.sendError(res, 'Teacher record not found', 404);
      }

      const teacherData = new TeacherResource(teacher).toJson();
      return this.sendResponse(res, teacherData, 'Teacher profile retrieved successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Create teacher (admin)
   */
  async store(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { name, email, password, phone, gender, qualification, subject, employee_id, nfc_card_uid, school_id } = req.body;

      if (!school_id) {
        await transaction.rollback();
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'school_id is required', 400);
      }

      const existingEmail = await Teacher.findOne({ where: { email }, transaction });
      if (existingEmail) {
        await transaction.rollback();
        if (req.file) removeFile(req.file);
        return this.sendValidationError(res, { email: ['Email already exists'] }, 'Validation failed', 400);
      }

      let photoPath = req.file ? `/uploads/teachers/${req.file.filename}` : null;
      const hashedPassword = await bcrypt.hash(password || 'Welcome@123', 10);
      const generatedEmpId = employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      const teacher = await Teacher.create({
        school_id: parseInt(school_id, 10),
        employee_id: generatedEmpId,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        gender: gender || 'male',
        qualification: qualification || null,
        subject: subject || null,
        photo: photoPath,
        nfc_card_uid: nfc_card_uid || null,
        status: 'active'
      }, { transaction });

      await transaction.commit();
      return this.sendResponse(res, new TeacherResource(teacher).toJson(), 'Teacher created successfully', 201);
    } catch (error) {
      await transaction.rollback();
      if (req.file) removeFile(req.file);
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Update teacher (admin)
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const teacher = await this.findByUuidOrPk(Teacher, id);
      if (!teacher) {
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'Teacher not found', 404);
      }

      const { name, email, phone, gender, qualification, subject, employee_id, nfc_card_uid, status } = req.body;
      if (name) teacher.name = name;
      if (email) teacher.email = email;
      if (phone !== undefined) teacher.phone = phone || null;
      if (gender) teacher.gender = gender;
      if (qualification !== undefined) teacher.qualification = qualification || null;
      if (subject !== undefined) teacher.subject = subject || null;
      if (employee_id !== undefined) teacher.employee_id = employee_id;
      if (nfc_card_uid !== undefined) teacher.nfc_card_uid = nfc_card_uid || null;
      if (status) teacher.status = status;

      if (req.file) {
        if (teacher.photo) removeFile(teacher.photo);
        teacher.photo = `/uploads/teachers/${req.file.filename}`;
      }

      await teacher.save();
      const fullTeacher = await this.findByUuidOrPk(Teacher, teacher.id, {
        include: [{ model: School, as: 'school' }]
      });
      return this.sendResponse(res, new TeacherResource(fullTeacher || teacher).toJson(), 'Teacher updated successfully');
    } catch (error) {
      if (req.file) removeFile(req.file);
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Delete teacher (admin)
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const teacher = await this.findByUuidOrPk(Teacher, id);
      if (!teacher) return this.sendError(res, 'Teacher not found', 404);
      if (teacher.photo) removeFile(teacher.photo);
      await teacher.destroy();
      return this.sendResponse(res, null, 'Teacher deleted successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Toggle teacher status
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const teacher = await this.findByUuidOrPk(Teacher, id);
      if (!teacher) {
        return this.sendError(res, 'Teacher not found', 404);
      }

      teacher.status = status || (teacher.status === 'active' ? 'inactive' : 'active');
      await teacher.save();

      return this.sendResponse(
        res,
        new TeacherResource(teacher).toJson(),
        `Teacher status changed to ${teacher.status}`
      );
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

module.exports = new AdminTeacherController();
