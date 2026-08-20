const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../app/Http/Controllers/Admin/AdminDashboardController');
const LoginRequest = require('../app/Http/Requests/Admin/LoginRequest');

const AdminSchoolController = require('../app/Http/Controllers/Admin/AdminSchoolController');
const SchoolRequest = require('../app/Http/Requests/Admin/SchoolRequest');

const AdminStudentController = require('../app/Http/Controllers/Admin/AdminStudentController');
const AdminTeacherController = require('../app/Http/Controllers/Admin/AdminTeacherController');
const StoreStudentRequest = require('../app/Http/Requests/Student/StoreStudentRequest');
const UpdateStudentRequest = require('../app/Http/Requests/Student/UpdateStudentRequest');
const StoreTeacherRequest = require('../app/Http/Requests/Teacher/StoreTeacherRequest');
const UpdateTeacherRequest = require('../app/Http/Requests/Teacher/UpdateTeacherRequest');
const BillingSettingController = require('../app/Http/Controllers/Admin/BillingSettingController');
const { makeUploader } = require('../utils/UploadUtils');

const uploadStudentPhoto = makeUploader('students', ['jpg', 'jpeg', 'png', 'webp']).single('photo');
const uploadTeacherPhoto = makeUploader('teachers', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// Health Check
router.get('/health', (req, res) => {
  return res.status(200).json({ success: true, message: 'Admin API is healthy', data: { status: 'healthy' } });
});

// Dashboard Info
router.get('/dashboard', AdminDashboardController.index);

// Validation Demo (Login)
router.post('/login', LoginRequest.rules(), AdminDashboardController.login);

// Update Admin Profile
router.put('/profile/:id', AdminDashboardController.updateProfile);

// --- School Management ---
router.get('/schools', AdminSchoolController.index);
router.get('/schools/:id', AdminSchoolController.show);
router.post('/schools', SchoolRequest.rules(), AdminSchoolController.store);
router.put('/schools/:id', SchoolRequest.rules(), AdminSchoolController.update);
router.delete('/schools/:id', AdminSchoolController.destroy);
router.put('/schools/:id/status', AdminSchoolController.toggleStatus);

// --- Student Management (Admin) ---
router.get('/students', AdminStudentController.index);
router.get('/students/:id', AdminStudentController.show);
router.post('/students', uploadStudentPhoto, StoreStudentRequest.rules(), AdminStudentController.store);
router.put('/students/:id', uploadStudentPhoto, UpdateStudentRequest.rules(), AdminStudentController.update);
router.put('/students/:id/status', AdminStudentController.toggleStatus);
router.delete('/students/:id', AdminStudentController.destroy);

// --- Teacher Management (Admin) ---
router.get('/teachers', AdminTeacherController.index);
router.get('/teachers/:id', AdminTeacherController.show);
router.post('/teachers', uploadTeacherPhoto, StoreTeacherRequest.rules(), AdminTeacherController.store);
router.put('/teachers/:id', uploadTeacherPhoto, UpdateTeacherRequest.rules(), AdminTeacherController.update);
router.delete('/teachers/:id', AdminTeacherController.destroy);

// --- Global SaaS Billing Settings ---
router.get('/billing-settings', BillingSettingController.getSettings);
router.put('/billing-settings', BillingSettingController.updateSettings);

// --- Transactions & Billing ---
const AdminTransactionController = require('../app/Http/Controllers/Admin/AdminTransactionController');
router.get('/transactions', AdminTransactionController.index);
router.get('/transactions/:id', AdminTransactionController.show);

module.exports = router;
