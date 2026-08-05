const BaseController = require('../BaseController');
const { Teacher, School } = require('../../../Models');
const { Op } = require('sequelize');
const TeacherResource = require('../../Resources/Teacher/TeacherResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcryptjs');

/**
 * TeacherController
 * Handles teacher management, subject/qualification assignments, NFC card assignment, and photo uploads.
 */
class TeacherController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Get filtered list of teachers
   */
  async index(req, res) {
    try {
      const { search, subject, status, schoolId } = req.query;
      const targetSchoolId = schoolId || req.headers['x-school-id'];

      const whereClause = {};
      if (targetSchoolId) {
        whereClause.school_id = targetSchoolId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (subject && subject !== 'all') {
        whereClause.subject = { [Op.like]: `%${subject}%` };
      }

      if (search) {
        const trimmedSearch = search.trim();
        const searchCondition = [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { email: { [Op.like]: `%${trimmedSearch}%` } },
          { employee_id: { [Op.like]: `%${trimmedSearch}%` } },
          { subject: { [Op.like]: `%${trimmedSearch}%` } },
          { class_assigned: { [Op.like]: `%${trimmedSearch}%` } },
          { nfc_card_uid: { [Op.like]: `%${trimmedSearch}%` } },
          { phone: { [Op.like]: `%${trimmedSearch}%` } }
        ];

        whereClause[Op.or] = searchCondition;
      }

      const pageNum = parseInt(req.query.page, 10) || 1;
      const limitNum = parseInt(req.query.limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: teachers } = await Teacher.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      const teacherList = TeacherResource.collection(teachers);
      const totalPages = Math.ceil(count / limitNum);

      return res.status(200).json({
        status: 'success',
        message: 'Teachers retrieved successfully',
        data: teacherList,
        meta: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages
        }
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
      const teacher = await Teacher.findByPk(id);

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
      const existingEmail = await Teacher.findOne({ where: { email } });
      if (existingEmail) {
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
        const existingUid = await Teacher.findOne({ where: { nfc_card_uid } });
        if (existingUid) {
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another teacher.'] },
            'Validation failed',
            400
          );
        }
      }

      let photoPath = null;
      if (req.file) {
        photoPath = `/uploads/teachers/${req.file.filename}`;
      }

      // Hash password (default password if not provided)
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
        class_assigned: class_assigned || null,
        photo: photoPath,
        nfc_card_uid: nfc_card_uid || null,
        status: 'active'
      });

      const teacherData = new TeacherResource(teacher).toJson();
      return this.sendResponse(res, teacherData, 'Teacher record created successfully', 201);
    } catch (error) {
      if (req.file) removeFile(req.file);
      console.error('Error creating teacher:', error);
      return this.sendError(res, 'Failed to create teacher: ' + error.message, 500);
    }
  }

  /**
   * Update teacher profile
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const teacher = await Teacher.findByPk(id);

      if (!teacher) {
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
        const existingEmail = await Teacher.findOne({ where: { email } });
        if (existingEmail) {
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
        const existingUid = await Teacher.findOne({ where: { nfc_card_uid } });
        if (existingUid) {
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another teacher.'] },
            'Validation failed',
            400
          );
        }
      }

      if (name) teacher.name = name;
      if (email) teacher.email = email;
      if (phone !== undefined) teacher.phone = phone || null;
      if (gender) teacher.gender = gender;
      if (qualification !== undefined) teacher.qualification = qualification || null;
      if (subject !== undefined) teacher.subject = subject || null;
      if (class_assigned !== undefined) teacher.class_assigned = class_assigned || null;
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

      await teacher.save();

      const teacherData = new TeacherResource(teacher).toJson();
      return this.sendResponse(res, teacherData, 'Teacher profile updated successfully');
    } catch (error) {
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

module.exports = new TeacherController();
