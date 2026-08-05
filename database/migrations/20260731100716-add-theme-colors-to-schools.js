'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('schools', 'primary_color', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '#14b8a6' // Default teal/emerald
    });
    await queryInterface.addColumn('schools', 'background_color', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '#0f172a' // Default dark slate
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('schools', 'primary_color');
    await queryInterface.removeColumn('schools', 'background_color');
  }
};
