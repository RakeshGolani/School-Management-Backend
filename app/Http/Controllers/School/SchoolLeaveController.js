const BaseController = require('../BaseController');
const { StudentLeave, Student, SchoolClass, Teacher, AttendanceLog, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

/**
 * SchoolLeaveController
 * Handles institutional Leave Management & Review operations for School Admin.
 */
class SchoolLeaveController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.review = this.review.bind(this);
  }

  /**
   * Get all student leave applications for the school
   * GET /api/school/leaves
   */
  async index(req, res) {
    try {
      const schoolId = req.user?.id || req.query.school_id || 1;
      const { class_id, status, search } = req.query;

      let whereClause = { school_id: schoolId };

      if (class_id && class_id !== 'all') {
        whereClause.class_id = class_id;
      }

      if (status && status !== 'ALL') {
        whereClause.status = status.toUpperCase();
      }

      const leaves = await StudentLeave.findAll({
        where: whereClause,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number', 'photo', 'gender', 'guardian_name', 'guardian_phone', 'alternate_phone']
          },
          {
            model: SchoolClass,
            as: 'schoolClass',
            attributes: ['id', 'class_name', 'section', 'room_number']
          },
          {
            model: Teacher,
            as: 'teacher',
            attributes: ['id', 'name', 'photo']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Fetch all classes for dropdown filter
      const classes = await SchoolClass.findAll({
        where: { school_id: schoolId },
        order: [['class_name', 'ASC'], ['section', 'ASC']]
      });

      // Calculate institutional leave stats
      const total = leaves.length;
      const pending = leaves.filter(l => l.status === 'PENDING').length;
      const approved = leaves.filter(l => l.status === 'APPROVED').length;
      const rejected = leaves.filter(l => l.status === 'REJECTED').length;
      const totalDaysApproved = leaves
        .filter(l => l.status === 'APPROVED')
        .reduce((sum, l) => sum + (l.days_count || 0), 0);

      const getLeaveTypeLabel = (type) => {
        const map = {
          sick: 'Sick Leave',
          casual: 'Casual Leave',
          medical: 'Medical Emergency',
          vacation: 'Vacation / Family Event',
          other: 'Special Permission'
        };
        return map[type] || 'General Leave';
      };

      const formattedLeaves = leaves.map(l => {
        const s = l.student || {};
        let appliedOnFormatted = '';
        let startFormatted = l.start_date;
        let endFormatted = l.end_date;
        let reviewedOnFormatted = '';

        try {
          if (l.createdAt) {
            appliedOnFormatted = new Date(l.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          }
          if (l.start_date) {
            startFormatted = new Date(l.start_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          }
          if (l.end_date) {
            endFormatted = new Date(l.end_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          }
          if (l.reviewed_at) {
            reviewedOnFormatted = new Date(l.reviewed_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
        } catch (e) {}

        return {
          id: l.id,
          student_id: l.student_id,
          student_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student',
          admission_number: s.admission_number || 'ADM-000',
          roll_number: s.roll_number || '--',
          student_photo: s.photo || null,
          student_image_url: s.image_url || s.photo || null,
          gender: s.gender || 'MALE',
          guardian_name: s.guardian_name || 'Guardian',
          emergency_contact: l.emergency_contact || s.guardian_phone || s.alternate_phone || '--',
          class_id: l.class_id,
          class_name: l.schoolClass ? `${l.schoolClass.class_name} - ${l.schoolClass.section}` : '--',
          room_number: l.schoolClass?.room_number || '--',
          leave_type: l.leave_type,
          leave_type_label: getLeaveTypeLabel(l.leave_type),
          start_date: l.start_date,
          start_date_formatted: startFormatted,
          end_date: l.end_date,
          end_date_formatted: endFormatted,
          days_count: l.days_count,
          reason: l.reason,
          status: l.status,
          teacher_remarks: l.teacher_remarks,
          reviewer_name: l.reviewed_by_name || (l.reviewed_by_role === 'SCHOOL_ADMIN' ? 'School Administration' : (l.teacher?.name ? `${l.teacher.name} (Class Teacher)` : 'School Authority')),
          reviewed_by_role: l.reviewed_by_role || (l.reviewed_at ? 'TEACHER' : null),
          applied_on: appliedOnFormatted,
          reviewed_at: l.reviewed_at,
          reviewed_on_formatted: reviewedOnFormatted
        };
      });

      return this.sendResponse(res, {
        stats: {
          total,
          pending,
          approved,
          rejected,
          total_days_approved: totalDaysApproved
        },
        classes: classes.map(c => ({
          value: c.id,
          label: `${c.class_name} - ${c.section}`
        })),
        leaves: formattedLeaves
      }, 'School student leaves retrieved successfully');

    } catch (error) {
      console.error('Error in SchoolLeaveController.index:', error);
      return this.sendError(res, 'Failed to fetch student leaves: ' + error.message, 500);
    }
  }

  /**
   * School Admin Review Student Leave (Approve or Reject)
   * PUT /api/school/leaves/:id/review
   */
  async review(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!id) {
        return this.sendError(res, 'Leave application ID is required.', 400);
      }

      if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
        return this.sendError(res, "Review status must be either 'APPROVED' or 'REJECTED'.", 400);
      }

      const leave = await StudentLeave.findByPk(id, {
        include: [
          { model: Student, as: 'student' },
          { model: SchoolClass, as: 'schoolClass' }
        ]
      });

      if (!leave) {
        return this.sendError(res, 'Leave application record not found.', 404);
      }

      const newStatus = status.toUpperCase();
      const finalRemarks = remarks ? remarks.trim() : (newStatus === 'APPROVED' ? 'Approved by School Administration' : 'Rejected by School Administration');

      await leave.update({
        status: newStatus,
        teacher_remarks: finalRemarks,
        reviewed_by_role: 'SCHOOL_ADMIN',
        reviewed_by_name: 'School Administration',
        reviewed_at: new Date()
      });

      // If approved, automatically sync attendance logs
      if (newStatus === 'APPROVED') {
        try {
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const existingLog = await AttendanceLog.findOne({
              where: {
                student_id: leave.student_id,
                date: dateStr
              }
            });

            if (existingLog) {
              await existingLog.update({
                status: 'leave',
                remarks: `Approved Leave (Admin): ${leave.reason || 'Leave'}`
              });
            } else {
              await AttendanceLog.create({
                student_id: leave.student_id,
                school_id: leave.school_id,
                date: dateStr,
                status: 'leave',
                remarks: `Approved Leave (Admin): ${leave.reason || 'Leave'}`
              });
            }
          }
        } catch (attErr) {
          console.warn('Attendance sync notice on admin leave approval:', attErr.message);
        }
      }

      return this.sendResponse(res, leave, `Leave application marked as ${newStatus} by School Administration`);

    } catch (error) {
      console.error('Error in SchoolLeaveController.review:', error);
      return this.sendError(res, 'Failed to review leave application: ' + error.message, 500);
    }
  }
}

module.exports = new SchoolLeaveController();
