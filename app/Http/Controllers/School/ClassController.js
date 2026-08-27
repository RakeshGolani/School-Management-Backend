const BaseController = require('../BaseController');
const { SchoolClass, Teacher, Student, Parent, TeacherClassAssignment, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class ClassController extends BaseController {
  /**
   * Get all classes and sections for a school
   */
  async index(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || req.headers['x-school-id'] || 1;
      const { search, status } = req.query;

      const whereClause = { school_id };
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      if (search) {
        const trimmed = search.trim();
        whereClause[Op.or] = [
          { class_name: { [Op.like]: `%${trimmed}%` } },
          { section: { [Op.like]: `%${trimmed}%` } },
          { room_number: { [Op.like]: `%${trimmed}%` } }
        ];
      }

      const classes = await SchoolClass.findAll({
        where: whereClause,
        include: [
          { 
            model: Teacher, 
            as: 'classTeacher',
            attributes: ['id', 'name', 'email', 'phone', 'employee_id'],
            required: false
          },
          {
            model: TeacherClassAssignment,
            as: 'classAssignments',
            required: false,
            include: [{
              model: Teacher,
              as: 'teacher',
              attributes: ['id', 'name', 'email', 'phone', 'employee_id']
            }]
          }
        ],
        order: [['class_name', 'ASC'], ['section', 'ASC']]
      });

      // Merge: if classTeacher is null, pull from classAssignments[0].teacher
      const enriched = classes.map(cls => {
        const raw = cls.toJSON();
        if (!raw.classTeacher && raw.classAssignments && raw.classAssignments.length > 0) {
          raw.classTeacher = raw.classAssignments[0].teacher;
        }
        return raw;
      });

      return this.sendResponse(res, enriched, 'School classes retrieved successfully');

    } catch (error) {
      console.error('Error fetching school classes:', error);
      return this.sendError(res, 'Failed to fetch classes', error.message, 500);
    }
  }

  /**
   * Create a new class & section
   */
  async store(req, res) {
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { class_name, section = 'A', class_teacher_id, room_number, capacity, status = 'active' } = req.body;

      if (!class_name) {
        return this.sendValidationError(res, [], 'class_name is required');
      }

      // Check unique class_name + section for this school
      const existing = await SchoolClass.findOne({
        where: { school_id, class_name, section }
      });

      if (existing) {
        return this.sendValidationError(
          res, 
          { section: [`Class '${class_name}-${section}' already exists in this school.`] }, 
          `Class '${class_name}-${section}' already exists.`
        );
      }

      const newClass = await SchoolClass.create({
        school_id,
        class_name,
        section,
        class_teacher_id: class_teacher_id || null,
        room_number: room_number || null,
        capacity: capacity ? parseInt(capacity, 10) : 40,
        status
      });

      const fullClass = await SchoolClass.findByPk(newClass.id, {
        include: [{ model: Teacher, as: 'classTeacher', attributes: ['id', 'name', 'email'] }]
      });

      return this.sendResponse(res, fullClass, 'Class created successfully', 201);
    } catch (error) {
      console.error('Error creating class:', error);
      return this.sendError(res, 'Failed to create class', error.message, 500);
    }
  }

  /**
   * Update existing class details / assigned teacher
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { class_name, section, class_teacher_id, room_number, capacity, status } = req.body;

      const schoolClass = await this.findByUuidOrPk(SchoolClass, id);
      if (!schoolClass) {
        return this.sendError(res, 'Class record not found', null, 404);
      }

      await schoolClass.update({
        class_name: class_name || schoolClass.class_name,
        section: section || schoolClass.section,
        class_teacher_id: class_teacher_id !== undefined ? (class_teacher_id || null) : schoolClass.class_teacher_id,
        room_number: room_number !== undefined ? room_number : schoolClass.room_number,
        capacity: capacity ? parseInt(capacity, 10) : schoolClass.capacity,
        status: status || schoolClass.status
      });

      const updatedClass = await this.findByUuidOrPk(SchoolClass, id, {
        include: [{ model: Teacher, as: 'classTeacher', attributes: ['id', 'name', 'email'] }]
      });

      return this.sendResponse(res, updatedClass, 'Class updated successfully');
    } catch (error) {
      console.error('Error updating class:', error);
      return this.sendError(res, 'Failed to update class', error.message, 500);
    }
  }

  /**
   * Get class details by ID including teacher and enrolled students
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const schoolClass = await this.findByUuidOrPk(SchoolClass, id, {
        include: [
          {
            model: Teacher,
            as: 'classTeacher',
            attributes: ['id', 'name', 'email', 'phone', 'employee_id', 'subject']
          },
          {
            model: Student,
            as: 'students',
            attributes: [
              'id', 'first_name', 'last_name', 'admission_number', 'grade', 'section', 
              'gender', 'dob', 'guardian_name', 'guardian_phone', 'photo', 'image_url', 'nfc_card_uid', 'status'
            ],
            include: [{
              model: Parent,
              as: 'parent',
              attributes: ['id', 'address']
            }]
          }
        ]
      });

      if (!schoolClass) {
        return this.sendError(res, 'Class record not found', null, 404);
      }

      // Fallback: if class_teacher_id is not set directly, look up via TeacherClassAssignment
      // (happens when teacher is assigned through the Teachers module instead of the Class form)
      let resolvedTeacher = schoolClass.classTeacher;
      if (!resolvedTeacher) {
        const assignment = await TeacherClassAssignment.findOne({
          where: { class_id: schoolClass.id },
          include: [{
            model: Teacher,
            as: 'teacher',
            attributes: ['id', 'name', 'email', 'phone', 'employee_id', 'subject']
          }]
        });
        if (assignment && assignment.teacher) {
          resolvedTeacher = assignment.teacher;
          // Auto-sync class_teacher_id so future queries are consistent
          await schoolClass.update({ class_teacher_id: assignment.teacher_id });
        }
      }

      // Fetch strictly unassigned students (class_id: null) for desk assignment modal
      const unassignedStudents = await Student.findAll({
        where: {
          school_id: schoolClass.school_id,
          class_id: null,
          status: 'active'
        },
        attributes: ['id', 'first_name', 'last_name', 'admission_number', 'grade', 'section', 'gender', 'nfc_card_uid'],
        limit: 100
      });

      const classData = schoolClass.toJSON();
      classData.classTeacher = resolvedTeacher ? (resolvedTeacher.toJSON ? resolvedTeacher.toJSON() : resolvedTeacher) : null;
      if (classData.students) {
        classData.students = classData.students.map(s => {
          if (s.parent && s.parent.address) {
            s.guardian_address = s.parent.address;
          }
          return s;
        });
      }

      return this.sendResponse(res, {
        class: classData,
        unassignedStudents
      }, 'Class details retrieved successfully');
    } catch (error) {
      console.error('Error fetching class details:', error);
      return this.sendError(res, 'Failed to fetch class details', error.message, 500);
    }
  }

  /**
   * Assign a student to this class
   */
  async assignStudent(req, res) {
    try {
      const { id } = req.params;
      const { student_id } = req.body;

      const schoolClass = await this.findByUuidOrPk(SchoolClass, id);
      if (!schoolClass) {
        return this.sendError(res, 'Class record not found', null, 404);
      }

      const student = await this.findByUuidOrPk(Student, student_id);
      if (!student) {
        return this.sendError(res, 'Student record not found', null, 404);
      }

      await student.update({
        class_id: schoolClass.id,
        grade: schoolClass.class_name,
        section: schoolClass.section
      });

      return this.sendResponse(res, student, 'Student assigned to class successfully');
    } catch (error) {
      console.error('Error assigning student to class:', error);
      return this.sendError(res, 'Failed to assign student', error.message, 500);
    }
  }

  /**
   * Unassign a student from this class
   */
  async unassignStudent(req, res) {
    try {
      const { id, studentId } = req.params;
      const schoolClass = await this.findByUuidOrPk(SchoolClass, id);
      const student = await this.findByUuidOrPk(Student, studentId);

      if (!student || !schoolClass || student.class_id !== schoolClass.id) {
        return this.sendError(res, 'Student record not found in this class', null, 404);
      }

      await student.update({ class_id: null });
      return this.sendResponse(res, null, 'Student unassigned from class successfully');
    } catch (error) {
      console.error('Error unassigning student:', error);
      return this.sendError(res, 'Failed to unassign student', error.message, 500);
    }
  }

  /**
   * Delete class record
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const schoolClass = await this.findByUuidOrPk(SchoolClass, id);

      if (!schoolClass) {
        return this.sendError(res, 'Class record not found', null, 404);
      }

      await schoolClass.destroy();
      return this.sendResponse(res, null, 'Class deleted successfully');
    } catch (error) {
      console.error('Error deleting class:', error);
      return this.sendError(res, 'Failed to delete class', error.message, 500);
    }
  }
}

module.exports = new ClassController();
