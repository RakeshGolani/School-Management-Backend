const BaseController = require('../BaseController');
const { Notification, NotificationRead, Teacher, SchoolClass, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class TeacherNotificationController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
  }

  /**
   * Helper to extract teacher id from headers/query/user
   */
  getTeacherContext(req) {
    const teacherId = req.headers['x-teacher-id'] || req.query.teacher_id || (req.user && req.user.id);
    const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
    return { teacherId: teacherId ? parseInt(teacherId, 10) : null, schoolId };
  }

  /**
   * Get notifications for Teacher
   */
  async index(req, res) {
    try {
      const { teacherId, schoolId } = this.getTeacherContext(req);
      if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher ID is required' });
      }

      const { type, is_read, search, priority } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      const teacher = await Teacher.findByPk(teacherId, {
        include: [{ model: SchoolClass, as: 'managedClasses', attributes: ['id'] }]
      });

      const managedClassIds = teacher && teacher.managedClasses ? teacher.managedClasses.map(c => c.id) : [];

      const orConditions = [
        // Direct notifications targeted to this teacher
        { recipient_type: 'TEACHER', recipient_id: teacherId },
        // Broadcasts to all teachers in this school
        { recipient_type: 'TEACHER', recipient_id: null },
        // General school broadcasts
        { recipient_type: 'BROADCAST', target_class_id: null }
      ];

      // If teacher manages classes, include broadcasts for those classes
      if (managedClassIds.length > 0) {
        orConditions.push({
          recipient_type: 'BROADCAST',
          target_class_id: { [Op.in]: managedClassIds }
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
      console.error('TeacherNotificationController.index error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Get unread count for teacher
   */
  async getUnreadCount(req, res) {
    try {
      const { teacherId, schoolId } = this.getTeacherContext(req);
      if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher ID is required' });
      }

      const count = await Notification.count({
        where: {
          recipient_type: 'TEACHER',
          recipient_id: teacherId,
          is_read: false
        }
      });

      return res.status(200).json({ success: true, data: { unread_count: count } });
    } catch (error) {
      console.error('TeacherNotificationController.getUnreadCount error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const { teacherId } = this.getTeacherContext(req);

      const notification = await this.findByUuidOrPk(Notification, id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      if (notification.recipient_id === teacherId) {
        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();
      } else if (notification.recipient_type === 'BROADCAST' || !notification.recipient_id) {
        // Record in NotificationRead table
        await NotificationRead.findOrCreate({
          where: {
            notification_id: id,
            user_type: 'TEACHER',
            user_id: teacherId
          },
          defaults: {
            notification_id: id,
            user_type: 'TEACHER',
            user_id: teacherId,
            read_at: new Date()
          }
        });
      }

      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('TeacherNotificationController.markAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark all notifications as read for teacher
   */
  async markAllAsRead(req, res) {
    try {
      const { teacherId } = this.getTeacherContext(req);
      if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher ID is required' });
      }

      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { recipient_type: 'TEACHER', recipient_id: teacherId, is_read: false } }
      );

      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('TeacherNotificationController.markAllAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new TeacherNotificationController();
