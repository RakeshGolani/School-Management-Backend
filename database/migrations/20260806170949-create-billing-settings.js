'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('billing_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      base_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1000.00,
      },
      base_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10000.00,
      },
      student_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10.00,
      },
      student_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100.00,
      },
      bus_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100.00,
      },
      bus_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1000.00,
      },
      yearly_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 15.00,
      },
      tax_rate_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.00,
      },
      grace_period_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('billing_settings');
  }
};
