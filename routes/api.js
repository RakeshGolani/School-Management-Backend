const express = require('express');
const router = express.Router();
const ApiResponse = require('../app/Traits/ApiResponse');

const schoolRoutes = require('./school');
const adminRoutes = require('./admin');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const commonRoutes = require('./commonRoutes');

// Group routes
router.use('/school', schoolRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/teachers', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/students', studentRoutes);
router.use('/common', commonRoutes);

// General health check
router.get('/health', (req, res) => {
  return ApiResponse.sendResponse(res, { status: 'healthy' }, 'School Management System API is running');
});

module.exports = router;
