const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TeacherClassAssignment = sequelize.define('TeacherClassAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'teacher_class_assignments',
  timestamps: true
});

module.exports = TeacherClassAssignment;
