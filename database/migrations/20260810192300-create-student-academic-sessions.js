'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_academic_sessions', {
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
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'academic_years',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      grade: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      section: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      roll_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ENROLLED', 'PROMOTED', 'DETAINED', 'PASSED_OUT'),
        defaultValue: 'ENROLLED',
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

    // Unique constraint: one student can only be in one session per academic year
    await queryInterface.addIndex('student_academic_sessions', ['student_id', 'academic_year_id'], {
      unique: true,
      name: 'unique_student_per_academic_year'
    });

    await queryInterface.addIndex('student_academic_sessions', ['school_id', 'academic_year_id'], {
      name: 'idx_school_academic_year'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('student_academic_sessions');
  }
};
