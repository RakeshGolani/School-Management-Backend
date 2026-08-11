'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fee_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      student_fee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'student_fees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      payment_mode: {
        type: Sequelize.ENUM('cash', 'card', 'bank_transfer', 'online', 'other'),
        allowNull: false,
        defaultValue: 'cash'
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
    await queryInterface.dropTable('fee_payments');
  }
};
