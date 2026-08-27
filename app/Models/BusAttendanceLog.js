const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const BusAttendanceLog = sequelize.define('BusAttendanceLog', {
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
  bus_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stop_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  trip_type: {
    type: DataTypes.ENUM('morning_pickup', 'afternoon_drop'),
    allowNull: false
  },
  event_type: {
    type: DataTypes.ENUM('boarded', 'deboarded'),
    allowNull: false
  },
  scanned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bus_attendance_logs',
  timestamps: true,
  paranoid: true
});

module.exports = BusAttendanceLog;
