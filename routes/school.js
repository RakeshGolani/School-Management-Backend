const express = require('express');
const router = express.Router();
const SchoolController = require('../app/Http/Controllers/School/SchoolController');
const SchoolTeacherController = require('../app/Http/Controllers/School/SchoolTeacherController');
const SchoolStudentController = require('../app/Http/Controllers/School/SchoolStudentController');
const SchoolCommonController = require('../app/Http/Controllers/School/SchoolCommonController');
const SubscriptionController = require('../app/Http/Controllers/School/SubscriptionController');
const AcademicYearController = require('../app/Http/Controllers/School/AcademicYearController');
const AttendanceController = require('../app/Http/Controllers/School/AttendanceController');
const ClassController = require('../app/Http/Controllers/School/ClassController');
const FeeController = require('../app/Http/Controllers/School/FeeController');
const TimetableController = require('../app/Http/Controllers/School/TimetableController');
const TransportController = require('../app/Http/Controllers/School/TransportController');
const SchoolLeaveController = require('../app/Http/Controllers/School/SchoolLeaveController');
const SchoolNotificationController = require('../app/Http/Controllers/School/SchoolNotificationController');

const SchoolDashboardController = require('../app/Http/Controllers/School/SchoolDashboardController');

const SchoolLoginRequest = require('../app/Http/Requests/School/SchoolLoginRequest');
const SchoolRegisterRequest = require('../app/Http/Requests/School/SchoolRegisterRequest');
const SchoolUpdateProfileRequest = require('../app/Http/Requests/School/SchoolUpdateProfileRequest');
const SchoolChangePasswordRequest = require('../app/Http/Requests/School/SchoolChangePasswordRequest');
const StoreTeacherRequest = require('../app/Http/Requests/Teacher/StoreTeacherRequest');
const UpdateTeacherRequest = require('../app/Http/Requests/Teacher/UpdateTeacherRequest');
const StoreStudentRequest = require('../app/Http/Requests/Student/StoreStudentRequest');
const UpdateStudentRequest = require('../app/Http/Requests/Student/UpdateStudentRequest');

const { makeUploader } = require('../utils/UploadUtils');

const uploadLogo = makeUploader('schools', ['jpg', 'jpeg', 'png', 'webp']).single('logo');
const uploadTeacherPhoto = makeUploader('teachers', ['jpg', 'jpeg', 'png', 'webp']).single('photo');
const uploadStudentPhoto = makeUploader('students', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// ===================== HEALTH CHECK =====================
router.get('/health', (req, res) => {
  return res.status(200).json({ success: true, message: 'School API is healthy', data: { status: 'healthy' } });
});

// ===================== SYSTEM / SITE SETTINGS =====================
router.get('/system-settings', SchoolCommonController.getSystemSettings);

// ===================== DASHBOARD METRICS =====================
router.get('/dashboard', SchoolDashboardController.getDashboardStats);

// ===================== SCHOOL AUTH & PROFILE =====================
router.post('/register', SchoolRegisterRequest.rules(), SchoolController.register);
router.post('/login', SchoolLoginRequest.rules(), SchoolController.login);
router.get('/profile', SchoolController.profile);
router.post('/profile/update', uploadLogo, SchoolUpdateProfileRequest.rules(), SchoolController.updateProfile);
router.post('/change-password', SchoolChangePasswordRequest.rules(), SchoolController.changePassword);

// ===================== SUBSCRIPTION & SAAS BILLING =====================
router.get('/subscription', SubscriptionController.getDetails);
router.post('/subscription/checkout', SubscriptionController.createCheckoutSession);
router.post('/subscription/webhook', SubscriptionController.webhook);

// ===================== ACADEMIC YEARS =====================
router.get('/academic-years', (req, res) => AcademicYearController.index(req, res));
router.get('/academic-years/active', (req, res) => AcademicYearController.getActive(req, res));
router.post('/academic-years', (req, res) => AcademicYearController.store(req, res));
router.put('/academic-years/:id', (req, res) => AcademicYearController.update(req, res));
router.patch('/academic-years/:id/active', (req, res) => AcademicYearController.setActive(req, res));
router.delete('/academic-years/:id', (req, res) => AcademicYearController.destroy(req, res));

// ===================== CLASSES & SECTIONS =====================
router.get('/classes', (req, res) => ClassController.index(req, res));
router.get('/classes/:id', (req, res) => ClassController.show(req, res));
router.post('/classes', (req, res) => ClassController.store(req, res));
router.put('/classes/:id', (req, res) => ClassController.update(req, res));
router.post('/classes/:id/assign-student', (req, res) => ClassController.assignStudent(req, res));
router.delete('/classes/:id/students/:studentId', (req, res) => ClassController.unassignStudent(req, res));
router.delete('/classes/:id', (req, res) => ClassController.destroy(req, res));

// ===================== TEACHER MANAGEMENT (SCHOOL PORTAL) =====================
router.get('/teachers', SchoolTeacherController.index);
router.get('/teachers/:id', SchoolTeacherController.show);
router.post('/teachers', uploadTeacherPhoto, StoreTeacherRequest.rules(), SchoolTeacherController.store);
router.put('/teachers/:id', uploadTeacherPhoto, UpdateTeacherRequest.rules(), SchoolTeacherController.update);
router.delete('/teachers/:id', SchoolTeacherController.destroy);

// ===================== STUDENT MANAGEMENT (SCHOOL PORTAL) =====================
router.get('/students', SchoolStudentController.index);
router.get('/students/:id', SchoolStudentController.show);
router.post('/students', uploadStudentPhoto, StoreStudentRequest.rules(), SchoolStudentController.store);
router.put('/students/:id', uploadStudentPhoto, UpdateStudentRequest.rules(), SchoolStudentController.update);
router.put('/students/:id/status', SchoolStudentController.toggleStatus);
router.delete('/students/:id', SchoolStudentController.destroy);

// Student Academic Sessions & Promotion
router.get('/student-sessions', (req, res) => SchoolStudentController.getStudentSessions(req, res));
router.post('/student-sessions/promote', (req, res) => SchoolStudentController.promoteStudents(req, res));

// ===================== ATTENDANCE =====================
router.get('/attendance', (req, res) => AttendanceController.index(req, res));
router.post('/attendance/bulk', (req, res) => AttendanceController.saveBulk(req, res));
router.post('/attendance/gate-scan', (req, res) => AttendanceController.gateScan(req, res));
router.get('/attendance/summary', (req, res) => AttendanceController.getSummary(req, res));

// ===================== STUDENT FEES & PAYMENTS =====================
router.get('/fees/categories', (req, res) => FeeController.getCategories(req, res));
router.post('/fees/categories', (req, res) => FeeController.createCategory(req, res));
router.put('/fees/categories/:id', (req, res) => FeeController.updateCategory(req, res));
router.delete('/fees/categories/:id', (req, res) => FeeController.deleteCategory(req, res));

router.get('/fees/allocations', (req, res) => FeeController.getAllocations(req, res));
router.post('/fees/allocations', (req, res) => FeeController.allocateFee(req, res));
router.delete('/fees/allocations/:id', (req, res) => FeeController.deleteAllocation(req, res));

router.get('/fees/payments', (req, res) => FeeController.getPayments(req, res));
router.get('/fees/payments/:id', (req, res) => FeeController.getPayment(req, res));
router.post('/fees/payments', (req, res) => FeeController.recordPayment(req, res));
router.get('/fees/stats', (req, res) => FeeController.getStats(req, res));

// ===================== TIMETABLE & PERIOD SLOTS =====================
router.get('/period-slots', (req, res) => TimetableController.getPeriodSlots(req, res));
router.post('/period-slots', (req, res) => TimetableController.createOrUpdatePeriodSlot(req, res));
router.delete('/period-slots/:id', (req, res) => TimetableController.deletePeriodSlot(req, res));

router.post('/timetable/allocate', (req, res) => TimetableController.allocateSlot(req, res));
router.delete('/timetable/allocate/:id', (req, res) => TimetableController.deleteAllocation(req, res));
router.get('/timetable/class/:class_id', (req, res) => TimetableController.getClassTimetable(req, res));
router.get('/timetable/teacher/:teacher_id', (req, res) => TimetableController.getTeacherTimetable(req, res));
router.post('/timetable/proxy', (req, res) => TimetableController.assignProxy(req, res));

// ===================== TRANSPORT & LIVE TRACKING =====================
router.get('/transport/routes', (req, res) => TransportController.getRoutes(req, res));
router.post('/transport/routes', (req, res) => TransportController.createRoute(req, res));
router.put('/transport/routes/:id', (req, res) => TransportController.updateRoute(req, res));
router.delete('/transport/routes/:id', (req, res) => TransportController.deleteRoute(req, res));

router.get('/transport/stops', (req, res) => TransportController.getStops(req, res));
router.post('/transport/stops', (req, res) => TransportController.createStop(req, res));
router.put('/transport/stops/:id', (req, res) => TransportController.updateStop(req, res));
router.delete('/transport/stops/:id', (req, res) => TransportController.deleteStop(req, res));

router.get('/transport/buses', (req, res) => TransportController.getBuses(req, res));
router.post('/transport/buses', (req, res) => TransportController.createBus(req, res));
router.put('/transport/buses/:id', (req, res) => TransportController.updateBus(req, res));
router.delete('/transport/buses/:id', (req, res) => TransportController.deleteBus(req, res));

router.post('/transport/buses/location', (req, res) => TransportController.updateBusLocation(req, res));
router.get('/transport/buses/live', (req, res) => TransportController.getLiveLocations(req, res));

router.get('/transport/students', (req, res) => TransportController.getAssignedStudents(req, res));
router.put('/transport/students/:id', (req, res) => TransportController.updateStudentTransport(req, res));

// ===================== STUDENT LEAVE MANAGEMENT (INSTITUTIONAL) =====================
router.get('/leaves', (req, res) => SchoolLeaveController.index(req, res));
router.put('/leaves/:id/review', (req, res) => SchoolLeaveController.review(req, res));

// ===================== NOTIFICATIONS & ANNOUNCEMENTS =====================
router.get('/notifications', SchoolNotificationController.index);
router.get('/notifications/unread-count', SchoolNotificationController.getUnreadCount);
router.patch('/notifications/read-all', SchoolNotificationController.markAllAsRead);
router.patch('/notifications/:id/read', SchoolNotificationController.markAsRead);
router.post('/notifications/broadcast', SchoolNotificationController.broadcast);
router.delete('/notifications/:id', SchoolNotificationController.destroy);

// ===================== COMMON (SCHOOL PORTAL) =====================
router.put('/common/status', SchoolCommonController.updateStatus);
router.delete('/common/delete', SchoolCommonController.deleteEntity);

module.exports = router;
