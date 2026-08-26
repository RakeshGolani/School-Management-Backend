const BaseController = require('../BaseController');
const { Notification, NotificationRead, Student, SchoolClass, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class StudentNotificationController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
  }

  /**
   * Helper to extract student id from headers/query/user
   */
  getStudentContext(req) {
    const studentId = req.headers['x-student-id'] || req.query.student_id || (req.user && req.user.id);
    const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
    return { studentId: studentId ? parseInt(studentId, 10) : null, schoolId };
  }

  /**
   * Get paginated notifications for student
   */
  async index(req, res) {
    try {
      const { studentId, schoolId } = this.getStudentContext(req);
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
      }

      const { type, is_read, search, priority } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      const student = await Student.findByPk(studentId);
      const studentClassId = student ? student.class_id : null;

      const orConditions = [
        // Direct notifications targeted to this student
        { recipient_type: 'STUDENT', recipient_id: studentId },
        // Broadcasts to all students in school
        { recipient_type: 'STUDENT', recipient_id: null },
        // General school broadcasts
        { recipient_type: 'BROADCAST', target_class_id: null }
      ];

      // If student is in a class, include class broadcasts
      if (studentClassId) {
        orConditions.push({
          recipient_type: 'BROADCAST',
          target_class_id: studentClassId
        });
      }

      const whereClause = {
        [Op.or]: orConditions
      };

      if (schoolId) {
        whereClause.school_id = schoolId;
      }
      if (type && type !== 'ALL') {
        whereClause.type = type;
      }
      if (priority && priority !== 'ALL') {
        whereClause.priority = priority;
      }
      if (is_read !== undefined && is_read !== '') {
        whereClause.is_read = is_read === 'true' || is_read === true || is_read === '1';
      }
      if (search) {
        whereClause[Op.and] = [
          {
            [Op.or]: [
              { title: { [Op.like]: `%${search.trim()}%` } },
              { message: { [Op.like]: `%${search.trim()}%` } }
            ]
          }
        ];
      }

      const { count, rows } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          { model: SchoolClass, as: 'targetClass', attributes: ['id', 'class_name', 'section'] }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: rows,
        meta: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('StudentNotificationController.index error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Get unread count for student
   */
  async getUnreadCount(req, res) {
    try {
      const { studentId } = this.getStudentContext(req);
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
      }

      const count = await Notification.count({
        where: {
          recipient_type: 'STUDENT',
          recipient_id: studentId,
          is_read: false
        }
      });

      return res.status(200).json({ success: true, data: { unread_count: count } });
    } catch (error) {
      console.error('StudentNotificationController.getUnreadCount error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const { studentId } = this.getStudentContext(req);

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      if (notification.recipient_id === studentId) {
        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();
      } else if (notification.recipient_type === 'BROADCAST' || !notification.recipient_id) {
        await NotificationRead.findOrCreate({
          where: {
            notification_id: id,
            user_type: 'STUDENT',
            user_id: studentId
          },
          defaults: {
            notification_id: id,
            user_type: 'STUDENT',
            user_id: studentId,
            read_at: new Date()
          }
        });
      }

      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('StudentNotificationController.markAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark all notifications as read for student
   */
  async markAllAsRead(req, res) {
    try {
      const { studentId } = this.getStudentContext(req);
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
      }

      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { recipient_type: 'STUDENT', recipient_id: studentId, is_read: false } }
      );

      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('StudentNotificationController.markAllAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new StudentNotificationController();
