const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const BusStop = sequelize.define('BusStop', {
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
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stop_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sequence: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pickup_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  drop_off_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'bus_stops',
  timestamps: true,
  paranoid: true
});

module.exports = BusStop;
