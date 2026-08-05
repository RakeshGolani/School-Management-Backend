const express = require('express');
const router = express.Router();
const TeacherController = require('../app/Http/Controllers/Teacher/TeacherController');
const StoreTeacherRequest = require('../app/Http/Requests/Teacher/StoreTeacherRequest');
const UpdateTeacherRequest = require('../app/Http/Requests/Teacher/UpdateTeacherRequest');
const { makeUploader } = require('../utils/UploadUtils');

const uploadTeacherPhoto = makeUploader('teachers', ['jpg', 'jpeg', 'png', 'webp']).single('photo');

// List Teachers
router.get('/', TeacherController.index);

// Get Single Teacher Profile
router.get('/:id', TeacherController.show);

// Create New Teacher Profile
router.post('/', uploadTeacherPhoto, StoreTeacherRequest.rules(), TeacherController.store);

// Update Teacher Profile
router.put('/:id', uploadTeacherPhoto, UpdateTeacherRequest.rules(), TeacherController.update);

// Delete Teacher Record
router.delete('/:id', TeacherController.destroy);

module.exports = router;
