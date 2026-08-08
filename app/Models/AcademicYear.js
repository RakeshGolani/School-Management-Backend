const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AcademicYear = sequelize.define('AcademicYear', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'),
    defaultValue: 'UPCOMING'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'academic_years',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['school_id', 'year_name']
    }
  ]
});

module.exports = AcademicYear;
