'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('academic_years', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'),
        defaultValue: 'UPCOMING',
      },
      description: {
        type: Sequelize.TEXT,
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
        allowNull: true,
      }
    });

    await queryInterface.addIndex('academic_years', ['school_id', 'year_name'], {
      unique: true,
      name: 'unique_school_year_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('academic_years');
  }
};
