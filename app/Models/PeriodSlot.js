const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PeriodSlot = sequelize.define('PeriodSlot', {
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
  period_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  is_break: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'period_slots',
  timestamps: true
});

module.exports = PeriodSlot;
