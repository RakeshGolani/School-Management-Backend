'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('school_classes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        defaultValue: 1
      },
      class_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      section: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'A'
      },
      class_teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teachers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      room_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 40
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('school_classes', ['school_id', 'class_name', 'section']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('school_classes');
  }
};
