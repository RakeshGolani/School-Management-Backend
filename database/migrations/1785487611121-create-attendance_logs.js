
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      entity_type: {
        type: Sequelize.ENUM('STUDENT', 'STAFF'),
        defaultValue: 'STUDENT'
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'school_classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      check_in: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_out: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'late', 'half_day', 'leave', 'manual'),
        defaultValue: 'present',
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      marked_by: {
        type: Sequelize.INTEGER,
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
      },
    });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendance_logs');

  }
};
