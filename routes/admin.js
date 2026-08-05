const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../app/Http/Controllers/Admin/AdminDashboardController');
const LoginRequest = require('../app/Http/Requests/Admin/LoginRequest');

const AdminSchoolController = require('../app/Http/Controllers/Admin/AdminSchoolController');
const SchoolRequest = require('../app/Http/Requests/Admin/SchoolRequest');

// Dashboard Info
router.get('/dashboard', AdminDashboardController.index);

// Validation Demo (Login)
router.post('/login', LoginRequest.rules(), AdminDashboardController.login);

// --- School Management ---
router.get('/schools', AdminSchoolController.index);
router.post('/schools', SchoolRequest.rules(), AdminSchoolController.store);
router.put('/schools/:id', SchoolRequest.rules(), AdminSchoolController.update);
router.delete('/schools/:id', AdminSchoolController.destroy);
router.put('/schools/:id/status', AdminSchoolController.toggleStatus);

module.exports = router;
