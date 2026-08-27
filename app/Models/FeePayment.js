const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const FeePayment = sequelize.define('FeePayment', {
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
    allowNull: false
  },
  student_fee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online', 'other'),
    allowNull: false,
    defaultValue: 'cash'
  },
  reference_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receipt_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'fee_payments',
  timestamps: true,
  paranoid: true
});

module.exports = FeePayment;
