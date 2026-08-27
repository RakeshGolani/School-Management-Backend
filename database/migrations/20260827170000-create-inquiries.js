'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inquiries', {
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
      representative_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      school_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      module_interest: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'full_suite'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONTACTED', 'SCHEDULED', 'RESOLVED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('inquiries', ['status'], {
      name: 'idx_inquiries_status'
    });
    await queryInterface.addIndex('inquiries', ['created_at'], {
      name: 'idx_inquiries_created_at'
    });
    await queryInterface.addIndex('inquiries', ['email'], {
      name: 'idx_inquiries_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inquiries');
  }
};
