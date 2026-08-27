const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const StudentAcademicSession = sequelize.define('StudentAcademicSession', {
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
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roll_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ENROLLED', 'PROMOTED', 'DETAINED', 'PASSED_OUT'),
    defaultValue: 'ENROLLED'
  }
}, {
  tableName: 'student_academic_sessions',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'academic_year_id']
    }
  ]
});

module.exports = StudentAcademicSession;
