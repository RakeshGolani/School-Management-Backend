const BaseController = require('../BaseController');
const { Student, BusRoute, BusStop, Parent } = require('../../../Models');
const { Op, where, fn, col } = require('sequelize');
const StudentResource = require('../../Resources/Student/StudentResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcrypt');

/**
 * StudentController
 * Handles student admissions, profile management, NFC card assignment, bus subscriptions, and photo uploads.
 */
class StudentController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Get filtered list of students
   */
  async index(req, res) {
    try {
      const { search, grade, is_bus, status, schoolId } = req.query;
      const targetSchoolId = schoolId || req.headers['x-school-id'];

      const whereClause = {};
      if (targetSchoolId) {
        whereClause.school_id = targetSchoolId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (grade && grade !== 'all') {
        const cleanGrade = grade.replace(/^Grade\s+/i, '').trim();
        whereClause[Op.or] = [
          { grade: { [Op.like]: `%${cleanGrade}%` } },
          { class_id: { [Op.like]: `%${cleanGrade}%` } }
        ];
      }

      if (is_bus !== undefined && is_bus !== 'all') {
        whereClause.is_bus_service_enabled = is_bus === 'true' || is_bus === '1';
      }

      if (search) {
        const trimmedSearch = search.trim();
        const searchCondition = [
          { first_name: { [Op.like]: `%${trimmedSearch}%` } },
          { last_name: { [Op.like]: `%${trimmedSearch}%` } },
          where(fn('CONCAT', col('first_name'), ' ', col('last_name')), { [Op.like]: `%${trimmedSearch}%` }),
          { admission_number: { [Op.like]: `%${trimmedSearch}%` } },
          { nfc_card_uid: { [Op.like]: `%${trimmedSearch}%` } },
          { guardian_name: { [Op.like]: `%${trimmedSearch}%` } },
          { guardian_phone: { [Op.like]: `%${trimmedSearch}%` } }
        ];

        if (whereClause[Op.or]) {
          const previousOr = whereClause[Op.or];
          delete whereClause[Op.or];
          whereClause[Op.and] = [
            { [Op.or]: previousOr },
            { [Op.or]: searchCondition }
          ];
        } else {
          whereClause[Op.or] = searchCondition;
        }
      }

      const pageNum = parseInt(req.query.page, 10) || 1;
      const limitNum = parseInt(req.query.limit, 10) || 5;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: students } = await Student.findAndCountAll({
        where: whereClause,
        include: [
          { model: BusRoute, as: 'busRoute' },
          { model: BusStop, as: 'busStop' },
          { model: Parent, as: 'parent' }
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      const studentList = StudentResource.collection(students);
      const totalPages = Math.ceil(count / limitNum);

      return res.status(200).json({
        status: 'success',
        message: 'Students retrieved successfully',
        data: studentList,
        meta: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return this.sendError(res, 'Failed to fetch students: ' + error.message, 500);
    }
  }

  /**
   * Get single student profile
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id, {
        include: [
          { model: BusRoute, as: 'busRoute' },
          { model: BusStop, as: 'busStop' },
          { model: Parent, as: 'parent' }
        ]
      });

      if (!student) {
        return this.sendError(res, 'Student profile not found', 404);
      }

      const studentData = new StudentResource(student).toJson();
      return this.sendResponse(res, studentData, 'Student profile retrieved successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Add new student admission
   */
  async store(req, res) {
    try {
      const {
        first_name,
        last_name,
        admission_number,
        grade,
        section,
        gender,
        dob,
        guardian_name,
        guardian_email,
        guardian_phone,
        alternate_phone,
        nfc_card_uid,
        is_bus_service_enabled,
        bus_route_id,
        bus_stop_id,
        school_id,
        schoolId
      } = req.body;

      const targetSchoolId = school_id || schoolId || req.query.schoolId || req.headers['x-school-id'];
      if (!targetSchoolId) {
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'School ID is required for student admission', 400);
      }

      // Check for unique NFC card UID if provided
      if (nfc_card_uid) {
        const existingUid = await Student.findOne({ where: { nfc_card_uid } });
        if (existingUid) {
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another student.'] },
            'Validation failed',
            400
          );
        }
      }

      let photoPath = null;
      if (req.file) {
        photoPath = `/uploads/students/${req.file.filename}`;
      }

      // Auto-create or link Parent logic
      let parent_id = null;
      if (guardian_email) {
        let parent = await Parent.findOne({ where: { email: guardian_email } });
        if (!parent) {
          const defaultPassword = await bcrypt.hash('Welcome@123', 10);
          parent = await Parent.create({
            name: guardian_name || 'Guardian',
            email: guardian_email,
            phone: guardian_phone || null,
            password: defaultPassword
          });
        }
        parent_id = parent.id;
      }

      const student = await Student.create({
        school_id: parseInt(targetSchoolId, 10),
        first_name,
        last_name,
        admission_number: admission_number || `ADM-${Date.now().toString().slice(-4)}`,
        grade: grade || 'Grade 10-A',
        section: section || 'A',
        gender: gender || 'male',
        dob: dob || null,
        guardian_name: guardian_name || null,
        guardian_phone: guardian_phone || null,
        alternate_phone: alternate_phone || null,
        parent_id: parent_id,
        photo: photoPath,
        nfc_card_uid: nfc_card_uid || null,
        is_bus_service_enabled: is_bus_service_enabled === 'true' || is_bus_service_enabled === true,
        bus_route_id: bus_route_id || null,
        bus_stop_id: bus_stop_id || null,
        status: 'active'
      });

      const studentData = new StudentResource(student).toJson();
      return this.sendResponse(res, studentData, 'Student admission created successfully', 201);
    } catch (error) {
      if (req.file) removeFile(req.file);
      console.error('Error creating student:', error);
      return this.sendError(res, 'Failed to create student: ' + error.message, 500);
    }
  }

  /**
   * Update student profile
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id);

      if (!student) {
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'Student profile not found', 404);
      }

      const targetSchoolId = req.body?.school_id || req.body?.schoolId || req.query?.schoolId || req.headers['x-school-id'];
      if (targetSchoolId && String(student.school_id) !== String(targetSchoolId)) {
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'Unauthorized access to student record', 403);
      }

      const {
        first_name,
        last_name,
        admission_number,
        grade,
        section,
        gender,
        dob,
        guardian_name,
        guardian_phone,
        alternate_phone,
        nfc_card_uid,
        is_bus_service_enabled,
        bus_route_id,
        bus_stop_id,
        status
      } = req.body;

      if (nfc_card_uid && nfc_card_uid !== student.nfc_card_uid) {
        const existingUid = await Student.findOne({ where: { nfc_card_uid } });
        if (existingUid) {
          if (req.file) removeFile(req.file);
          return this.sendValidationError(
            res,
            { nfc_card_uid: ['This NFC Card UID is already assigned to another student.'] },
            'Validation failed',
            400
          );
        }
      }

      if (first_name) student.first_name = first_name;
      if (last_name) student.last_name = last_name;
      if (admission_number) student.admission_number = admission_number;
      if (grade) student.grade = grade;
      if (section) student.section = section;
      if (gender) student.gender = gender;
      if (dob !== undefined) student.dob = dob || null;
      if (guardian_name !== undefined) student.guardian_name = guardian_name || null;
      if (guardian_phone !== undefined) student.guardian_phone = guardian_phone || null;
      if (alternate_phone !== undefined) student.alternate_phone = alternate_phone || null;
      if (nfc_card_uid !== undefined) student.nfc_card_uid = nfc_card_uid || null;
      if (is_bus_service_enabled !== undefined) {
        student.is_bus_service_enabled = is_bus_service_enabled === 'true' || is_bus_service_enabled === true;
      }
      if (bus_route_id !== undefined) student.bus_route_id = bus_route_id || null;
      if (bus_stop_id !== undefined) student.bus_stop_id = bus_stop_id || null;
      if (status) student.status = status;

      // Handle photo replacement via Multer
      if (req.file) {
        if (student.photo) {
          removeFile(student.photo);
        }
        student.photo = `/uploads/students/${req.file.filename}`;
      }

      await student.save();

      const updatedStudent = await Student.findByPk(id, {
        include: [
          { model: BusRoute, as: 'busRoute' },
          { model: BusStop, as: 'busStop' }
        ]
      });

      const studentData = new StudentResource(updatedStudent).toJson();
      return this.sendResponse(res, studentData, 'Student profile updated successfully');
    } catch (error) {
      if (req.file) removeFile(req.file);
      console.error('Error updating student:', error);
      return this.sendError(res, 'Failed to update student: ' + error.message, 500);
    }
  }

  /**
   * Delete student record
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id);

      if (!student) {
        return this.sendError(res, 'Student record not found', 404);
      }

      if (student.photo) {
        removeFile(student.photo);
      }

      await student.destroy();
      return this.sendResponse(res, null, 'Student record deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      return this.sendError(res, 'Failed to delete student: ' + error.message, 500);
    }
  }
}

module.exports = new StudentController();
