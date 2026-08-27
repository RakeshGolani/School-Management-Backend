'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const packagesData = [
      {
        id: 1,
        code: 'TRANSPORT_ONLY',
        name: 'Smart Bus Fleet',
        tagline: 'GPS Telemetry & Transit Safety',
        description: 'Dedicated fleet GPS live tracking, bus routes, stops, bus NFC driver tap logs, and student transit management.',
        badge_text: 'Transport Special',
        icon: 'Bus',
        badge_color: 'amber',
        monthly_price: 3499.00,
        annual_price: 2799.00,
        currency: 'INR',
        currency_symbol: '₹',
        is_popular: false,
        modules: JSON.stringify(['transport', 'students']),
        is_active: true,
        sort_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        code: 'FULL_SUITE',
        name: 'Full Institutional Suite',
        tagline: 'Complete School ERP + Smart Bus Fleet',
        description: 'Complete all-in-one School ERP integrated with Smart Bus Live GPS Fleet Tracking and NFC telemetry.',
        badge_text: 'Most Popular • All-in-One',
        icon: 'Layers',
        badge_color: 'indigo',
        monthly_price: 9999.00,
        annual_price: 7999.00,
        currency: 'INR',
        currency_symbol: '₹',
        is_popular: true,
        modules: JSON.stringify(['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years', 'transport']),
        is_active: true,
        sort_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        code: 'SCHOOL_ONLY',
        name: 'Academic Core ERP',
        tagline: 'Academics, Grading & Operations',
        description: 'Complete academic management: classes, teachers, students, timetable matrix, student fees, and classroom attendance.',
        badge_text: 'ERP Core',
        icon: 'BookOpen',
        badge_color: 'blue',
        monthly_price: 5999.00,
        annual_price: 4799.00,
        currency: 'INR',
        currency_symbol: '₹',
        is_popular: false,
        modules: JSON.stringify(['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years']),
        is_active: true,
        sort_order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const featuresMap = {
      'TRANSPORT_ONLY': [
        'Live GPS Fleet Tracking (OSRM Navigation)',
        'NFC/RFID Bus Boarding & Deboarding Logs',
        'Real-time Parent ETA & Stop Push Alerts',
        'Driver, Vehicle & Fuel Maintenance Logs',
        'Speed Alerts & Safe Route Geo-Fencing',
        'Dedicated Transport Manager Dashboard'
      ],
      'FULL_SUITE': [
        'Everything in Academic ERP + Smart Bus Fleet',
        'Dynamic Multi-Campus & Multi-Role Access',
        'NFC Dual Gateway (Campus Gate & Bus Entry)',
        'Automated Fee Invoicing & Online Gateway (Stripe)',
        'Zero-Conflict Master Timetable Engine',
        'Smart PDF Student & Teacher ID Cards with Barcode',
        'Priority 24/7 SLA Support & Dedicated Training'
      ],
      'SCHOOL_ONLY': [
        'Class & Section Dynamic Master Management',
        'Class Teacher & Single Assignment Matrix',
        'Attendance Tracking (Period & Daily)',
        'Exams, Grading Scales & Report Cards',
        'Student Profile 360° Hub & Documents',
        'Fee Category & Installment Schedule'
      ]
    };

    for (const pkg of packagesData) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM packages WHERE code = '${pkg.code}' LIMIT 1`
      );

      let planId;
      if (existing[0].length === 0) {
        const [insertedId] = await queryInterface.bulkInsert('packages', [pkg]);
        planId = insertedId || pkg.id;
        console.log(`Plan Seeded: ${pkg.name} (${pkg.code})`);
      } else {
        planId = existing[0][0].id;
        await queryInterface.bulkUpdate('packages', {
          name: pkg.name,
          tagline: pkg.tagline,
          description: pkg.description,
          badge_text: pkg.badge_text,
          icon: pkg.icon,
          badge_color: pkg.badge_color,
          monthly_price: pkg.monthly_price,
          annual_price: pkg.annual_price,
          currency: pkg.currency,
          currency_symbol: pkg.currency_symbol,
          is_popular: pkg.is_popular,
          modules: pkg.modules,
          is_active: pkg.is_active,
          sort_order: pkg.sort_order,
          updatedAt: new Date()
        }, { id: planId });
        console.log(`Plan Updated: ${pkg.name} (${pkg.code})`);
      }

      // Seed features for this plan
      const planFeatures = featuresMap[pkg.code] || [];
      if (planFeatures.length > 0) {
        // Clear existing features for idempotence
        await queryInterface.bulkDelete('plan_features', { plan_id: planId });

        const featureRows = planFeatures.map((feat, idx) => ({
          uuid: Sequelize.literal('(UUID())'),
          plan_id: planId,
          feature_text: feat,
          sort_order: idx + 1,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('plan_features', featureRows);
        console.log(`Seeded ${featureRows.length} features for plan: ${pkg.name}`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('plan_features', null, {});
    await queryInterface.bulkDelete('packages', null, {});
  }
};
