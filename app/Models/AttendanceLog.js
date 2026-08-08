const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  entity_type: {
    type: DataTypes.ENUM('STUDENT', 'STAFF'),
    defaultValue: 'STUDENT'
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_in: {
    type: DataTypes.DATE,
    allowNull: true
  },
  check_out: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'leave'),
    defaultValue: 'present'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  marked_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  paranoid: true
});

module.exports = AttendanceLog;
