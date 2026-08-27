const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Inquiry = sequelize.define('Inquiry', {
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
  representative_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  school_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  module_interest: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'full_suite'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONTACTED', 'SCHEDULED', 'RESOLVED', 'CLOSED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'inquiries',
  timestamps: true,
  underscored: true
});

module.exports = Inquiry;
