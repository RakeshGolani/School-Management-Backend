const BaseController = require('../BaseController');
const { Notification, NotificationRead, SchoolClass, Teacher, Student, Parent, sequelize } = require('../../../Models');
const NotificationService = require('../../../Services/NotificationService');
const { Op } = require('sequelize');

class SchoolNotificationController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Get paginated notifications for School Admin
   */
  async index(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required' });
      }

      const { type, is_read, search, priority } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: schoolId,
        [Op.or]: [
          { recipient_type: 'SCHOOL' },
          { sender_type: 'SCHOOL' },
          { recipient_type: 'BROADCAST' }
        ]
      };

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
      console.error('SchoolNotificationController.index error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required' });
      }

      const count = await Notification.count({
        where: {
          school_id: schoolId,
          recipient_type: 'SCHOOL',
          is_read: false
        }
      });

      return res.status(200).json({ success: true, data: { unread_count: count } });
    } catch (error) {
      console.error('SchoolNotificationController.getUnreadCount error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);

      const notification = await Notification.findOne({
        where: { id, school_id: schoolId }
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();

      return res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
    } catch (error) {
      console.error('SchoolNotificationController.markAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark all notifications as read for current school
   */
  async markAllAsRead(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required' });
      }

      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { school_id: schoolId, recipient_type: 'SCHOOL', is_read: false } }
      );

      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('SchoolNotificationController.markAllAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Broadcast announcement from School Admin
   */
  async broadcast(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.body.school_id || (req.user && req.user.school_id);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required' });
      }

      const { title, message, target_roles, target_class_id, priority, action_url } = req.body;

      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Title and message are required' });
      }

      const roles = Array.isArray(target_roles) && target_roles.length > 0
        ? target_roles
        : ['TEACHER', 'PARENT', 'STUDENT'];

      const notifications = await NotificationService.broadcastAnnouncement({
        school_id: schoolId,
        sender_type: 'SCHOOL',
        sender_id: req.user ? req.user.id : null,
        target_roles: roles,
        target_class_id: target_class_id || null,
        title,
        message,
        priority: priority || 'NORMAL',
        action_url: action_url || null
      });

      return res.status(201).json({
        success: true,
        message: 'Announcement broadcasted successfully',
        data: notifications
      });
    } catch (error) {
      console.error('SchoolNotificationController.broadcast error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Delete a notification
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);

      const deletedCount = await Notification.destroy({
        where: { id, school_id: schoolId }
      });

      if (!deletedCount) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('SchoolNotificationController.destroy error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new SchoolNotificationController();
