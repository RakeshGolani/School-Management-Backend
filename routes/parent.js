const express = require('express');
const router = express.Router();
const ParentController = require('../app/Http/Controllers/Parent/ParentController');
const ParentNotificationController = require('../app/Http/Controllers/Parent/ParentNotificationController');
const ParentLoginRequest = require('../app/Http/Requests/Parent/ParentLoginRequest');

// ===================== PARENT OTP & AUTH =====================
router.post('/send-otp', ParentController.sendOtp);
router.post('/verify-otp', ParentController.verifyOtp);
router.post('/login', ParentLoginRequest.rules(), ParentController.login);
router.post('/logout', ParentController.logout);
router.get('/profile', ParentController.profile);
router.get('/children', ParentController.children);

// ===================== PARENT NOTIFICATIONS =====================
router.get('/notifications', ParentNotificationController.index);
router.get('/notifications/unread-count', ParentNotificationController.getUnreadCount);
router.patch('/notifications/read-all', ParentNotificationController.markAllAsRead);
router.patch('/notifications/:id/read', ParentNotificationController.markAsRead);

// ===================== PARENT PORTAL & APP DATA =====================
router.get('/bus-tracking', ParentController.getBusTracking);
router.get('/transport', ParentController.getBusTracking);
router.get('/attendance', ParentController.getAttendance);
router.get('/fees', ParentController.getFees);
router.get('/timetable', ParentController.getTimetable);
router.get('/dashboard', ParentController.getDashboard);
router.get('/', ParentController.index);
router.get('/:id', ParentController.show);

module.exports = router;
