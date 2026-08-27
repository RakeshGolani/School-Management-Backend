const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Timetable = sequelize.define('Timetable', {
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
    allowNull: false,
    defaultValue: 1
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  period_slot_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'),
    allowNull: false
  },
  room_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'timetables',
  timestamps: true
});

module.exports = Timetable;
