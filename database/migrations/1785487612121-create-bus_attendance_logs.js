
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bus_attendance_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bus_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      trip_type: {
        type: Sequelize.ENUM('morning_pickup', 'afternoon_drop'),
        allowNull: false,
      },
      event_type: {
        type: Sequelize.ENUM('boarded', 'deboarded'),
        allowNull: false,
      },
      scanned_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.dropTable('bus_attendance_logs');

  }
};
