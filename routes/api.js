const express = require('express');
const router = express.Router();
const ApiResponse = require('../app/Traits/ApiResponse');
const SubscriptionCheckMiddleware = require('../app/Http/Middleware/SubscriptionCheckMiddleware');

const schoolRoutes = require('./school');
const adminRoutes = require('./admin');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const commonRoutes = require('./commonRoutes');

// Group routes
router.use('/school', SubscriptionCheckMiddleware, schoolRoutes);
router.use('/admin', adminRoutes); // Super admin is exempt
router.use('/teacher', SubscriptionCheckMiddleware, teacherRoutes);
router.use('/teachers', SubscriptionCheckMiddleware, teacherRoutes);
router.use('/student', SubscriptionCheckMiddleware, studentRoutes);
router.use('/students', SubscriptionCheckMiddleware, studentRoutes);
router.use('/common', SubscriptionCheckMiddleware, commonRoutes);

const AttendanceController = require('../app/Http/Controllers/School/AttendanceController');

// Direct IoT Gate Sensor Scan Endpoint (Hardware device connection)
router.post('/attendance/gate-scan', (req, res) => AttendanceController.gateScan(req, res));

// General health check
router.get('/health', (req, res) => {
  return ApiResponse.sendResponse(res, { status: 'healthy' }, 'School Management System API is running');
});

module.exports = router;
