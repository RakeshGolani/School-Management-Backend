const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TeacherProxy = sequelize.define('TeacherProxy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timetable_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  original_teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  substitute_teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ASSIGNED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'ASSIGNED'
  }
}, {
  tableName: 'teacher_proxies',
  timestamps: true
});

module.exports = TeacherProxy;
