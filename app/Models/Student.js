const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  admission_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  roll_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  section: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    defaultValue: 'male'
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  guardian_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guardian_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  alternate_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  class_id: {
    type: DataTypes.INTEGER,
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
  is_bus_service_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bus_route_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bus_stop_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  image_url: {
    type: DataTypes.VIRTUAL,
    get() {
      const photo = this.getDataValue('photo');
      if (photo && typeof photo === 'string' && photo.trim() !== '') {
        return photo;
      }
      const firstName = this.getDataValue('first_name') || '';
      const lastName = this.getDataValue('last_name') || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Student';
      const gender = this.getDataValue('gender');
      const bg = gender === 'female' ? 'ec4899' : '0284c7';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${bg}&color=fff&bold=true`;
    }
  }
}, {
  tableName: 'students',
  timestamps: true,
  paranoid: true
});

module.exports = Student;
