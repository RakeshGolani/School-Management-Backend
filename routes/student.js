const express = require('express');
const router = express.Router();
const StudentController = require('../app/Http/Controllers/Student/StudentController');
const StoreStudentRequest = require('../app/Http/Requests/Student/StoreStudentRequest');
const UpdateStudentRequest = require('../app/Http/Requests/Student/UpdateStudentRequest');
const { makeUploader } = require('../utils/UploadUtils');

const uploadStudentPhoto = makeUploader('students', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// List Students
router.get('/', StudentController.index);

// Get Single Student Profile
router.get('/:id', StudentController.show);

// Create New Student Admission
router.post('/', uploadStudentPhoto, StoreStudentRequest.rules(), StudentController.store);

// Update Student Profile
router.put('/:id', uploadStudentPhoto, UpdateStudentRequest.rules(), StudentController.update);

// Toggle Student Status
router.put('/:id/status', StudentController.toggleStatus);

// Delete Student Record
router.delete('/:id', StudentController.destroy);

module.exports = router;
