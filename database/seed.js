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
  BusAttendanceLog,
  BillingSetting,
  SchoolSubscription,
  AcademicYear,
  StudentAcademicSession
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
      address: 'Greenwood Campus, Main Highway Road, Andheri West, Mumbai',
      latitude: 19.1136,
      longitude: 72.8697
    });

    // 1.1 Create Default Academic Year
    console.log('Seeding Academic Year...');
    const academicYear = await AcademicYear.create({
      school_id: school.id,
      year_name: '2026-2027',
      start_date: '2026-06-01',
      end_date: '2027-04-30',
      is_active: true,
      status: 'ACTIVE',
      description: 'Standard Academic Session'
    });

    // 2. Create System Admin
    console.log('Seeding Admins...');
    await Admin.create({
      name: 'System Admin',
      email: 'admin@school.com',
      password: defaultPassword
    });

    // 2.1 Seed Default Billing Settings
    console.log('Seeding Billing Settings...');
    await BillingSetting.create({
      base_fee_monthly: 1000.00,
      base_fee_yearly: 10000.00,
      student_fee_monthly: 10.00,
      student_fee_yearly: 100.00,
      bus_fee_monthly: 100.00,
      bus_fee_yearly: 1000.00,
      yearly_discount_percent: 15.00,
      tax_rate_percent: 18.00
    });

    // 2.2 Seed Default Subscription for Greenwood School
    console.log('Seeding School Subscription...');
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(startsAt.getDate() + 30); // 30 days from now
    const sub1 = await SchoolSubscription.create({
      school_id: school.id,
      plan_type: 'monthly',
      status: 'active',
      max_students_limit: 50,
      max_buses_limit: 5,
      starts_at: startsAt,
      ends_at: endsAt
    });

    // 2.3 Seed Subscription Transactions & Invoices
    console.log('Seeding Transactions & Invoices...');
    const { SubscriptionTransaction, SchoolInvoice } = require('../app/Models');

    // Successful transaction
    const txn1 = await SubscriptionTransaction.create({
      school_id: school.id,
      subscription_id: sub1.id,
      gateway_transaction_id: 'TXN_PAY_9824104812',
      amount: 2360.00,
      currency: 'INR',
      status: 'success',
      payment_method: 'UPI / Razorpay'
    });

    await SchoolInvoice.create({
      school_id: school.id,
      transaction_id: txn1.id,
      invoice_number: 'INV-2026-0001',
      billing_date: startsAt,
      amount_due: 2360.00,
      amount_paid: 2360.00,
      tax_amount: 360.00,
      status: 'paid',
      invoice_pdf_url: null
    });

    // Previous transaction
    const prevStartsAt = new Date();
    prevStartsAt.setDate(prevStartsAt.getDate() - 35);

    const txn2 = await SubscriptionTransaction.create({
      school_id: school.id,
      subscription_id: sub1.id,
      gateway_transaction_id: 'TXN_PAY_8841029411',
      amount: 2360.00,
      currency: 'INR',
      status: 'success',
      payment_method: 'Credit Card / Stripe',
      createdAt: prevStartsAt
    });

    await SchoolInvoice.create({
      school_id: school.id,
      transaction_id: txn2.id,
      invoice_number: 'INV-2026-0000',
      billing_date: prevStartsAt,
      amount_due: 2360.00,
      amount_paid: 2360.00,
      tax_amount: 360.00,
      status: 'paid',
      invoice_pdf_url: null,
      createdAt: prevStartsAt
    });

    // 3. Create Default School Classes
    console.log('Seeding School Classes...');
    const { SchoolClass } = require('../app/Models');
    const class10A = await SchoolClass.create({
      school_id: school.id,
      class_name: 'Grade 10',
      section: 'A',
      room_number: '301',
      capacity: 40,
      status: 'active'
    });

    const class9B = await SchoolClass.create({
      school_id: school.id,
      class_name: 'Grade 9',
      section: 'B',
      room_number: '202',
      capacity: 40,
      status: 'active'
    });

    const class8A = await SchoolClass.create({
      school_id: school.id,
      class_name: 'Grade 8',
      section: 'A',
      room_number: '101',
      capacity: 40,
      status: 'active'
    });

    const class5B = await SchoolClass.create({
      school_id: school.id,
      class_name: 'Grade 5',
      section: 'B',
      room_number: '105',
      capacity: 35,
      status: 'active'
    });

    const class1A = await SchoolClass.create({
      school_id: school.id,
      class_name: 'Grade 1',
      section: 'A',
      room_number: '102',
      capacity: 30,
      status: 'active'
    });

    // 4. Create Class Teachers
    console.log('Seeding Teachers...');
    const teacher1 = await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1001',
      name: 'Vikram Mehta',
      email: 'teacher@school.com',
      password: defaultPassword,
      subject: 'Mathematics',
      qualification: 'M.Sc, B.Ed',
      gender: 'male',
      phone: '9876543202',
      nfc_card_uid: 'TEACHER_CARD_001',
      status: 'active'
    });

    const teacher2 = await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1002',
      name: 'Sunita Sharma',
      email: 'sunita.sharma@school.com',
      password: defaultPassword,
      subject: 'Science & Physics',
      qualification: 'Ph.D in Physics',
      gender: 'female',
      phone: '9876543203',
      nfc_card_uid: 'TEACHER_CARD_002',
      status: 'active'
    });

    const teacher3 = await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1003',
      name: 'Rajesh Kulkarni',
      email: 'rajesh.kulkarni@school.com',
      password: defaultPassword,
      subject: 'English Literature',
      qualification: 'M.A. English, B.Ed',
      gender: 'male',
      phone: '9876543204',
      nfc_card_uid: 'TEACHER_CARD_003',
      status: 'active'
    });

    const teacher4 = await Teacher.create({
      school_id: school.id,
      employee_id: 'EMP-1004',
      name: 'Pooja Verma',
      email: 'pooja.verma@school.com',
      password: defaultPassword,
      subject: 'Computer Science',
      qualification: 'B.Tech CSE, M.Tech',
      gender: 'female',
      phone: '9876543205',
      nfc_card_uid: 'TEACHER_CARD_004',
      status: 'active'
    });

    // Seed relational teacher class assignments for the active session
    const { TeacherClassAssignment } = require('../app/Models');
    if (class10A) await TeacherClassAssignment.create({ school_id: school.id, teacher_id: teacher1.id, class_id: class10A.id, academic_year_id: academicYear.id });
    if (class9B)  await TeacherClassAssignment.create({ school_id: school.id, teacher_id: teacher2.id, class_id: class9B.id,  academic_year_id: academicYear.id });
    if (class8A)  await TeacherClassAssignment.create({ school_id: school.id, teacher_id: teacher3.id, class_id: class8A.id,  academic_year_id: academicYear.id });
    if (class5B)  await TeacherClassAssignment.create({ school_id: school.id, teacher_id: teacher4.id, class_id: class5B.id,  academic_year_id: academicYear.id });

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

    // 6. Create Bus Stops with GPS Coordinates
    console.log('Seeding Bus Stops...');
    const stop1 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Borivali Station East',
      sequence: 1,
      pickup_time: '07:00:00',
      drop_off_time: '14:30:00',
      latitude: 19.2290,
      longitude: 72.8570
    });

    const stop2 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Kandivali Highway Junction',
      sequence: 2,
      pickup_time: '07:15:00',
      drop_off_time: '14:15:00',
      latitude: 19.2060,
      longitude: 72.8650
    });

    const stop3 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Malad Highway Junction',
      sequence: 3,
      pickup_time: '07:30:00',
      drop_off_time: '14:00:00',
      latitude: 19.1860,
      longitude: 72.8600
    });

    const stop4 = await BusStop.create({
      route_id: route1.id,
      stop_name: 'Goregaon Hub',
      sequence: 4,
      pickup_time: '07:45:00',
      drop_off_time: '13:45:00',
      latitude: 19.1550,
      longitude: 72.8620
    });

    // Route 2 Stops
    const stop5 = await BusStop.create({
      route_id: route2.id,
      stop_name: 'Dadar Circle',
      sequence: 1,
      pickup_time: '07:00:00',
      drop_off_time: '14:30:00',
      latitude: 19.0178,
      longitude: 72.8478
    });

    const stop6 = await BusStop.create({
      route_id: route2.id,
      stop_name: 'Sion Circle',
      sequence: 2,
      pickup_time: '07:15:00',
      drop_off_time: '14:15:00',
      latitude: 19.0390,
      longitude: 72.8610
    });

    const stop7 = await BusStop.create({
      route_id: route2.id,
      stop_name: 'Kurla West Station',
      sequence: 3,
      pickup_time: '07:30:00',
      drop_off_time: '14:00:00',
      latitude: 19.0680,
      longitude: 72.8750
    });

    const stop8 = await BusStop.create({
      route_id: route2.id,
      stop_name: 'Ghatkopar Link Road',
      sequence: 4,
      pickup_time: '07:45:00',
      drop_off_time: '13:45:00',
      latitude: 19.0860,
      longitude: 72.8890
    });

    // 7. Create Buses
    console.log('Seeding Buses...');
    const bus1 = await Bus.create({
      bus_number: 'MH-02-AZ-1111',
      driver_name: 'Ramesh Singh',
      driver_phone: '9876543220',
      route_id: route1.id,
      device_id: 'BUS_101_SCAN',
      current_lat: 19.2288,
      current_lng: 72.8541,
      last_location_update: new Date()
    });

    const bus2 = await Bus.create({
      bus_number: 'MH-01-AX-2222',
      driver_name: 'Mahesh Patil',
      driver_phone: '9876543221',
      route_id: route2.id,
      device_id: 'BUS_202_SCAN',
      current_lat: 19.0178,
      current_lng: 72.8478,
      last_location_update: new Date()
    });

    // 8. Create Enrolled Students
    console.log('Seeding Enrolled Students...');
    const student1 = await Student.create({
      school_id: school.id,
      first_name: 'Rahul',
      last_name: 'Gupta',
      admission_number: 'ADM-1001',
      roll_number: '101',
      grade: 'Grade 10-A',
      section: 'A',
      gender: 'male',
      dob: '2011-04-15',
      guardian_name: 'Ramesh Gupta',
      guardian_phone: '9876543210',
      parent_id: parent1.id,
      class_id: class10A.id,
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
      roll_number: '102',
      grade: 'Grade 10-A',
      section: 'A',
      gender: 'male',
      dob: '2011-08-20',
      guardian_name: 'Ramesh Gupta',
      guardian_phone: '9876543210',
      parent_id: parent1.id,
      class_id: class10A.id,
      nfc_card_uid: 'STUDENT_CARD_002',
      is_bus_service_enabled: false,
      status: 'active'
    });

    const student3 = await Student.create({
      school_id: school.id,
      first_name: 'Priya',
      last_name: 'Patel',
      admission_number: 'ADM-1003',
      roll_number: '103',
      grade: 'Grade 9-B',
      section: 'B',
      gender: 'female',
      dob: '2012-05-10',
      guardian_name: 'Suresh Patel',
      guardian_phone: '9876543211',
      parent_id: parent2.id,
      class_id: class9B.id,
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
      roll_number: '104',
      grade: 'Grade 8-A',
      section: 'A',
      gender: 'male',
      dob: '2013-11-12',
      guardian_name: 'Meeta Shah',
      guardian_phone: '9876543212',
      class_id: class8A.id,
      nfc_card_uid: 'STUDENT_CARD_004',
      is_bus_service_enabled: true,
      bus_route_id: route2.id,
      bus_stop_id: stop6.id,
      status: 'active'
    });

    const student5 = await Student.create({
      school_id: school.id,
      first_name: 'Ananya',
      last_name: 'Deshmukh',
      admission_number: 'ADM-1005',
      roll_number: '105',
      grade: 'Grade 5-B',
      section: 'B',
      gender: 'female',
      dob: '2016-02-28',
      guardian_name: 'Vikram Deshmukh',
      guardian_phone: '9876543213',
      class_id: class5B.id,
      nfc_card_uid: 'STUDENT_CARD_005',
      is_bus_service_enabled: true,
      bus_route_id: route1.id,
      bus_stop_id: stop1.id,
      status: 'active'
    });

    // 8.1 Seed Student Academic Sessions for 2026-2027
    console.log('Seeding Student Academic Sessions...');
    const sessionData = [
      { student: student1, grade: 'Grade 10-A', section: 'A', roll_number: '101' },
      { student: student2, grade: 'Grade 10-A', section: 'A', roll_number: '102' },
      { student: student3, grade: 'Grade 9-B',  section: 'B', roll_number: '103' },
      { student: student4, grade: 'Grade 8-A',  section: 'A', roll_number: '104' },
      { student: student5, grade: 'Grade 5-B',  section: 'B', roll_number: '105' },
    ];
    for (const s of sessionData) {
      await StudentAcademicSession.create({
        student_id: s.student.id,
        academic_year_id: academicYear.id,
        school_id: school.id,
        grade: s.grade,
        section: s.section,
        roll_number: s.roll_number,
        status: 'ENROLLED'
      });
    }

    // 9. Attendance logs
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await AttendanceLog.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      student_id: student1.id,
      nfc_card_uid: 'STUDENT_CARD_001',
      date: yesterdayStr,
      log_type: 'CHECK_IN',
      scan_timestamp: new Date(yesterdayStr + 'T07:55:00'),
      gate_name: 'Main Gate',
      status: 'SUCCESS'
    });

    // 10. Seed Student Fees and Payments
    console.log('Seeding Fee Categories, Allocations, and Payments...');
    const { FeeCategory, StudentFee, FeePayment } = require('../app/Models');

    // Create fee categories
    const tuitionFee = await FeeCategory.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      name: 'Monthly Tuition Fee',
      amount: 4500.00,
      due_date: '2026-08-30',
      description: 'Monthly tuition fees for academic instruction.'
    });

    const sportsFee = await FeeCategory.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      name: 'Annual Sports Fee',
      amount: 1500.00,
      due_date: '2026-09-15',
      description: 'Annual fee for sports and physical training facilities.'
    });

    const examFee = await FeeCategory.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      name: 'Term 1 Exam Fee',
      amount: 800.00,
      due_date: '2026-08-25',
      description: 'Examination fee for Term 1.'
    });

    // Allocate fees to student1 (Nitin Verma, Grade 10-A)
    const s1Tuition = await StudentFee.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      student_id: student1.id,
      fee_category_id: tuitionFee.id,
      amount: 4500.00,
      paid_amount: 4500.00,
      discount_amount: 0.00,
      status: 'paid',
      due_date: tuitionFee.due_date
    });

    await FeePayment.create({
      school_id: school.id,
      student_fee_id: s1Tuition.id,
      amount_paid: 4500.00,
      payment_date: '2026-08-05',
      payment_mode: 'online',
      reference_number: 'UPI_TXN_88421094',
      remarks: 'Full payment via UPI',
      receipt_number: 'REC-2026-08-0001'
    });

    // Allocate fees to student5 (Ananya Deshmukh, Grade 5-B) - Partially Paid
    const s5Tuition = await StudentFee.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      student_id: student5.id,
      fee_category_id: tuitionFee.id,
      amount: 4500.00,
      paid_amount: 2000.00,
      discount_amount: 500.00, // Scholarship discount
      status: 'partially_paid',
      due_date: tuitionFee.due_date
    });

    await FeePayment.create({
      school_id: school.id,
      student_fee_id: s5Tuition.id,
      amount_paid: 2000.00,
      payment_date: '2026-08-08',
      payment_mode: 'cash',
      remarks: 'Paid cash at counter, discount applied',
      receipt_number: 'REC-2026-08-0002'
    });

    // Allocate Term 1 Exam Fee to Nitin Verma - Unpaid
    await StudentFee.create({
      school_id: school.id,
      academic_year_id: academicYear.id,
      student_id: student1.id,
      fee_category_id: examFee.id,
      amount: 800.00,
      paid_amount: 0.00,
      status: 'unpaid',
      due_date: examFee.due_date
    });

    console.log('All mock data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
