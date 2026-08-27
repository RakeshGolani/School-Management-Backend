'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add pricing and metadata columns to packages
    const tableInfo = await queryInterface.describeTable('packages');

    if (!tableInfo.tagline) {
      await queryInterface.addColumn('packages', 'tagline', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!tableInfo.badge_text) {
      await queryInterface.addColumn('packages', 'badge_text', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.monthly_price) {
      await queryInterface.addColumn('packages', 'monthly_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
    }

    if (!tableInfo.annual_price) {
      await queryInterface.addColumn('packages', 'annual_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
    }

    if (!tableInfo.currency) {
      await queryInterface.addColumn('packages', 'currency', {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'INR'
      });
    }

    if (!tableInfo.currency_symbol) {
      await queryInterface.addColumn('packages', 'currency_symbol', {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '₹'
      });
    }

    if (!tableInfo.is_popular) {
      await queryInterface.addColumn('packages', 'is_popular', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    // 2. Create plan_features table
    await queryInterface.createTable('plan_features', {
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
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'packages',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      feature_text: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('plan_features');
    await queryInterface.removeColumn('packages', 'is_popular');
    await queryInterface.removeColumn('packages', 'currency_symbol');
    await queryInterface.removeColumn('packages', 'currency');
    await queryInterface.removeColumn('packages', 'annual_price');
    await queryInterface.removeColumn('packages', 'monthly_price');
    await queryInterface.removeColumn('packages', 'badge_text');
    await queryInterface.removeColumn('packages', 'tagline');
  }
};
