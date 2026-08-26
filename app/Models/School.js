const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const School = sequelize.define('School', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 19.1136
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 72.8697
  },
  logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  primary_color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#0047AB'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active'
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'packages',
      key: 'id'
    }
  },
  logo_url: {
    type: DataTypes.VIRTUAL,
    get() {
      const logo = this.getDataValue('logo');
      if (logo && typeof logo === 'string' && logo.trim() !== '') {
        if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:image')) {
          return logo;
        }
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        return `${baseUrl}${logo.startsWith('/') ? logo : `/${logo}`}`;
      }
      return null;
    }
  }
}, {
  tableName: 'schools',
  timestamps: true,
  paranoid: true
});

module.exports = School;
