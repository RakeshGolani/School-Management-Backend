const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../app/Http/Controllers/Admin/AdminDashboardController');
const LoginRequest = require('../app/Http/Requests/Admin/LoginRequest');

const AdminSchoolController = require('../app/Http/Controllers/Admin/AdminSchoolController');
const SchoolRequest = require('../app/Http/Requests/Admin/SchoolRequest');

const AdminStudentController = require('../app/Http/Controllers/Admin/AdminStudentController');
const StoreStudentRequest = require('../app/Http/Requests/Student/StoreStudentRequest');
const UpdateStudentRequest = require('../app/Http/Requests/Student/UpdateStudentRequest');
const BillingSettingController = require('../app/Http/Controllers/Admin/BillingSettingController');
const { makeUploader } = require('../utils/UploadUtils');

const uploadStudentPhoto = makeUploader('students', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

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

// --- Student Management ---
router.get('/students', AdminStudentController.index);
router.get('/students/:id', AdminStudentController.show);
router.post('/students', uploadStudentPhoto, StoreStudentRequest.rules(), AdminStudentController.store);
router.put('/students/:id', uploadStudentPhoto, UpdateStudentRequest.rules(), AdminStudentController.update);
router.put('/students/:id/status', AdminStudentController.toggleStatus);
router.delete('/students/:id', AdminStudentController.destroy);

// --- Global SaaS Billing Settings ---
router.get('/billing-settings', BillingSettingController.getSettings);
router.put('/billing-settings', BillingSettingController.updateSettings);

// --- Transactions & Billing ---
const AdminTransactionController = require('../app/Http/Controllers/Admin/AdminTransactionController');
router.get('/transactions', AdminTransactionController.index);
router.get('/transactions/:id', AdminTransactionController.show);

module.exports = router;

