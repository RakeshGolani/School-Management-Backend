const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_name: {
    type: DataTypes.STRING,
    defaultValue: 'EduManage Cloud Solutions'
  },
  tagline: {
    type: DataTypes.STRING,
    defaultValue: 'Next-Generation School ERP'
  },
  support_email: {
    type: DataTypes.STRING,
    defaultValue: 'support@eduschool.io'
  },
  support_phone: {
    type: DataTypes.STRING,
    defaultValue: '+91 9876543210'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: 'Tech Park Tower 4, Educational Corridor, Cyber City'
  },
  gstin: {
    type: DataTypes.STRING,
    defaultValue: '27AAAAA0000A1Z5'
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});

module.exports = SystemSetting;
