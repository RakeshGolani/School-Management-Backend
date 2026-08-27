const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_type: {
    type: DataTypes.ENUM('SCHOOL', 'TEACHER', 'PARENT', 'STUDENT', 'SYSTEM'),
    allowNull: false,
    defaultValue: 'SYSTEM'
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recipient_type: {
    type: DataTypes.ENUM('SCHOOL', 'TEACHER', 'PARENT', 'STUDENT', 'BROADCAST'),
    allowNull: false
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  target_class_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('ATTENDANCE', 'FEE', 'TRANSPORT', 'LEAVE', 'TIMETABLE', 'EXAM', 'ANNOUNCEMENT', 'GENERAL'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'NORMAL'
  },
  action_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  underscored: true,
  timestamps: true
});

module.exports = Notification;
