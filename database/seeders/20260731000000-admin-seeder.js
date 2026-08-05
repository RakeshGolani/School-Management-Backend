'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if admin already exists
    const adminExists = await queryInterface.sequelize.query(
      `SELECT id FROM admins WHERE email = 'admin@edumanage.com'`
    );

    if (adminExists[0].length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await queryInterface.bulkInsert('admins', [{
        name: 'Super Admin',
        email: 'admin@edumanage.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      console.log('Super Admin Seeded Successfully: admin@edumanage.com / Admin@123');
    } else {
      console.log('Super Admin already exists in the database.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('admins', { email: 'admin@edumanage.com' }, {});
  }
};
