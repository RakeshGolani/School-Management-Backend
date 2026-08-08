const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SchoolClass = sequelize.define('SchoolClass', {
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
  class_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  section: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'A'
  },
  class_teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  room_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 40
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'school_classes',
  timestamps: true,
  paranoid: true
});

module.exports = SchoolClass;
