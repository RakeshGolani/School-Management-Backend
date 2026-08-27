'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_type: {
        type: Sequelize.ENUM('SCHOOL', 'TEACHER', 'PARENT', 'STUDENT', 'SYSTEM'),
        allowNull: false,
        defaultValue: 'SYSTEM'
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      recipient_type: {
        type: Sequelize.ENUM('SCHOOL', 'TEACHER', 'PARENT', 'STUDENT', 'BROADCAST'),
        allowNull: false
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      target_class_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'school_classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('ATTENDANCE', 'FEE', 'TRANSPORT', 'LEAVE', 'TIMETABLE', 'EXAM', 'ANNOUNCEMENT', 'GENERAL'),
        allowNull: false,
        defaultValue: 'GENERAL'
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'NORMAL'
      },
      action_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('notification_reads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      notification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'notifications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_type: {
        type: Sequelize.ENUM('SCHOOL', 'TEACHER', 'PARENT', 'STUDENT'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('notifications', ['school_id', 'recipient_type', 'recipient_id'], {
      name: 'idx_notifications_school_recipient'
    });
    await queryInterface.addIndex('notifications', ['recipient_type', 'recipient_id', 'is_read'], {
      name: 'idx_notifications_unread'
    });
    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'idx_notifications_created_at'
    });
    await queryInterface.addIndex('notification_reads', ['notification_id', 'user_type', 'user_id'], {
      unique: true,
      name: 'idx_unique_notification_user_read'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_reads');
    await queryInterface.dropTable('notifications');
  }
};
