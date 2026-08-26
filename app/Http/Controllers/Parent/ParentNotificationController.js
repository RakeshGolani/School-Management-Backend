const BaseController = require('../BaseController');
const { Notification, NotificationRead, Parent, Student, SchoolClass, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class ParentNotificationController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
  }

  /**
   * Helper to extract parent id from headers/query/user
   */
  getParentContext(req) {
    const parentId = req.headers['x-parent-id'] || req.query.parent_id || (req.user && req.user.id);
    const schoolId = req.headers['x-school-id'] || req.query.school_id || (req.user && req.user.school_id);
    return { parentId: parentId ? parseInt(parentId, 10) : null, schoolId };
  }

  /**
   * Get paginated notifications for parent
   */
  async index(req, res) {
    try {
      const { parentId, schoolId } = this.getParentContext(req);
      if (!parentId) {
        return res.status(400).json({ success: false, message: 'Parent ID is required' });
      }

      const { type, is_read, search, priority, student_id } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      // Find children of this parent to know their class IDs and student IDs
      const children = await Student.findAll({
        where: { parent_id: parentId },
        attributes: ['id', 'class_id']
      });

      const childrenIds = children.map(c => c.id);
      const childrenClassIds = children.map(c => c.class_id).filter(Boolean);

      const orConditions = [
        // Direct notifications targeted to this parent
        { recipient_type: 'PARENT', recipient_id: parentId },
        // Broadcasts to all parents in school
        { recipient_type: 'PARENT', recipient_id: null },
        // General school broadcasts
        { recipient_type: 'BROADCAST', target_class_id: null }
      ];

      // If children are in classes, include class broadcasts
      if (childrenClassIds.length > 0) {
        orConditions.push({
          recipient_type: 'BROADCAST',
          target_class_id: { [Op.in]: childrenClassIds }
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
      console.error('ParentNotificationController.index error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Get unread count for parent
   */
  async getUnreadCount(req, res) {
    try {
      const { parentId } = this.getParentContext(req);
      if (!parentId) {
        return res.status(400).json({ success: false, message: 'Parent ID is required' });
      }

      const count = await Notification.count({
        where: {
          recipient_type: 'PARENT',
          recipient_id: parentId,
          is_read: false
        }
      });

      return res.status(200).json({ success: true, data: { unread_count: count } });
    } catch (error) {
      console.error('ParentNotificationController.getUnreadCount error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const { parentId } = this.getParentContext(req);

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      if (notification.recipient_id === parentId) {
        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();
      } else if (notification.recipient_type === 'BROADCAST' || !notification.recipient_id) {
        await NotificationRead.findOrCreate({
          where: {
            notification_id: id,
            user_type: 'PARENT',
            user_id: parentId
          },
          defaults: {
            notification_id: id,
            user_type: 'PARENT',
            user_id: parentId,
            read_at: new Date()
          }
        });
      }

      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('ParentNotificationController.markAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  /**
   * Mark all notifications as read for parent
   */
  async markAllAsRead(req, res) {
    try {
      const { parentId } = this.getParentContext(req);
      if (!parentId) {
        return res.status(400).json({ success: false, message: 'Parent ID is required' });
      }

      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { recipient_type: 'PARENT', recipient_id: parentId, is_read: false } }
      );

      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('ParentNotificationController.markAllAsRead error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new ParentNotificationController();
