const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const BusRoute = sequelize.define('BusRoute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  route_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  route_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'bus_routes',
  timestamps: true,
  paranoid: true
});

module.exports = BusRoute;
