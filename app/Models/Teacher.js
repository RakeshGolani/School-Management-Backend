const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employee_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    defaultValue: 'male'
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  nfc_card_uid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  image_url: {
    type: DataTypes.VIRTUAL,
    get() {
      const photo = this.getDataValue('photo');
      if (photo && typeof photo === 'string' && photo.trim() !== '' && !photo.includes('ui-avatars.com')) {
        if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:image')) {
          return photo;
        }
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        return `${baseUrl}${photo.startsWith('/') ? photo : `/${photo}`}`;
      }
      return null;
    }
  }
}, {
  tableName: 'teachers',
  timestamps: true,
  paranoid: true
});

module.exports = Teacher;
