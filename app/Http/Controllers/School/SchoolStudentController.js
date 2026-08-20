const BaseController = require('../BaseController');
const { Student, BusRoute, BusStop, Parent, Teacher, SchoolSubscription, AcademicYear, StudentAcademicSession, SchoolClass, sequelize } = require('../../../Models');
const { Op, where, fn, col } = require('sequelize');
const StudentResource = require('../../Resources/Student/StudentResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcryptjs');

/**
 * SchoolStudentController
 * Dedicated Controller for School Admin managing students, admissions, promotions & academic sessions.
 */
class SchoolStudentController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
    this.promoteStudents = this.promoteStudents.bind(this);
    this.getSessionStudents = this.getSessionStudents.bind(this);
    this.getStudentSessions = this.getStudentSessions.bind(this);
  }

  /**
   * Get filtered list of students for current school.
   */
  async index(req, res) {
    try {
      const { search, grade, is_bus, status, schoolId, academic_year_id } = req.query;
      const targetSchoolId = schoolId || req.headers['x-school-id'];

      const pageNum = parseInt(req.query.page, 10) || 1;
      const limitNum = parseInt(req.query.limit, 10) || 5;
      const offset = (pageNum - 1) * limitNum;

      if (academic_year_id) {
        const sessionWhere = { academic_year_id };
        if (targetSchoolId) sessionWhere.school_id = targetSchoolId;

        const studentWhere = {};
        if (status && status !== 'all') studentWhere.status = status;
        if (is_bus !== undefined && is_bus !== 'all') {
          studentWhere.is_bus_service_enabled = is_bus === 'true' || is_bus === '1';
        }
        if (grade && grade !== 'all') {
          const cleanGrade = grade.replace(/^Grade\s+/i, '').trim();
          studentWhere[Op.or] = [
            { grade: { [Op.like]: `%${cleanGrade}%` } },
            { class_id: { [Op.like]: `%${cleanGrade}%` } }
          ];
        }
        if (search) {
          const t = search.trim();
          const cond = [
            { first_name: { [Op.like]: `%${t}%` } },
            { last_name: { [Op.like]: `%${t}%` } },
            where(fn('CONCAT', col('first_name'), ' ', col('last_name')), { [Op.like]: `%${t}%` }),
            { admission_number: { [Op.like]: `%${t}%` } },
            { roll_number: { [Op.like]: `%${t}%` } },
            { guardian_name: { [Op.like]: `%${t}%` } },
            { guardian_phone: { [Op.like]: `%${t}%` } }
          ];
          if (studentWhere[Op.or]) {
            studentWhere[Op.and] = [{ [Op.or]: studentWhere[Op.or] }, { [Op.or]: cond }];
            delete studentWhere[Op.or];
          } else {
            studentWhere[Op.or] = cond;
          }
        }

        const { count, rows: sessions } = await StudentAcademicSession.findAndCountAll({
          where: sessionWhere,
          limit: limitNum,
          offset,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: Student,
              as: 'student',
              where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
              required: true,
              include: [
                { model: BusRoute, as: 'busRoute' },
                { model: BusStop, as: 'busStop' },
                { model: Parent, as: 'parent' }
              ]
            }
          ],
          distinct: true
        });

        const studentList = sessions.map(s => {
          const raw = new StudentResource(s.student).toJson();
          raw.session_status = s.status;
          raw.session_grade = s.grade;
          raw.session_section = s.section;
          raw.session_id = s.id;
          return raw;
        });

        return res.status(200).json({
          status: 'success',
          message: 'Students retrieved successfully',
          data: studentList,
          meta: {
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        });
      }

      // Default: return all students (no session filter)
      const whereClause = {};
      if (targetSchoolId) whereClause.school_id = targetSchoolId;
      if (status && status !== 'all') whereClause.status = status;
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
        const t = search.trim();
        const cond = [
          { first_name: { [Op.like]: `%${t}%` } },
          { last_name: { [Op.like]: `%${t}%` } },
          where(fn('CONCAT', col('first_name'), ' ', col('last_name')), { [Op.like]: `%${t}%` }),
          { admission_number: { [Op.like]: `%${t}%` } },
          { roll_number: { [Op.like]: `%${t}%` } },
          { nfc_card_uid: { [Op.like]: `%${t}%` } },
          { guardian_name: { [Op.like]: `%${t}%` } },
          { guardian_phone: { [Op.like]: `%${t}%` } }
        ];
        if (whereClause[Op.or]) {
          const prev = whereClause[Op.or];
          delete whereClause[Op.or];
          whereClause[Op.and] = [{ [Op.or]: prev }, { [Op.or]: cond }];
        } else {
          whereClause[Op.or] = cond;
        }
      }

      const { count, rows: students } = await Student.findAndCountAll({
        where: whereClause,
        include: [
          { model: BusRoute, as: 'busRoute' },
          { model: BusStop, as: 'busStop' },
          { model: Parent, as: 'parent' }
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true
      });

      return res.status(200).json({
        status: 'success',
        message: 'Students retrieved successfully',
        data: StudentResource.collection(students),
        meta: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return this.sendError(res, 'Failed to fetch students: ' + error.message, 500);
    }
  }

  /**
   * Get students enrolled in a specific academic session (with session status).
   */
  async getSessionStudents(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { academic_year_id } = req.query;

      if (!academic_year_id) {
        return this.sendValidationError(res, [], 'academic_year_id is required');
      }

      const sessions = await StudentAcademicSession.findAll({
        where: { school_id, academic_year_id },
        include: [
          {
            model: Student,
            as: 'student',
            where: { status: 'active' },
            required: true,
            include: [
              { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'class_name', 'section'] }
            ]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      const data = sessions.map(s => ({
        session_id: s.id,
        session_status: s.status,
        session_grade: s.grade,
        session_section: s.section,
        student_id: s.student_id,
        student_name: `${s.student.first_name} ${s.student.last_name}`,
        admission_number: s.student.admission_number,
        photo: s.student.image_url,
        class: s.student.schoolClass ? `${s.student.schoolClass.class_name} - ${s.student.schoolClass.section}` : s.grade
      }));

      return this.sendResponse(res, data, 'Session students fetched successfully');
    } catch (error) {
      console.error('Error fetching session students:', error);
      return this.sendError(res, 'Failed to fetch session students: ' + error.message, 500);
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
          { model: Parent, as: 'parent' },
          { 
            model: SchoolClass, 
            as: 'schoolClass',
            include: [
              { model: Teacher, as: 'classTeacher', attributes: ['id', 'name', 'email', 'phone', 'employee_id'] }
            ]
          }
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
    const transaction = await sequelize.transaction();
    try {
      const {
        first_name,
        last_name,
        admission_number,
        roll_number,
        grade,
        section,
        gender,
        dob,
        guardian_name,
        guardian_email,
        guardian_phone,
        guardian_address,
        alternate_phone,
        nfc_card_uid,
        is_bus_service_enabled,
        bus_route_id,
        bus_stop_id,
        school_id,
        schoolId,
        academic_year_id,
        class_id
      } = req.body;

      const targetSchoolId = school_id || schoolId || req.query.schoolId || req.headers['x-school-id'];
      if (!targetSchoolId) {
        await transaction.rollback();
        if (req.file) removeFile(req.file);
        return this.sendError(res, 'School ID is required for student admission', 400);
      }

      // Subscription limit check
      const subscription = req.subscription || await SchoolSubscription.findOne({
        where: { school_id: targetSchoolId, status: 'active' }
      });
      if (subscription) {
        const activeStudentsCount = await Student.count({
          where: { school_id: targetSchoolId, status: 'active' }
        });
        if (activeStudentsCount >= subscription.max_students_limit) {
          await transaction.rollback();
          if (req.file) removeFile(req.file);
          return this.sendError(
            res,
            `Student limit reached. Your subscription allows up to ${subscription.max_students_limit} students.`,
            403
          );
        }
      }

      // NFC UID uniqueness check
      if (nfc_card_uid) {
        const existingUid = await Student.findOne({ where: { nfc_card_uid } });
        if (existingUid) {
          await transaction.rollback();
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

      let parent_id = null;
      if (guardian_email) {
        let parent = await Parent.findOne({ where: { email: guardian_email } });
        if (!parent) {
          const defaultPassword = await bcrypt.hash('Welcome@123', 10);
          parent = await Parent.create({
            name: guardian_name || 'Guardian',
            email: guardian_email,
            phone: guardian_phone || null,
            address: guardian_address || null,
            password: defaultPassword
          }, { transaction });
        }
        parent_id = parent.id;
      }

      const student = await Student.create({
        school_id: parseInt(targetSchoolId, 10),
        class_id: class_id ? parseInt(class_id, 10) : null,
        first_name,
        last_name,
        admission_number: admission_number || `ADM-${Date.now().toString().slice(-4)}`,
        roll_number: roll_number || null,
        grade: grade || 'Grade 10-A',
        section: section || 'A',
        gender: gender || 'male',
        dob: dob || null,
        guardian_name: guardian_name || null,
        guardian_phone: guardian_phone || null,
        alternate_phone: alternate_phone || null,
        parent_id,
        photo: photoPath,
        nfc_card_uid: nfc_card_uid || null,
        is_bus_service_enabled: is_bus_service_enabled === 'true' || is_bus_service_enabled === true,
        bus_route_id: bus_route_id || null,
        bus_stop_id: bus_stop_id || null,
        status: 'active'
      }, { transaction });

      let resolvedYearId = academic_year_id ? parseInt(academic_year_id) : null;
      if (!resolvedYearId) {
        const activeYear = await AcademicYear.findOne({
          where: { school_id: parseInt(targetSchoolId, 10), is_active: true }
        });
        resolvedYearId = activeYear?.id || null;
      }

      if (resolvedYearId) {
        await StudentAcademicSession.create({
          student_id: student.id,
          academic_year_id: resolvedYearId,
          school_id: parseInt(targetSchoolId, 10),
          grade: grade || 'Grade 10-A',
          section: section || 'A',
          roll_number: roll_number || null,
          status: 'ENROLLED'
        }, { transaction });
      }

      await transaction.commit();

      const studentData = new StudentResource(student).toJson();
      studentData.academic_year_id = resolvedYearId;
      return this.sendResponse(res, studentData, 'Student admission created successfully', 201);
    } catch (error) {
      await transaction.rollback();
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
        first_name, last_name, admission_number, roll_number, grade, section, gender, dob,
        guardian_name, guardian_phone, guardian_address, alternate_phone, nfc_card_uid,
        is_bus_service_enabled, bus_route_id, bus_stop_id, status, class_id
      } = req.body;

      if (class_id !== undefined) student.class_id = class_id ? parseInt(class_id, 10) : null;

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
      if (roll_number !== undefined) student.roll_number = roll_number || null;
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

      if (req.file) {
        if (student.photo) removeFile(student.photo);
        student.photo = `/uploads/students/${req.file.filename}`;
      }

      await student.save();

      if (guardian_address !== undefined && student.parent_id) {
        await Parent.update(
          { address: guardian_address || null },
          { where: { id: student.parent_id } }
        );
      }

      const updatedStudent = await Student.findByPk(id, {
        include: [
          { model: BusRoute, as: 'busRoute' },
          { model: BusStop, as: 'busStop' }
        ]
      });

      return this.sendResponse(res, new StudentResource(updatedStudent).toJson(), 'Student profile updated successfully');
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

      if (!student) return this.sendError(res, 'Student record not found', 404);

      if (student.photo) removeFile(student.photo);

      await student.destroy();
      return this.sendResponse(res, null, 'Student record deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      return this.sendError(res, 'Failed to delete student: ' + error.message, 500);
    }
  }

  /**
   * Toggle student active status
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const student = await Student.findByPk(id);

      if (!student) return this.sendError(res, 'Student record not found', 404);

      student.status = status || (student.status === 'active' ? 'inactive' : 'active');
      await student.save();

      return this.sendResponse(res, { status: student.status }, `Student status updated to ${student.status}`);
    } catch (error) {
      console.error('Error toggling student status:', error);
      return this.sendError(res, 'Failed to update student status: ' + error.message, 500);
    }
  }

  /**
   * Bulk promote students from one academic year to another.
   */
  async promoteStudents(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { from_academic_year_id, to_academic_year_id, students } = req.body;

      if (!from_academic_year_id || !to_academic_year_id) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'from_academic_year_id and to_academic_year_id are required');
      }

      if (!Array.isArray(students) || students.length === 0) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'students array is required and must not be empty');
      }

      const targetYear = await AcademicYear.findByPk(to_academic_year_id);
      if (!targetYear) {
        await transaction.rollback();
        return this.sendError(res, 'Target academic year not found', 404);
      }

      const results = { promoted: [], detained: [], passedOut: [], skipped: [] };

      for (const item of students) {
        const { student_id, new_grade, new_section, status = 'PROMOTED' } = item;

        const currentSession = await StudentAcademicSession.findOne({
          where: { student_id, academic_year_id: from_academic_year_id, school_id },
          transaction
        });

        if (!currentSession) {
          results.skipped.push(student_id);
          continue;
        }

        await currentSession.update({ status }, { transaction });

        if (status === 'PROMOTED' || status === 'DETAINED') {
          const existingNext = await StudentAcademicSession.findOne({
            where: { student_id, academic_year_id: to_academic_year_id },
            transaction
          });

          if (!existingNext) {
            await StudentAcademicSession.create({
              student_id,
              academic_year_id: to_academic_year_id,
              school_id,
              grade: new_grade || currentSession.grade,
              section: new_section || currentSession.section,
              status: 'ENROLLED'
            }, { transaction });
          }

          if (status === 'PROMOTED' && new_grade) {
            await Student.update(
              { grade: new_grade, section: new_section || currentSession.section },
              { where: { id: student_id }, transaction }
            );
          }

          if (status === 'PROMOTED') results.promoted.push(student_id);
          else results.detained.push(student_id);

        } else if (status === 'PASSED_OUT') {
          await Student.update({ status: 'inactive' }, { where: { id: student_id }, transaction });
          results.passedOut.push(student_id);
        }
      }

      await transaction.commit();

      return this.sendResponse(res, {
        summary: {
          promoted: results.promoted.length,
          detained: results.detained.length,
          passedOut: results.passedOut.length,
          skipped: results.skipped.length
        },
        details: results
      }, `Bulk promotion completed: ${results.promoted.length} promoted, ${results.detained.length} detained, ${results.passedOut.length} passed out.`);

    } catch (error) {
      await transaction.rollback();
      console.error('Error promoting students:', error);
      return this.sendError(res, 'Failed to promote students: ' + error.message, 500);
    }
  }

  /**
   * Get student academic session records for promotion modal
   */
  async getStudentSessions(req, res) {
    try {
      const { academic_year_id, school_id } = req.query;
      const targetSchoolId = school_id || req.headers['x-school-id'] || 1;

      const whereClause = { school_id: targetSchoolId };
      if (academic_year_id) whereClause.academic_year_id = academic_year_id;

      const sessions = await StudentAcademicSession.findAll({
        where: whereClause,
        include: [{ model: Student, as: 'student' }],
        order: [['createdAt', 'DESC']]
      });

      const list = sessions.map(s => ({
        id: s.id,
        student_id: s.student_id,
        student_name: s.student ? `${s.student.first_name || ''} ${s.student.last_name || ''}`.trim() : 'Student',
        admission_number: s.student?.admission_number || `ADM-${s.student_id}`,
        session_grade: s.grade,
        session_section: s.section,
        session_status: s.status,
        photo: s.student?.photo || null
      }));

      if (list.length === 0) {
        const students = await Student.findAll({
          where: { school_id: targetSchoolId, status: 'active' }
        });
        const fallbackList = students.map(s => ({
          id: s.id,
          student_id: s.id,
          student_name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          admission_number: s.admission_number || `ADM-${s.id}`,
          session_grade: s.grade || 'Grade 10',
          session_section: s.section || 'A',
          session_status: 'ENROLLED',
          photo: s.photo || null
        }));
        return this.sendResponse(res, fallbackList, 'Active students list retrieved for promotion');
      }

      return this.sendResponse(res, list, 'Session students retrieved successfully');
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      return this.sendError(res, 'Failed to fetch student sessions: ' + error.message, 500);
    }
  }
}

module.exports = new SchoolStudentController();
