const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Bus = sequelize.define('Bus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bus_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  driver_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  driver_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  device_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  current_lat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  current_lng: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  last_location_update: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'buses',
  timestamps: true,
  paranoid: true
});

module.exports = Bus;
