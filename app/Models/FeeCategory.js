const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const FeeCategory = sequelize.define('FeeCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'fee_categories',
  timestamps: true,
  paranoid: true
});

module.exports = FeeCategory;
