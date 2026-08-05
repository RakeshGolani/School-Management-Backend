const { 
  sequelize, 
  School, 
  Admin, 
  Teacher, 
  Parent, 
  Student, 
  BusRoute, 
  BusStop, 
  Bus, 
  AttendanceLog, 
  BusAttendanceLog 
} = require('../app/Models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Starting Database Synchronization...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully. Starting Seeding...');

    // Generate real bcrypt hash for default password '123456'
    const defaultPassword = await bcrypt.hash('123456', 10);

    // 1. Create Default School Institution
    console.log('Seeding Schools...');
    const school = await School.create({
      code: 'SCH-1001',
      school_name: 'Greenwood International School',
      email: 'school@gmail.com',
      password: defaultPassword,
      phone: '+91 9876543200',
      address: '102 Sector 5, Educational Hub, City'
    });

    // 2. Create System Admin
    console.log('Seeding Admins...');
    await Admin.create({
      name: 'System Admin',
      email: 'admin@school.com',
      password: defaultPassword
    });

    // 3. Create Class Teachers
    console.log('Seeding Teachers...');
    await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1001',
      name: 'Vikram Mehta',
      email: 'teacher@school.com',
      password: defaultPassword,
      subject: 'Mathematics',
      qualification: 'M.Sc, B.Ed',
      class_assigned: 'Grade 10-A',
      gender: 'male',
      phone: '9876543202',
      nfc_card_uid: 'TEACHER_CARD_001',
      status: 'active'
    });

    await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1002',
      name: 'Sunita Sharma',
      email: 'sunita.sharma@school.com',
      password: defaultPassword,
      subject: 'Science & Physics',
      qualification: 'Ph.D in Physics',
      class_assigned: 'Grade 9-B',
      gender: 'female',
      phone: '9876543203',
      nfc_card_uid: 'TEACHER_CARD_002',
      status: 'active'
    });

    await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1003',
      name: 'Rajesh Kulkarni',
      email: 'rajesh.kulkarni@school.com',
      password: defaultPassword,
      subject: 'English Literature',
      qualification: 'M.A. English, B.Ed',
      class_assigned: 'Grade 8-A',
      gender: 'male',
      phone: '9876543204',
      nfc_card_uid: 'TEACHER_CARD_003',
      status: 'active'
    });

    await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1004',
      name: 'Pooja Verma',
      email: 'pooja.verma@school.com',
      password: defaultPassword,
      subject: 'Computer Science',
      qualification: 'B.Tech CSE, M.Tech',
      class_assigned: 'Grade 5-B',
      gender: 'female',
      phone: '9876543205',
      nfc_card_uid: 'TEACHER_CARD_004',
      status: 'active'
    });

    // 4. Create Parents
    console.log('Seeding Parents...');
    const parent1 = await Parent.create({
      name: 'Ramesh Gupta',
      email: 'parent@school.com',
      password: defaultPassword,
      phone: '9876543210',
      address: 'Flat 402, Sunshine Apartments, Borivali, Mumbai'
    });

    const parent2 = await Parent.create({
      name: 'Suresh Patel',
      email: 'suresh.patel@gmail.com',
      password: defaultPassword,
      phone: '9876543211',
      address: 'B-12, Royal Palms, Dadar, Mumbai'
    });

    // 5. Create Bus Routes
    console.log('Seeding Bus Routes...');
    const route1 = await BusRoute.create({
      route_name: 'Route 101 - Western Express Highway',
      route_number: 'R-101',
      route_code: 'R-101',
      start_point: 'Borivali Station',
      end_point: 'Greenwood Campus'
    });

    const route2 = await BusRoute.create({
      route_name: 'Route 202 - Central Line Express',
      route_number: 'R-202',
      route_code: 'R-202',
      start_point: 'Dadar Circle',
      end_point: 'Greenwood Campus'
    });

    // 6. Create Bus Stops
    console.log('Seeding Bus Stops...');
    const stop1 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Borivali Station East',
      sequence: 1,
      pickup_time: '07:00:00',
      drop_off_time: '14:30:00'
    });
    const stop2 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Kandivali Highway Junction',
      sequence: 2,
      pickup_time: '07:15:00',
      drop_off_time: '14:15:00'
    });

    const stop6 = await BusStop.create({
      route_id: route2.id,
      stop_name: 'Worli Naka',
      sequence: 3,
      pickup_time: '07:35:00',
      drop_off_time: '14:10:00'
    });

    // 7. Create Buses
    console.log('Seeding Buses...');
    const bus1 = await Bus.create({
      bus_number: 'MH-02-AZ-1111',
      driver_name: 'Ramesh Singh',
      driver_phone: '9876543220',
      route_id: route1.id,
      device_id: 'BUS_101_SCAN'
    });

    // 8. Create Enrolled Students
    console.log('Seeding Enrolled Students...');
    const student1 = await Student.create({
      school_id: school.id,
      first_name: 'Rahul',
      last_name: 'Gupta',
      admission_number: 'ADM-1001',
      grade: 'Grade 10-A',
      section: 'A',
      gender: 'male',
      guardian_name: 'Ramesh Gupta',
      guardian_phone: '9876543210',
      parent_id: parent1.id,
      class_id: '10-A',
      nfc_card_uid: 'STUDENT_CARD_001',
      is_bus_service_enabled: true,
      bus_route_id: route1.id,
      bus_stop_id: stop2.id,
      status: 'active'
    });

    const student2 = await Student.create({
      school_id: school.id,
      first_name: 'Rohan',
      last_name: 'Gupta',
      admission_number: 'ADM-1002',
      grade: 'Grade 10-A',
      section: 'A',
      gender: 'male',
      guardian_name: 'Ramesh Gupta',
      guardian_phone: '9876543210',
      parent_id: parent1.id,
      class_id: '10-A',
      nfc_card_uid: 'STUDENT_CARD_002',
      is_bus_service_enabled: false,
      status: 'active'
    });

    const student3 = await Student.create({
      school_id: school.id,
      first_name: 'Priya',
      last_name: 'Patel',
      admission_number: 'ADM-1003',
      grade: 'Grade 9-B',
      section: 'B',
      gender: 'female',
      guardian_name: 'Suresh Patel',
      guardian_phone: '9876543211',
      parent_id: parent2.id,
      class_id: '9-B',
      nfc_card_uid: 'STUDENT_CARD_003',
      is_bus_service_enabled: true,
      bus_route_id: route2.id,
      bus_stop_id: stop6.id,
      status: 'active'
    });

    const student4 = await Student.create({
      school_id: school.id,
      first_name: 'Aarav',
      last_name: 'Shah',
      admission_number: 'ADM-1004',
      grade: 'Grade 8-A',
      section: 'A',
      gender: 'male',
      guardian_name: 'Meeta Shah',
      guardian_phone: '9876543212',
      class_id: '8-A',
      nfc_card_uid: 'STUDENT_CARD_004',
      is_bus_service_enabled: false,
      status: 'active'
    });

    const student5 = await Student.create({
      school_id: school.id,
      first_name: 'Ananya',
      last_name: 'Deshmukh',
      admission_number: 'ADM-1005',
      grade: 'Grade 5-B',
      section: 'B',
      gender: 'female',
      guardian_name: 'Vikram Deshmukh',
      guardian_phone: '9876543213',
      class_id: '5-B',
      nfc_card_uid: 'STUDENT_CARD_005',
      is_bus_service_enabled: true,
      bus_route_id: route1.id,
      bus_stop_id: stop1.id,
      status: 'active'
    });

    // 9. Attendance logs
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await AttendanceLog.create({
      school_id: school.id,
      student_id: student1.id,
      nfc_card_uid: 'STUDENT_CARD_001',
      date: yesterdayStr,
      log_type: 'CHECK_IN',
      scan_timestamp: new Date(yesterdayStr + 'T07:55:00'),
      gate_name: 'Main Gate',
      status: 'SUCCESS'
    });

    console.log('All mock data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
