'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const packages = [
      {
        id: 1,
        code: 'TRANSPORT_ONLY',
        name: 'Smart Bus & Transport Only',
        description: 'Dedicated fleet GPS live tracking, bus routes, stops, bus NFC driver tap logs, and student transit management.',
        icon: 'Bus',
        badge_color: 'amber',
        modules: JSON.stringify(['transport', 'students']),
        is_active: true,
        sort_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        code: 'SCHOOL_ONLY',
        name: 'School ERP Standard',
        description: 'Complete academic management: classes, teachers, students, timetable matrix, student fees, and classroom attendance.',
        icon: 'BookOpen',
        badge_color: 'blue',
        modules: JSON.stringify(['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years']),
        is_active: true,
        sort_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        code: 'FULL_SUITE',
        name: 'Full Suite (School + Transport)',
        description: 'Complete all-in-one School ERP integrated with Smart Bus Live GPS Fleet Tracking and NFC telemetry.',
        icon: 'Layers',
        badge_color: 'indigo',
        modules: JSON.stringify(['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years', 'transport']),
        is_active: true,
        sort_order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const pkg of packages) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM packages WHERE code = '${pkg.code}' LIMIT 1`
      );

      if (existing[0].length === 0) {
        await queryInterface.bulkInsert('packages', [pkg]);
        console.log(`Package Seeded: ${pkg.name} (${pkg.code})`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('packages', null, {});
  }
};
