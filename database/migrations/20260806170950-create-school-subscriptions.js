'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('school_subscriptions', {
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
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      plan_type: {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      status: {
        type: Sequelize.ENUM('active', 'trialing', 'past_due', 'unpaid', 'cancelled'),
        allowNull: false,
        defaultValue: 'trialing'
      },
      max_students_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      max_buses_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      gateway_customer_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gateway_subscription_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      custom_base_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_base_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_student_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_student_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_bus_fee_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_bus_fee_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custom_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
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
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('school_subscriptions');
  }
};
