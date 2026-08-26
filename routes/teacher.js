const express = require('express');
const router = express.Router();
const TeacherController = require('../app/Http/Controllers/Teacher/TeacherController');
const TeacherNotificationController = require('../app/Http/Controllers/Teacher/TeacherNotificationController');
const TeacherLoginRequest = require('../app/Http/Requests/Teacher/TeacherLoginRequest');
const { makeUploader } = require('../utils/UploadUtils');

const uploadTeacherPhoto = makeUploader('teachers', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// ===================== TEACHER AUTH & SESSION =====================
router.post('/login', TeacherLoginRequest.rules(), TeacherController.login);
router.post('/logout', TeacherController.logout);
router.get('/profile', TeacherController.profile);
router.put('/profile', uploadTeacherPhoto, TeacherController.updateProfile);
router.get('/dashboard', TeacherController.getDashboard);

// ===================== TEACHER NOTIFICATIONS =====================
router.get('/notifications', TeacherNotificationController.index);
router.get('/notifications/unread-count', TeacherNotificationController.getUnreadCount);
router.patch('/notifications/read-all', TeacherNotificationController.markAllAsRead);
router.patch('/notifications/:id/read', TeacherNotificationController.markAsRead);

// ===================== TEACHER ATTENDANCE DESK =====================
router.get('/attendance', TeacherController.getAttendance);
router.post('/attendance', TeacherController.saveAttendance);
router.post('/attendance/save', TeacherController.saveAttendance);

// ===================== TEACHER TIMETABLE & SCHEDULE =====================
router.get('/timetable', TeacherController.getTimetable);

// ===================== TEACHER CLASS STUDENTS =====================
router.get('/students', TeacherController.getStudents);

// ===================== TEACHER STUDENT LEAVE REVIEWS =====================
router.get('/leaves', TeacherController.getStudentLeaves);
router.put('/leaves/:id/review', TeacherController.reviewStudentLeave);

// ===================== TEACHER PORTAL & APP DATA =====================
router.get('/', TeacherController.index);
router.get('/:id', TeacherController.show);
router.put('/:id', uploadTeacherPhoto, TeacherController.updateProfile);

module.exports = router;
