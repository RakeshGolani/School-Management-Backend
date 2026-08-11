'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_fees', {
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
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'academic_years',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fee_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fee_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('unpaid', 'partially_paid', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid'
      },
      due_date: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.dropTable('student_fees');
  }
};
