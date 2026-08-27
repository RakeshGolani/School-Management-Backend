const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../app/Http/Controllers/Admin/AdminDashboardController');
const LoginRequest = require('../app/Http/Requests/Admin/LoginRequest');

const AdminSchoolController = require('../app/Http/Controllers/Admin/AdminSchoolController');
const SchoolRequest = require('../app/Http/Requests/Admin/SchoolRequest');
const SystemSettingController = require('../app/Http/Controllers/Admin/SystemSettingController');

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
const uploadSystemLogo = makeUploader('system', ['jpg', 'jpeg', 'png', 'webp']).single('logo');

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
router.put('/schools/:id/pricing', AdminSchoolController.updateCustomPricing);

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
router.put('/teachers/:id/status', AdminTeacherController.toggleStatus);
router.delete('/teachers/:id', AdminTeacherController.destroy);

// --- Global SaaS Billing Settings ---
router.get('/billing-settings', BillingSettingController.getSettings);
router.put('/billing-settings', BillingSettingController.updateSettings);

// --- Transactions & Billing ---
const AdminTransactionController = require('../app/Http/Controllers/Admin/AdminTransactionController');
router.get('/transactions', AdminTransactionController.index);
router.get('/transactions/:id', AdminTransactionController.show);
router.post('/transactions/offline', AdminTransactionController.recordOfflinePayment);

// --- Socket.IO Logs & Real-Time Monitoring ---
const AdminSocketController = require('../app/Http/Controllers/Admin/AdminSocketController');
router.get('/sockets/metrics', AdminSocketController.getMetrics);
router.get('/sockets/logs', AdminSocketController.getLogs);
router.get('/sockets/clients', AdminSocketController.getClients);
router.post('/sockets/disconnect/:socketId', AdminSocketController.disconnectClient);
router.post('/sockets/broadcast', AdminSocketController.broadcast);
router.delete('/sockets/logs', AdminSocketController.clearLogs);

// ==========================================
// System Profile Settings Routes
router.get('/system-settings', SystemSettingController.getSettings);
router.put('/system-settings', uploadSystemLogo, SystemSettingController.updateSettings);

// --- Packages & Modules Management ---
const AdminPackageController = require('../app/Http/Controllers/Admin/AdminPackageController');
router.get('/packages', AdminPackageController.index);
router.get('/packages/:id', AdminPackageController.show);
router.put('/packages/:id', AdminPackageController.update);

// --- Subscription Plans & Pricing ---
router.get('/plans', AdminPackageController.index);
router.get('/plans/:id', AdminPackageController.show);
router.put('/plans/:id', AdminPackageController.update);

// --- Inquiries & Demo Leads Management ---
const AdminInquiryController = require('../app/Http/Controllers/Admin/AdminInquiryController');
router.get('/inquiries', AdminInquiryController.index);
router.get('/inquiries/:id', AdminInquiryController.show);
router.put('/inquiries/:id/status', AdminInquiryController.updateStatus);
router.put('/inquiries/:id/notes', AdminInquiryController.updateNotes);
router.delete('/inquiries/:id', AdminInquiryController.destroy);

module.exports = router;
