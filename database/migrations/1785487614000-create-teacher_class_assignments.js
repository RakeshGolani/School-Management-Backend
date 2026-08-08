'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('teacher_class_assignments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teachers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'school_classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('teacher_class_assignments', ['teacher_id']);
    await queryInterface.addIndex('teacher_class_assignments', ['school_id', 'class_name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('teacher_class_assignments');
  }
};
