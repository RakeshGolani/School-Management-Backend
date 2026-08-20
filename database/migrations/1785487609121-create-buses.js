
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('buses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bus_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      driver_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      driver_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      current_lat: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      current_lng: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      last_location_update: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('buses');

  }
};
