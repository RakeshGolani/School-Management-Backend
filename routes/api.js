const express = require('express');
const router = express.Router();
const ApiResponse = require('../app/Traits/ApiResponse');
const SubscriptionCheckMiddleware = require('../app/Http/Middleware/SubscriptionCheckMiddleware');

const schoolRoutes = require('./school');
const adminRoutes = require('./admin');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const parentRoutes = require('./parent');
const commonRoutes = require('./commonRoutes');

// Active Role & Portal Routes
router.use('/school', SubscriptionCheckMiddleware, schoolRoutes);   // School Management Portal
router.use('/admin', adminRoutes);                                   // Super Admin Portal
router.use('/teacher', SubscriptionCheckMiddleware, teacherRoutes); // Dedicated Teacher Portal / App
router.use('/student', SubscriptionCheckMiddleware, studentRoutes); // Dedicated Student Portal / App
router.use('/parent', SubscriptionCheckMiddleware, parentRoutes);   // Dedicated Parent Portal / App
router.use('/common', SubscriptionCheckMiddleware, commonRoutes);   // Common Global Routes

const AttendanceController = require('../app/Http/Controllers/School/AttendanceController');

// Direct IoT Gate Sensor Scan Endpoint (Hardware device connection)
router.post('/attendance/gate-scan', (req, res) => AttendanceController.gateScan(req, res));

// General health check
router.get('/health', (req, res) => {
  return ApiResponse.sendResponse(res, { status: 'healthy' }, 'School Management System API is running');
});

module.exports = router;
