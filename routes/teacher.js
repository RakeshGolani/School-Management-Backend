const express = require('express');
const router = express.Router();
const TeacherController = require('../app/Http/Controllers/Teacher/TeacherController');

// Dedicated Teacher Portal Routes
router.get('/', TeacherController.index);
router.get('/:id', TeacherController.show);

module.exports = router;
