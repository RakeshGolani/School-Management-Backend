const express = require('express');
const router = express.Router();
const SchoolController = require('../app/Http/Controllers/School/SchoolController');
const SchoolLoginRequest = require('../app/Http/Requests/School/SchoolLoginRequest');
const SchoolRegisterRequest = require('../app/Http/Requests/School/SchoolRegisterRequest');

const SchoolUpdateProfileRequest = require('../app/Http/Requests/School/SchoolUpdateProfileRequest');
const SchoolChangePasswordRequest = require('../app/Http/Requests/School/SchoolChangePasswordRequest');
const SubscriptionController = require('../app/Http/Controllers/School/SubscriptionController');
const AcademicYearController = require('../app/Http/Controllers/School/AcademicYearController');
const { makeUploader } = require('../utils/UploadUtils');

const uploadLogo = makeUploader('schools', ['jpg', 'jpeg', 'png', 'webp']).single('logo');

// School Registration
router.post('/register', SchoolRegisterRequest.rules(), SchoolController.register);

// School Login
router.post('/login', SchoolLoginRequest.rules(), SchoolController.login);

// School Profile
router.get('/profile', SchoolController.profile);
router.post('/profile/update', uploadLogo, SchoolUpdateProfileRequest.rules(), SchoolController.updateProfile);
router.post('/change-password', SchoolChangePasswordRequest.rules(), SchoolController.changePassword);

// School Subscription & SaaS Billing Routes
router.get('/subscription', SubscriptionController.getDetails);
router.post('/subscription/checkout', SubscriptionController.createCheckoutSession);
router.post('/subscription/webhook', SubscriptionController.webhook);

const AttendanceController = require('../app/Http/Controllers/School/AttendanceController');
const ClassController = require('../app/Http/Controllers/School/ClassController');

// Academic Year Management Routes
router.get('/academic-years', (req, res) => AcademicYearController.index(req, res));
router.get('/academic-years/active', (req, res) => AcademicYearController.getActive(req, res));
router.post('/academic-years', (req, res) => AcademicYearController.store(req, res));
router.put('/academic-years/:id', (req, res) => AcademicYearController.update(req, res));
router.patch('/academic-years/:id/active', (req, res) => AcademicYearController.setActive(req, res));
router.delete('/academic-years/:id', (req, res) => AcademicYearController.destroy(req, res));

// Class & Section Management Routes
router.get('/classes', (req, res) => ClassController.index(req, res));
router.get('/classes/:id', (req, res) => ClassController.show(req, res));
router.post('/classes', (req, res) => ClassController.store(req, res));
router.put('/classes/:id', (req, res) => ClassController.update(req, res));
router.post('/classes/:id/assign-student', (req, res) => ClassController.assignStudent(req, res));
router.delete('/classes/:id/students/:studentId', (req, res) => ClassController.unassignStudent(req, res));
router.delete('/classes/:id', (req, res) => ClassController.destroy(req, res));

// Dynamic Attendance Management Routes
router.get('/attendance', (req, res) => AttendanceController.index(req, res));
router.post('/attendance/bulk', (req, res) => AttendanceController.saveBulk(req, res));
router.get('/attendance/summary', (req, res) => AttendanceController.getSummary(req, res));

// Student Fee Management Routes
const FeeController = require('../app/Http/Controllers/School/FeeController');
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

// Timetable & Period Management Routes
const TimetableController = require('../app/Http/Controllers/School/TimetableController');
router.get('/period-slots', (req, res) => TimetableController.getPeriodSlots(req, res));
router.post('/period-slots', (req, res) => TimetableController.createOrUpdatePeriodSlot(req, res));
router.delete('/period-slots/:id', (req, res) => TimetableController.deletePeriodSlot(req, res));

router.post('/timetable/allocate', (req, res) => TimetableController.allocateSlot(req, res));
router.delete('/timetable/allocate/:id', (req, res) => TimetableController.deleteAllocation(req, res));
router.get('/timetable/class/:class_id', (req, res) => TimetableController.getClassTimetable(req, res));
router.get('/timetable/teacher/:teacher_id', (req, res) => TimetableController.getTeacherTimetable(req, res));
router.post('/timetable/proxy', (req, res) => TimetableController.assignProxy(req, res));

// Student Academic Sessions & Promotion Routes
const StudentController = require('../app/Http/Controllers/Student/StudentController');
router.get('/student-sessions', (req, res) => StudentController.getStudentSessions(req, res));
router.post('/student-sessions/promote', (req, res) => StudentController.promoteStudents(req, res));

module.exports = router;


