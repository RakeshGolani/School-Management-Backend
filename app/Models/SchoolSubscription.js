const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SchoolSubscription = sequelize.define('SchoolSubscription', {
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
  plan_type: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  status: {
    type: DataTypes.ENUM('active', 'trialing', 'past_due', 'unpaid', 'cancelled'),
    allowNull: false,
    defaultValue: 'trialing'
  },
  max_students_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  max_buses_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  starts_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ends_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  gateway_customer_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gateway_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  custom_base_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_base_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_student_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_student_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_bus_fee_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_bus_fee_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custom_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  }
}, {
  tableName: 'school_subscriptions',
  timestamps: true,
  paranoid: true
});

module.exports = SchoolSubscription;
