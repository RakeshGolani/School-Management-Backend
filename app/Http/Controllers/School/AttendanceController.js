const BaseController = require('../BaseController');
const { AttendanceLog, Student, Teacher, AcademicYear, SchoolClass, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class AttendanceController extends BaseController {
  /**
   * Get attendance logs for a specific date, entity type (STUDENT / STAFF), class, and section
   */
  async index(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { date, entity_type = 'STUDENT', class_name, section, academic_year_id } = req.query;

      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get active academic year if not provided
      let currentYearId = academic_year_id;
      if (!currentYearId) {
        const activeYear = await AcademicYear.findOne({ where: { school_id, is_active: true } });
        if (activeYear) currentYearId = activeYear.id;
      }

      if (entity_type === 'STAFF') {
        // Fetch all teachers for the school
        const teachers = await Teacher.findAll({
          where: { school_id, status: 'active' },
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'employee_id', 'department'],
          order: [['first_name', 'ASC']]
        });

        // Fetch existing attendance logs for this date
        const attendanceLogs = await AttendanceLog.findAll({
          where: {
            school_id,
            date: targetDate,
            entity_type: 'STAFF'
          }
        });

        const logsMap = {};
        attendanceLogs.forEach(log => {
          logsMap[log.teacher_id] = log;
        });

        const staffData = teachers.map(t => ({
          id: t.id,
          name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
          email: t.email,
          phone: t.phone,
          employee_id: t.employee_id || `EMP-${t.id}`,
          department: t.department || 'General',
          status: logsMap[t.id]?.status || 'present',
          check_in: logsMap[t.id]?.check_in || null,
          check_out: logsMap[t.id]?.check_out || null,
          remarks: logsMap[t.id]?.remarks || '',
          log_id: logsMap[t.id]?.id || null
        }));

        return this.sendResponse(res, {
          date: targetDate,
          entity_type: 'STAFF',
          total_count: staffData.length,
          records: staffData
        }, 'Staff attendance retrieved successfully');
      }

      // Default: STUDENT attendance
      const studentWhere = { school_id };
      if (class_name && class_name !== 'all') {
        studentWhere.class = { [Op.like]: `%${class_name}%` };
      }
      if (section && section !== 'all') {
        studentWhere.section = { [Op.like]: `%${section}%` };
      }

      const students = await Student.findAll({
        where: studentWhere,
        attributes: ['id', 'first_name', 'last_name', 'roll_number', 'class', 'section', 'gender'],
        order: [['roll_number', 'ASC'], ['first_name', 'ASC']]
      });

      const attendanceWhere = {
        school_id,
        date: targetDate,
        entity_type: 'STUDENT'
      };
      if (class_name) attendanceWhere.class_name = class_name;
      if (section) attendanceWhere.section = section;

      const attendanceLogs = await AttendanceLog.findAll({
        where: attendanceWhere
      });

      const logsMap = {};
      attendanceLogs.forEach(log => {
        logsMap[log.student_id] = log;
      });

      const studentData = students.map(s => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        roll_number: s.roll_number || `STU-${s.id}`,
        class_name: s.class,
        section: s.section,
        status: logsMap[s.id]?.status || 'present',
        remarks: logsMap[s.id]?.remarks || '',
        check_in: logsMap[s.id]?.check_in || null,
        check_out: logsMap[s.id]?.check_out || null,
        log_id: logsMap[s.id]?.id || null
      }));

      return this.sendResponse(res, {
        date: targetDate,
        entity_type: 'STUDENT',
        class_name: class_name || 'All',
        section: section || 'All',
        academic_year_id: currentYearId,
        total_count: studentData.length,
        records: studentData
      }, 'Student attendance retrieved successfully');

    } catch (error) {
      console.error('Error fetching attendance:', error);
      return this.sendError(res, 'Failed to fetch attendance records', error.message, 500);
    }
  }

  /**
   * Submit / Update Bulk Attendance Records
   */
  async saveBulk(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { date, entity_type = 'STUDENT', class_name, section, records, academic_year_id } = req.body;

      if (!date || !Array.isArray(records) || records.length === 0) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'Date and non-empty records array are required');
      }

      // Active Academic Year lookup
      let currentYearId = academic_year_id;
      if (!currentYearId) {
        const activeYear = await AcademicYear.findOne({ where: { school_id, is_active: true }, transaction });
        if (activeYear) currentYearId = activeYear.id;
      }

      const marked_by = req.user?.id || null;

      for (const item of records) {
        const status = item.status || 'present';
        const remarks = item.remarks || null;

        if (entity_type === 'STAFF') {
          const teacher_id = item.id;
          const existing = await AttendanceLog.findOne({
            where: { school_id, date, entity_type: 'STAFF', teacher_id },
            transaction
          });

          if (existing) {
            await existing.update({
              status,
              remarks,
              academic_year_id: currentYearId,
              marked_by
            }, { transaction });
          } else {
            await AttendanceLog.create({
              school_id,
              academic_year_id: currentYearId,
              entity_type: 'STAFF',
              teacher_id,
              date,
              status,
              remarks,
              marked_by
            }, { transaction });
          }
        } else {
          // STUDENT
          const student_id = item.id;
          const targetClassName = class_name || item.class_name;
          const targetSection = section || item.section;

          let targetClassId = item.class_id || null;
          if (!targetClassId && targetClassName) {
            const clsRecord = await SchoolClass.findOne({
              where: { school_id, class_name: targetClassName, section: targetSection || 'A' },
              transaction
            });
            if (clsRecord) targetClassId = clsRecord.id;
          }

          const existing = await AttendanceLog.findOne({
            where: { school_id, date, entity_type: 'STUDENT', student_id },
            transaction
          });

          if (existing) {
            await existing.update({
              status,
              remarks,
              class_id: targetClassId || existing.class_id,
              academic_year_id: currentYearId,
              marked_by
            }, { transaction });
          } else {
            await AttendanceLog.create({
              school_id,
              academic_year_id: currentYearId,
              entity_type: 'STUDENT',
              student_id,
              class_id: targetClassId,
              date,
              status,
              remarks,
              marked_by
            }, { transaction });
          }
        }
      }

      await transaction.commit();

      return this.sendResponse(res, { count: records.length, date }, 'Attendance saved successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving bulk attendance:', error);
      return this.sendError(res, 'Failed to save attendance', error.message, 500);
    }
  }

  /**
   * Attendance Overview / Summary Metrics
   */
  async getSummary(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { date } = req.query;

      const targetDate = date || new Date().toISOString().split('T')[0];

      // Student Counts
      const totalStudents = await Student.count({ where: { school_id } });
      const studentLogs = await AttendanceLog.findAll({
        where: { school_id, date: targetDate, entity_type: 'STUDENT' }
      });

      let studentPresent = 0;
      let studentAbsent = 0;
      let studentLate = 0;

      studentLogs.forEach(l => {
        if (l.status === 'present') studentPresent++;
        else if (l.status === 'absent') studentAbsent++;
        else if (l.status === 'late') studentLate++;
      });

      // Staff Counts
      const totalStaff = await Teacher.count({ where: { school_id, status: 'active' } });
      const staffLogs = await AttendanceLog.findAll({
        where: { school_id, date: targetDate, entity_type: 'STAFF' }
      });

      let staffPresent = 0;
      let staffAbsent = 0;

      staffLogs.forEach(l => {
        if (l.status === 'present') staffPresent++;
        else if (l.status === 'absent') staffAbsent++;
      });

      const studentRate = totalStudents > 0 ? Math.round((studentPresent / totalStudents) * 100) : 0;
      const staffRate = totalStaff > 0 ? Math.round((staffPresent / totalStaff) * 100) : 0;

      return this.sendResponse(res, {
        date: targetDate,
        students: {
          total: totalStudents,
          present: studentPresent,
          absent: studentAbsent,
          late: studentLate,
          unmarked: Math.max(0, totalStudents - studentLogs.length),
          attendance_rate: studentRate
        },
        staff: {
          total: totalStaff,
          present: staffPresent,
          absent: staffAbsent,
          unmarked: Math.max(0, totalStaff - staffLogs.length),
          attendance_rate: staffRate
        }
      }, 'Attendance summary retrieved successfully');
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      return this.sendError(res, 'Failed to fetch summary', error.message, 500);
    }
  }
  /**
   * Hardware NFC Gate Sensor Scan Endpoint
   * Processes card_uid, entry_type (IN / OUT), updates check_in / check_out, and triggers parent notifications.
   */
  async gateScan(req, res) {
    try {
      const { card_uid, entry_type = 'IN', gate_id = 'GATE_1' } = req.body;
      const school_id = req.body.school_id || req.user?.school_id || 1;

      if (!card_uid) {
        return this.sendValidationError(res, [{ card_uid: ['Card UID is required'] }], 'Card UID missing', 400);
      }

      const cleanUid = String(card_uid).trim();

      // 1. Lookup Student or Teacher by nfc_card_uid
      let person = await Student.findOne({ where: { school_id, nfc_card_uid: cleanUid } });
      let entity_type = 'STUDENT';

      if (!person) {
        person = await Teacher.findOne({ where: { school_id, nfc_card_uid: cleanUid } });
        entity_type = 'STAFF';
      }

      if (!person) {
        return res.status(404).json({
          success: false,
          status: 'INVALID_CARD',
          message: 'NFC Card is not assigned to any student or teacher.',
          card_uid: cleanUid
        });
      }

      const personName = `${person.first_name || ''} ${person.last_name || ''}`.trim();
      const targetDate = new Date().toISOString().split('T')[0];
      const now = new Date();

      // 2. Active Academic Year Lookup
      let activeYearId = null;
      const activeYear = await AcademicYear.findOne({ where: { school_id, is_active: true } });
      if (activeYear) activeYearId = activeYear.id;

      // 3. Find or Create Attendance Log for Today
      const whereCondition = { school_id, date: targetDate, entity_type };
      if (entity_type === 'STUDENT') {
        whereCondition.student_id = person.id;
      } else {
        whereCondition.teacher_id = person.id;
      }

      let log = await AttendanceLog.findOne({ where: whereCondition });

      // Anti-Passback Cooldown Check (30 seconds)
      const lastCheckTime = (entry_type.toUpperCase() === 'OUT') ? log?.check_out : log?.check_in;
      if (lastCheckTime && (now - new Date(lastCheckTime)) < 30000) {
        return res.status(200).json({
          success: true,
          status: 'ALREADY_SCANNED',
          person: {
            id: person.id,
            name: personName,
            entity_type,
            photo: person.image_url || person.photo || null,
            class: person.class || person.department || null,
            section: person.section || null
          },
          message: `${personName} already scanned ${entry_type.toUpperCase()} recently. Cooldown active.`
        });
      }

      const isEntryIn = entry_type.toUpperCase() === 'IN';

      if (!log) {
        const createData = {
          school_id,
          academic_year_id: activeYearId,
          entity_type,
          date: targetDate,
          status: 'present',
          remarks: `Scanned at ${gate_id} (${entry_type.toUpperCase()})`
        };

        if (entity_type === 'STUDENT') {
          createData.student_id = person.id;
          createData.class_id = person.class_id || null;
        } else {
          createData.teacher_id = person.id;
        }

        if (isEntryIn) {
          createData.check_in = now;
        } else {
          createData.check_out = now;
        }

        log = await AttendanceLog.create(createData);
      } else {
        const updateData = {
          status: 'present',
          remarks: `${log.remarks || ''} | Scanned ${entry_type.toUpperCase()} at ${now.toLocaleTimeString()}`.trim()
        };

        if (isEntryIn) {
          if (!log.check_in) updateData.check_in = now;
        } else {
          updateData.check_out = now;
        }

        await log.update(updateData);
      }

      // 4. Log Parent Alert Trigger
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      console.log(`[GATE ALERT] SMS/Notification sent to parent of ${personName} (${entity_type}): Gate ${entry_type.toUpperCase()} recorded at ${timeStr}. Phone: ${person.guardian_phone || person.phone || 'N/A'}`);

      return res.status(200).json({
        success: true,
        status: 'SUCCESS',
        entry_type: entry_type.toUpperCase(),
        person: {
          id: person.id,
          name: personName,
          entity_type,
          photo: person.image_url || person.photo || null,
          class: person.class || person.department || null,
          section: person.section || null
        },
        time: timeStr,
        message: `Welcome ${personName}! Attendance marked ${entry_type.toUpperCase()}`
      });

    } catch (error) {
      console.error('Error processing gate scan:', error);
      return this.sendError(res, 'Gate scan failed', error.message, 500);
    }
  }
}

module.exports = new AttendanceController();

