const { Notification, NotificationRead, Student, Parent, Teacher, SchoolClass, School } = require('../Models');
const socketService = require('./SocketService');

class NotificationService {
  /**
   * Core method to create a single notification
   */
  async createNotification({
    school_id,
    sender_type = 'SYSTEM',
    sender_id = null,
    recipient_type,
    recipient_id = null,
    target_class_id = null,
    title,
    message,
    type = 'GENERAL',
    priority = 'NORMAL',
    action_url = null,
    metadata = null
  }) {
    try {
      const notification = await Notification.create({
        school_id,
        sender_type,
        sender_id,
        recipient_type,
        recipient_id,
        target_class_id,
        title,
        message,
        type,
        priority,
        action_url,
        metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : null,
        is_read: false
      });

      // Emit real-time socket event if socket service is available
      try {
        if (socketService && socketService.io) {
          const payload = {
            notification: notification.toJSON(),
            timestamp: new Date()
          };

          // Room targeting
          if (recipient_type === 'BROADCAST') {
            socketService.io.to(`school_${school_id}`).emit('new_notification', payload);
          } else if (target_class_id) {
            socketService.io.to(`class_${target_class_id}`).emit('new_notification', payload);
          } else if (recipient_id) {
            socketService.io.to(`${recipient_type.toLowerCase()}_${recipient_id}`).emit('new_notification', payload);
          } else {
            socketService.io.to(`school_${school_id}`).emit('new_notification', payload);
          }
        }
      } catch (socketErr) {
        console.warn('Notification socket emit warning:', socketErr.message);
      }

      return notification;
    } catch (err) {
      console.error('NotificationService.createNotification error:', err);
      throw err;
    }
  }

  /**
   * Helper: Attendance Trigger (Alert Parent & Student)
   */
  async notifyAttendance({ school_id, student_id, date, status, remarks = '' }) {
    try {
      const student = await Student.findByPk(student_id, {
        include: [
          { model: Parent, as: 'parent' },
          { model: SchoolClass, as: 'schoolClass' }
        ]
      });

      if (!student) return;

      const studentName = `${student.first_name} ${student.last_name}`;
      const className = student.schoolClass ? `${student.schoolClass.name}-${student.schoolClass.section}` : '';
      const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      
      const isAbsent = status === 'ABSENT';
      const isLate = status === 'LATE';

      const title = isAbsent 
        ? `⚠️ Attendance Alert: ${studentName} Marked Absent`
        : isLate 
          ? `⏰ Attendance Alert: ${studentName} Marked Late`
          : `✅ Attendance Update for ${studentName}`;

      const message = isAbsent
        ? `${studentName} (${className}) has been marked ABSENT on ${formattedDate}.${remarks ? ` Note: ${remarks}` : ' Please contact the school if this is unexpected.'}`
        : isLate
          ? `${studentName} (${className}) arrived LATE on ${formattedDate}.${remarks ? ` Note: ${remarks}` : ''}`
          : `${studentName} attendance updated to ${status} on ${formattedDate}.`;

      const priority = isAbsent ? 'HIGH' : isLate ? 'NORMAL' : 'LOW';

      // 1. Notify Parent (if exists)
      if (student.parent_id) {
        await this.createNotification({
          school_id,
          sender_type: 'SYSTEM',
          recipient_type: 'PARENT',
          recipient_id: student.parent_id,
          title,
          message,
          type: 'ATTENDANCE',
          priority,
          action_url: '/parent/attendance',
          metadata: { student_id, date, status, className }
        });
      }

      // 2. Notify Student
      await this.createNotification({
        school_id,
        sender_type: 'SYSTEM',
        recipient_type: 'STUDENT',
        recipient_id: student.id,
        title,
        message,
        type: 'ATTENDANCE',
        priority,
        action_url: '/student/attendance',
        metadata: { student_id, date, status }
      });
    } catch (err) {
      console.error('NotificationService.notifyAttendance error:', err);
    }
  }

  /**
   * Helper: Fee Payment Received Trigger
   */
  async notifyFeePayment({ school_id, student_id, fee_title, amount, receipt_no }) {
    try {
      const student = await Student.findByPk(student_id, {
        include: [{ model: Parent, as: 'parent' }]
      });
      if (!student) return;

      const studentName = `${student.first_name} ${student.last_name}`;
      const title = `💳 Fee Payment Received: ₹${parseFloat(amount).toLocaleString('en-IN')}`;
      const message = `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} for "${fee_title}" has been successfully recorded for ${studentName}.${receipt_no ? ` Receipt No: ${receipt_no}` : ''}`;

      if (student.parent_id) {
        await this.createNotification({
          school_id,
          sender_type: 'SYSTEM',
          recipient_type: 'PARENT',
          recipient_id: student.parent_id,
          title,
          message,
          type: 'FEE',
          priority: 'NORMAL',
          action_url: '/parent/fees',
          metadata: { student_id, amount, fee_title, receipt_no }
        });
      }

      await this.createNotification({
        school_id,
        sender_type: 'SYSTEM',
        recipient_type: 'STUDENT',
        recipient_id: student.id,
        title,
        message,
        type: 'FEE',
        priority: 'NORMAL',
        action_url: '/student/fees',
        metadata: { student_id, amount, fee_title, receipt_no }
      });
    } catch (err) {
      console.error('NotificationService.notifyFeePayment error:', err);
    }
  }

  /**
   * Helper: Fee Due Reminder Trigger
   */
  async notifyFeeDue({ school_id, student_id, fee_title, amount, due_date }) {
    try {
      const student = await Student.findByPk(student_id);
      if (!student) return;

      const formattedDueDate = due_date ? new Date(due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Soon';
      const title = `📅 Fee Due Reminder: ${fee_title}`;
      const message = `Fee "${fee_title}" of ₹${parseFloat(amount).toLocaleString('en-IN')} is due on ${formattedDueDate}. Kindly pay on time to avoid late fees.`;

      if (student.parent_id) {
        await this.createNotification({
          school_id,
          sender_type: 'SCHOOL',
          recipient_type: 'PARENT',
          recipient_id: student.parent_id,
          title,
          message,
          type: 'FEE',
          priority: 'HIGH',
          action_url: '/parent/fees',
          metadata: { student_id, amount, fee_title, due_date }
        });
      }
    } catch (err) {
      console.error('NotificationService.notifyFeeDue error:', err);
    }
  }

  /**
   * Helper: Smart Bus / Transit Alert
   */
  async notifyTransport({ school_id, student_id, bus_number, stop_name, event_type = 'BOARDED' }) {
    try {
      const student = await Student.findByPk(student_id);
      if (!student || !student.parent_id) return;

      const studentName = `${student.first_name} ${student.last_name}`;
      const isBoarded = event_type === 'BOARDED';
      const title = isBoarded 
        ? `🚌 Bus Alert: ${studentName} Boarded` 
        : `🛑 Bus Alert: ${studentName} Deboarded`;

      const message = isBoarded
        ? `${studentName} safely boarded School Bus (${bus_number || 'Fleet'}) at ${stop_name || 'Designated Stop'} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : `${studentName} deboarded School Bus (${bus_number || 'Fleet'}) at ${stop_name || 'Designated Stop'} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

      await this.createNotification({
        school_id,
        sender_type: 'SYSTEM',
        recipient_type: 'PARENT',
        recipient_id: student.parent_id,
        title,
        message,
        type: 'TRANSPORT',
        priority: 'HIGH',
        action_url: '/parent/transport',
        metadata: { student_id, bus_number, stop_name, event_type }
      });
    } catch (err) {
      console.error('NotificationService.notifyTransport error:', err);
    }
  }

  /**
   * Helper: Student Leave Application (Alert Teacher & School)
   */
  async notifyLeaveApplication({ school_id, leave_id, student_id, class_id, start_date, end_date, reason, days_count }) {
    try {
      const student = await Student.findByPk(student_id, {
        include: [{ model: SchoolClass, as: 'schoolClass' }]
      });
      if (!student) return;

      const studentName = `${student.first_name} ${student.last_name}`;
      const className = student.schoolClass ? `${student.schoolClass.name}-${student.schoolClass.section}` : '';
      const title = `📝 Leave Request: ${studentName} (${className})`;
      const message = `${studentName} requested ${days_count} day(s) leave from ${start_date} to ${end_date}. Reason: "${reason}".`;

      // 1. Alert Class Teacher (if assigned)
      if (student.schoolClass && student.schoolClass.class_teacher_id) {
        await this.createNotification({
          school_id,
          sender_type: 'STUDENT',
          sender_id: student_id,
          recipient_type: 'TEACHER',
          recipient_id: student.schoolClass.class_teacher_id,
          title,
          message,
          type: 'LEAVE',
          priority: 'NORMAL',
          action_url: '/teacher/leaves',
          metadata: { leave_id, student_id, class_id }
        });
      }

      // 2. Alert School Admin
      await this.createNotification({
        school_id,
        sender_type: 'STUDENT',
        sender_id: student_id,
        recipient_type: 'SCHOOL',
        recipient_id: null,
        title,
        message,
        type: 'LEAVE',
        priority: 'NORMAL',
        action_url: '/leaves',
        metadata: { leave_id, student_id, class_id }
      });
    } catch (err) {
      console.error('NotificationService.notifyLeaveApplication error:', err);
    }
  }

  /**
   * Helper: Leave Status Decision (Alert Parent & Student)
   */
  async notifyLeaveDecision({ school_id, leave_id, student_id, status, teacher_remarks = '' }) {
    try {
      const student = await Student.findByPk(student_id);
      if (!student) return;

      const studentName = `${student.first_name} ${student.last_name}`;
      const isApproved = status === 'APPROVED';
      const title = isApproved ? `✅ Leave Approved for ${studentName}` : `❌ Leave Rejected for ${studentName}`;
      const message = isApproved 
        ? `The leave application for ${studentName} has been APPROVED.${teacher_remarks ? ` Remarks: ${teacher_remarks}` : ''}`
        : `The leave application for ${studentName} has been REJECTED.${teacher_remarks ? ` Remarks: ${teacher_remarks}` : ''}`;

      const priority = isApproved ? 'NORMAL' : 'HIGH';

      if (student.parent_id) {
        await this.createNotification({
          school_id,
          sender_type: 'TEACHER',
          recipient_type: 'PARENT',
          recipient_id: student.parent_id,
          title,
          message,
          type: 'LEAVE',
          priority,
          action_url: '/parent/leaves',
          metadata: { leave_id, status, teacher_remarks }
        });
      }

      await this.createNotification({
        school_id,
        sender_type: 'TEACHER',
        recipient_type: 'STUDENT',
        recipient_id: student.id,
        title,
        message,
        type: 'LEAVE',
        priority,
        action_url: '/student/leaves',
        metadata: { leave_id, status, teacher_remarks }
      });
    } catch (err) {
      console.error('NotificationService.notifyLeaveDecision error:', err);
    }
  }

  /**
   * Helper: Broadcast Announcement to Selected Audience
   */
  async broadcastAnnouncement({
    school_id,
    sender_type = 'SCHOOL',
    sender_id = null,
    target_roles = ['TEACHER', 'PARENT', 'STUDENT'],
    target_class_id = null,
    title,
    message,
    priority = 'NORMAL',
    action_url = null
  }) {
    try {
      const createdNotifications = [];

      // If target_class_id is specified, broadcast specifically to that class
      if (target_class_id) {
        const notif = await this.createNotification({
          school_id,
          sender_type,
          sender_id,
          recipient_type: 'BROADCAST',
          target_class_id,
          title,
          message,
          type: 'ANNOUNCEMENT',
          priority,
          action_url,
          metadata: { target_roles, target_class_id }
        });
        createdNotifications.push(notif);
        return createdNotifications;
      }

      // If target_roles contains multiple roles, create targeted broadcast entries
      for (const role of target_roles) {
        const notif = await this.createNotification({
          school_id,
          sender_type,
          sender_id,
          recipient_type: role.toUpperCase(),
          recipient_id: null, // Broadcast to all in this role
          title,
          message,
          type: 'ANNOUNCEMENT',
          priority,
          action_url,
          metadata: { target_roles }
        });
        createdNotifications.push(notif);
      }

      return createdNotifications;
    } catch (err) {
      console.error('NotificationService.broadcastAnnouncement error:', err);
      throw err;
    }
  }
}

module.exports = new NotificationService();
