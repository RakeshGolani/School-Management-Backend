const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    type: DataTypes.ENUM('present', 'absent', 'late', 'manual'),
    defaultValue: 'present'
  }
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  paranoid: true
});

module.exports = AttendanceLog;
