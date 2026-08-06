const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SubscriptionTransaction = sequelize.define('SubscriptionTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gateway_transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    allowNull: false,
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'subscription_transactions',
  timestamps: true
});

module.exports = SubscriptionTransaction;
