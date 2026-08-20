const BaseController = require('../BaseController');
const { Teacher, School, TeacherClassAssignment, SchoolClass, AcademicYear, sequelize } = require('../../../Models');
const { Op } = require('sequelize');
const TeacherResource = require('../../Resources/Teacher/TeacherResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcryptjs');

/**
 * Helper to sync teacher_class_assignments relational records
 */
async function syncTeacherClassAssignments(teacherId, schoolId, classAssignedStr, transaction, academicYearId = null) {
  if (classAssignedStr === undefined) return;

  await TeacherClassAssignment.destroy({
    where: { teacher_id: teacherId },
    transaction
  });

  if (!classAssignedStr) return;

  const classList = classAssignedStr.split(',').map(c => c.trim()).filter(Boolean);
  for (const itemStr of classList) {
    const parts = itemStr.split('-');
    const className = parts[0] ? parts[0].trim() : itemStr;
    const section = parts[1] ? parts[1].trim() : 'A';

    const clsRecord = await SchoolClass.findOne({
      where: { school_id: schoolId, class_name: className, section: section },
      transaction
    });

    if (clsRecord) {
      await TeacherClassAssignment.create({
        school_id: schoolId,
        teacher_id: teacherId,
        class_id: clsRecord.id,
        academic_year_id: academicYearId || null
      }, { transaction });
    }
  }
}

/**
 * SchoolTeacherController
 * Dedicated Controller for School Admin managing its faculty / teachers.
 */
class SchoolTeacherController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Get filtered list of teachers for current school
   */
  async index(req, res) {
    try {
      const { search, subject, status, schoolId, academic_year_id } = req.query;
      const targetSchoolId = schoolId || req.headers['x-school-id'];

      const pageNum = parseInt(req.query.page, 10) || 1;
      const limitNum = parseInt(req.query.limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const whereClause = {};
      if (targetSchoolId) whereClause.school_id = targetSchoolId;
      if (status) whereClause.status = status;
      if (subject && subject !== 'all') whereClause.subject = { [Op.like]: `%${subject}%` };
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

      // Include teacher class assignments scoped to academic_year_id if supplied
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
        include: [assignmentInclude],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true
      });

      const activeCount = await Teacher.count({
        where: { ...whereClause, status: 'active' }
      });
      const nfcCount = await Teacher.count({
        where: { ...whereClause, nfc_card_uid: { [Op.ne]: null } }
      });

      const totalPages = Math.ceil(count / limitNum);
      return res.status(200).json({
        status: 'success',
        message: 'Teachers retrieved successfully',
        data: TeacherResource.collection(teachers),
        meta: { total: count, page: pageNum, limit: limitNum, totalPages, active_count: activeCount, nfc_count: nfcCount }
      });
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return this.sendError(res, 'Failed to fetch teachers: ' + error.message, 500);
    }
  }

  /**
   * Get single teacher profile
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const teacher = await Teacher.findByPk(id, {
        include: [
          { 
            model: TeacherClassAssignment, 
            as: 'assignedClasses',
            include: [
              { model: SchoolClass, as: 'schoolClass' },
              { model: AcademicYear, as: 'academicYear' }
            ]
          }
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
   * Add new teacher profile
   */
  async store(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const {
        name,
        email,
        password,
        phone,
        gender,
        qualification,
        subject,
        class_assigned,
        employee_id,
        nfc_card_uid,
        school_id,
        schoolId
      } = req.body;

      const targetSchoolId = school_id || schoolId || req.query.schoolId || req.headers['x-school-id'] || 1;

      // Check unique email
      const existingEmail = await Teacher.findOne({ where: { email }, transaction });
      if (existingEmail) {
        await transaction.rollback();
        if (req.file) removeFile(req.file);
        return this.sendValidationError(
          res,
          { email: ['A teacher with this email address already exists.'] },
          'Validation failed',
          400
        );
      }

      // Check unique NFC card UID if provided
      if (nfc_card_uid) {
        const existingUid = await Teacher.findOne({ where: { nfc_card_uid }, transaction });
        if (existingUid) {
          await transaction.rollback();
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another teacher.'] },
            'Validation failed',
            400
          );
        }
      }

      // Check unique class_assigned if provided (1 Teacher = 1 Class Teacher)
      if (class_assigned && class_assigned.trim()) {
        const firstClass = class_assigned.split(',')[0].trim();
        const parts = firstClass.split('-');
        const className = parts[0] ? parts[0].trim() : firstClass;
        const section = parts[1] ? parts[1].trim() : 'A';

        const targetClassRecord = await SchoolClass.findOne({
          where: { school_id: parseInt(targetSchoolId, 10), class_name: className, section: section },
          transaction
        });

        if (targetClassRecord) {
          const existingAssignment = await TeacherClassAssignment.findOne({
            where: {
              school_id: parseInt(targetSchoolId, 10),
              class_id: targetClassRecord.id
            },
            include: [{ model: Teacher, as: 'teacher' }],
            transaction
          });

          if (existingAssignment && existingAssignment.teacher) {
            await transaction.rollback();
            if (req.file) removeFile(req.file);
            return this.sendValidationError(
              res,
              { class_assigned: [`Class ${firstClass} is already assigned to ${existingAssignment.teacher.name}. 1 teacher can only be assigned as class teacher for 1 class.`] },
              'Validation failed',
              400
            );
          }
        }
      }

      let photoPath = null;
      if (req.file) {
        photoPath = `/uploads/teachers/${req.file.filename}`;
      }

      const rawPassword = password || 'Welcome@123';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const generatedEmployeeId = employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      const teacher = await Teacher.create({
        school_id: parseInt(targetSchoolId, 10),
        employee_id: generatedEmployeeId,
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

      // Sync relational table teacher_class_assignments
      const yearId = req.body.academic_year_id ? parseInt(req.body.academic_year_id) : null;
      await syncTeacherClassAssignments(teacher.id, teacher.school_id, class_assigned, transaction, yearId);

      await transaction.commit();

      const createdTeacher = await Teacher.findByPk(teacher.id, {
        include: [{ model: TeacherClassAssignment, as: 'assignedClasses' }]
      });

      const teacherData = new TeacherResource(createdTeacher).toJson();
      return this.sendResponse(res, teacherData, 'Teacher record created successfully', 201);
    } catch (error) {
      await transaction.rollback();
      if (req.file) removeFile(req.file);
      console.error('Error creating teacher:', error);
      return this.sendError(res, 'Failed to create teacher: ' + error.message, 500);
    }
  }

  /**
   * Update teacher profile
   */
  async update(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const teacher = await Teacher.findByPk(id, { transaction });

      if (!teacher) {
        await transaction.rollback();
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'Teacher profile not found', 404);
      }

      const {
        name,
        email,
        phone,
        gender,
        qualification,
        subject,
        class_assigned,
        employee_id,
        nfc_card_uid,
        status
      } = req.body;

      if (email && email !== teacher.email) {
        const existingEmail = await Teacher.findOne({ where: { email }, transaction });
        if (existingEmail) {
          await transaction.rollback();
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { email: ['This email is already in use by another teacher.'] },
            'Validation failed',
            400
          );
        }
      }

      if (nfc_card_uid && nfc_card_uid !== teacher.nfc_card_uid) {
        const existingUid = await Teacher.findOne({ where: { nfc_card_uid }, transaction });
        if (existingUid) {
          await transaction.rollback();
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another teacher.'] },
            'Validation failed',
            400
          );
        }
      }

      if (class_assigned && class_assigned.trim()) {
        const firstClass = class_assigned.split(',')[0].trim();
        const parts = firstClass.split('-');
        const className = parts[0] ? parts[0].trim() : firstClass;
        const section = parts[1] ? parts[1].trim() : 'A';

        const targetClassRecord = await SchoolClass.findOne({
          where: { school_id: teacher.school_id, class_name: className, section: section },
          transaction
        });

        if (targetClassRecord) {
          const existingAssignment = await TeacherClassAssignment.findOne({
            where: {
              school_id: teacher.school_id,
              class_id: targetClassRecord.id,
              teacher_id: { [Op.ne]: teacher.id }
            },
            include: [{ model: Teacher, as: 'teacher' }],
            transaction
          });

          if (existingAssignment && existingAssignment.teacher) {
            await transaction.rollback();
            if (req.file) removeFile(req.file);
            return this.sendValidationError(
              res,
              { class_assigned: [`Class ${firstClass} is already assigned to ${existingAssignment.teacher.name}.`] },
              'Validation failed',
              400
            );
          }
        }
      }

      if (name) teacher.name = name;
      if (email) teacher.email = email;
      if (phone !== undefined) teacher.phone = phone || null;
      if (gender) teacher.gender = gender;
      if (qualification !== undefined) teacher.qualification = qualification || null;
      if (subject !== undefined) teacher.subject = subject || null;
      if (employee_id !== undefined) teacher.employee_id = employee_id || teacher.employee_id;
      if (nfc_card_uid !== undefined) teacher.nfc_card_uid = nfc_card_uid || null;
      if (status) teacher.status = status;

      // Handle photo replacement via Multer
      if (req.file) {
        if (teacher.photo) {
          removeFile(teacher.photo);
        }
        teacher.photo = `/uploads/teachers/${req.file.filename}`;
      }

      await teacher.save({ transaction });

      // Sync relational table teacher_class_assignments
      if (class_assigned !== undefined) {
        await syncTeacherClassAssignments(teacher.id, teacher.school_id, class_assigned, transaction);
      }

      await transaction.commit();

      const updatedTeacher = await Teacher.findByPk(teacher.id, {
        include: [{ model: TeacherClassAssignment, as: 'assignedClasses' }]
      });

      const teacherData = new TeacherResource(updatedTeacher).toJson();
      return this.sendResponse(res, teacherData, 'Teacher profile updated successfully');
    } catch (error) {
      await transaction.rollback();
      if (req.file) removeFile(req.file);
      console.error('Error updating teacher:', error);
      return this.sendError(res, 'Failed to update teacher: ' + error.message, 500);
    }
  }

  /**
   * Delete teacher record
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const teacher = await Teacher.findByPk(id);

      if (!teacher) {
        return this.sendError(res, 'Teacher record not found', 404);
      }

      if (teacher.photo) {
        removeFile(teacher.photo);
      }

      await teacher.destroy();
      return this.sendResponse(res, null, 'Teacher record deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      return this.sendError(res, 'Failed to delete teacher: ' + error.message, 500);
    }
  }
}

module.exports = new SchoolTeacherController();
