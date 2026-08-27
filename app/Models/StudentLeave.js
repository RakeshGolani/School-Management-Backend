const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const StudentLeave = sequelize.define('StudentLeave', {
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
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  leave_type: {
    type: DataTypes.ENUM('sick', 'casual', 'medical', 'vacation', 'other'),
    allowNull: false,
    defaultValue: 'sick'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  days_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  emergency_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  teacher_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewed_by_role: {
    type: DataTypes.ENUM('TEACHER', 'SCHOOL_ADMIN'),
    allowNull: true,
    defaultValue: null
  },
  reviewed_by_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'student_leaves',
  timestamps: true,
  paranoid: true
});

module.exports = StudentLeave;
