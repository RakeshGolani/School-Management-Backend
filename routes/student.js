const express = require('express');
const router = express.Router();
const StudentController = require('../app/Http/Controllers/Student/StudentController');
const StudentLoginRequest = require('../app/Http/Requests/Student/StudentLoginRequest');
const { makeUploader } = require('../utils/UploadUtils');

const uploadStudentPhoto = makeUploader('students', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// ===================== STUDENT OTP & AUTH =====================
router.post('/send-otp', StudentController.sendOtp);
router.post('/verify-otp', StudentController.verifyOtp);
router.post('/login', StudentLoginRequest.rules(), StudentController.login);
router.post('/logout', StudentController.logout);
router.get('/profile', StudentController.profile);
router.put('/profile', uploadStudentPhoto, StudentController.updateProfile);
router.get('/dashboard', StudentController.getDashboard);

// ===================== STUDENT TIMETABLE & SCHEDULE =====================
router.get('/timetable', StudentController.getTimetable);

// ===================== STUDENT ATTENDANCE TELEMETRY =====================
router.get('/attendance', StudentController.getAttendance);

// ===================== STUDENT TRANSPORT & SMART BUS =====================
router.get('/transport', StudentController.getTransport);

// ===================== STUDENT LEAVE MANAGEMENT =====================
router.get('/leaves', StudentController.getLeaves);
router.post('/leaves', StudentController.applyLeave);

// ===================== STUDENT PORTAL & APP DATA =====================
router.get('/', StudentController.index);
router.get('/:id', StudentController.show);
router.put('/:id', uploadStudentPhoto, StudentController.updateProfile);

module.exports = router;
