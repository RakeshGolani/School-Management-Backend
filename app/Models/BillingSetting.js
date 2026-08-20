const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const BillingSetting = sequelize.define('BillingSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  base_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1000.00
  },
  base_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 10000.00
  },
  student_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 10.00
  },
  student_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100.00
  },
  bus_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100.00
  },
  bus_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1000.00
  },
  yearly_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 15.00
  },
  tax_rate_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 18.00
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  }
}, {
  tableName: 'billing_settings',
  timestamps: true
});

module.exports = BillingSetting;
