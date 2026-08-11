const sequelize = require('../../config/database');
const School = require('./School');
const Admin = require('./Admin');
const Teacher = require('./Teacher');
const Parent = require('./Parent');
const Student = require('./Student');
const BusRoute = require('./BusRoute');
const BusStop = require('./BusStop');
const Bus = require('./Bus');
const AttendanceLog = require('./AttendanceLog');
const BusAttendanceLog = require('./BusAttendanceLog');
const BillingSetting = require('./BillingSetting');
const SchoolSubscription = require('./SchoolSubscription');
const SubscriptionTransaction = require('./SubscriptionTransaction');
const SchoolInvoice = require('./SchoolInvoice');
const AcademicYear = require('./AcademicYear');
const StudentAcademicSession = require('./StudentAcademicSession');
const TeacherClassAssignment = require('./TeacherClassAssignment');
const SchoolClass = require('./SchoolClass');
const FeeCategory = require('./FeeCategory');
const StudentFee = require('./StudentFee');
const FeePayment = require('./FeePayment');


// 1. Parent - Student Relationships
Parent.hasMany(Student, { foreignKey: 'parent_id', as: 'children' });
Student.belongsTo(Parent, { foreignKey: 'parent_id', as: 'parent' });

// 2. School - AcademicYear & SchoolClass Relationships
School.hasMany(AcademicYear, { foreignKey: 'school_id', as: 'academicYears' });
AcademicYear.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

School.hasMany(SchoolClass, { foreignKey: 'school_id', as: 'classes' });
SchoolClass.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

SchoolClass.hasMany(Student, { foreignKey: 'class_id', as: 'students' });
Student.belongsTo(SchoolClass, { foreignKey: 'class_id', as: 'schoolClass' });

// 3. Student - AcademicYear / AcademicSession Relationships
AcademicYear.hasMany(StudentAcademicSession, { foreignKey: 'academic_year_id', as: 'studentSessions' });
StudentAcademicSession.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });
Student.hasMany(StudentAcademicSession, { foreignKey: 'student_id', as: 'academicSessions' });
StudentAcademicSession.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 4. School - Teacher, Class Teacher & TeacherClassAssignment Relationships
School.hasMany(Teacher, { foreignKey: 'school_id', as: 'teachers' });
Teacher.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

Teacher.hasMany(TeacherClassAssignment, { foreignKey: 'teacher_id', as: 'assignedClasses' });
TeacherClassAssignment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

SchoolClass.hasMany(TeacherClassAssignment, { foreignKey: 'class_id', as: 'classAssignments' });
TeacherClassAssignment.belongsTo(SchoolClass, { foreignKey: 'class_id', as: 'schoolClass' });

TeacherClassAssignment.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

Teacher.hasMany(SchoolClass, { foreignKey: 'class_teacher_id', as: 'managedClasses' });
SchoolClass.belongsTo(Teacher, { foreignKey: 'class_teacher_id', as: 'classTeacher' });

// 5. BusRoute & Bus Relationships
BusRoute.hasMany(BusStop, { foreignKey: 'route_id', as: 'stops' });
BusStop.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

BusRoute.hasMany(Bus, { foreignKey: 'route_id', as: 'buses' });
Bus.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

// 6. Student - Transport
Student.belongsTo(BusRoute, { foreignKey: 'bus_route_id', as: 'busRoute' });
Student.belongsTo(BusStop, { foreignKey: 'bus_stop_id', as: 'busStop' });

// 7. AttendanceLog Relationships
Student.hasMany(AttendanceLog, { foreignKey: 'student_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
SchoolClass.hasMany(AttendanceLog, { foreignKey: 'class_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(SchoolClass, { foreignKey: 'class_id', as: 'schoolClass' });

Teacher.hasMany(AttendanceLog, { foreignKey: 'teacher_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

School.hasMany(AttendanceLog, { foreignKey: 'school_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

AcademicYear.hasMany(AttendanceLog, { foreignKey: 'academic_year_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

// 8. BusAttendanceLog Relationships
Student.hasMany(BusAttendanceLog, { foreignKey: 'student_id', as: 'busAttendanceLogs' });
BusAttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Bus.hasMany(BusAttendanceLog, { foreignKey: 'bus_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' });

BusRoute.hasMany(BusAttendanceLog, { foreignKey: 'route_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

BusStop.hasMany(BusAttendanceLog, { foreignKey: 'stop_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(BusStop, { foreignKey: 'stop_id', as: 'stop' });

// 9. Billing and Subscription Relationships
School.hasOne(SchoolSubscription, { foreignKey: 'school_id', as: 'subscription' });
SchoolSubscription.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

School.hasMany(SubscriptionTransaction, { foreignKey: 'school_id', as: 'transactions' });
SubscriptionTransaction.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

School.hasMany(SchoolInvoice, { foreignKey: 'school_id', as: 'invoices' });
SchoolInvoice.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

SchoolSubscription.hasMany(SubscriptionTransaction, { foreignKey: 'subscription_id', as: 'transactions' });
SubscriptionTransaction.belongsTo(SchoolSubscription, { foreignKey: 'subscription_id', as: 'subscription' });

SubscriptionTransaction.hasOne(SchoolInvoice, { foreignKey: 'transaction_id', as: 'invoice' });
SchoolInvoice.belongsTo(SubscriptionTransaction, { foreignKey: 'transaction_id', as: 'transaction' });

// 10. Student Fee Management Relationships
School.hasMany(FeeCategory, { foreignKey: 'school_id', as: 'feeCategories' });
FeeCategory.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

School.hasMany(StudentFee, { foreignKey: 'school_id', as: 'studentFees' });
StudentFee.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

School.hasMany(FeePayment, { foreignKey: 'school_id', as: 'feePayments' });
FeePayment.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

AcademicYear.hasMany(FeeCategory, { foreignKey: 'academic_year_id', as: 'feeCategories' });
FeeCategory.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

AcademicYear.hasMany(StudentFee, { foreignKey: 'academic_year_id', as: 'studentFees' });
StudentFee.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

Student.hasMany(StudentFee, { foreignKey: 'student_id', as: 'allocatedFees' });
StudentFee.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

FeeCategory.hasMany(StudentFee, { foreignKey: 'fee_category_id', as: 'allocations' });
StudentFee.belongsTo(FeeCategory, { foreignKey: 'fee_category_id', as: 'feeCategory' });

StudentFee.hasMany(FeePayment, { foreignKey: 'student_fee_id', as: 'payments' });
FeePayment.belongsTo(StudentFee, { foreignKey: 'student_fee_id', as: 'studentFee' });

const PeriodSlot = require('./PeriodSlot');
const Timetable = require('./Timetable');
const TeacherProxy = require('./TeacherProxy');

// 11. Timetable and Period Management Relationships
School.hasMany(PeriodSlot, { foreignKey: 'school_id', as: 'periodSlots' });
PeriodSlot.belongsTo(School, { foreignKey: 'school_id', as: 'school' });

AcademicYear.hasMany(PeriodSlot, { foreignKey: 'academic_year_id', as: 'periodSlots' });
PeriodSlot.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

SchoolClass.hasMany(Timetable, { foreignKey: 'class_id', as: 'timetables' });
Timetable.belongsTo(SchoolClass, { foreignKey: 'class_id', as: 'schoolClass' });

Teacher.hasMany(Timetable, { foreignKey: 'teacher_id', as: 'timetables' });
Timetable.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

PeriodSlot.hasMany(Timetable, { foreignKey: 'period_slot_id', as: 'timetables' });
Timetable.belongsTo(PeriodSlot, { foreignKey: 'period_slot_id', as: 'periodSlot' });

Timetable.hasMany(TeacherProxy, { foreignKey: 'timetable_id', as: 'proxies' });
TeacherProxy.belongsTo(Timetable, { foreignKey: 'timetable_id', as: 'timetable' });

Teacher.hasMany(TeacherProxy, { foreignKey: 'original_teacher_id', as: 'givenProxies' });
TeacherProxy.belongsTo(Teacher, { foreignKey: 'original_teacher_id', as: 'originalTeacher' });

Teacher.hasMany(TeacherProxy, { foreignKey: 'substitute_teacher_id', as: 'receivedProxies' });
TeacherProxy.belongsTo(Teacher, { foreignKey: 'substitute_teacher_id', as: 'substituteTeacher' });

module.exports = {
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
  SubscriptionTransaction,
  SchoolInvoice,
  AcademicYear,
  StudentAcademicSession,
  TeacherClassAssignment,
  SchoolClass,
  FeeCategory,
  StudentFee,
  FeePayment,
  PeriodSlot,
  Timetable,
  TeacherProxy
};

