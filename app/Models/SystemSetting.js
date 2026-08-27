const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
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
  company_name: {
    type: DataTypes.STRING,
    defaultValue: 'Vidyadmin'
  },
  tagline: {
    type: DataTypes.STRING,
    defaultValue: 'Simplifying Education, Empowering Admins'
  },
  support_email: {
    type: DataTypes.STRING,
    defaultValue: 'support@vidyadmin.com'
  },
  support_phone: {
    type: DataTypes.STRING,
    defaultValue: '+91 9876543210'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: 'Vidyadmin Global HQ, Tech Horizon Tower'
  },
  gstin: {
    type: DataTypes.STRING,
    defaultValue: '27AAAAA0000A1Z5'
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const raw = this.getDataValue('logo_url');
      if (raw && typeof raw === 'string' && raw.trim() !== '') {
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image')) {
          return raw;
        }
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        return `${baseUrl}${raw.startsWith('/') ? raw : `/${raw}`}`;
      }
      return null;
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});

module.exports = SystemSetting;
