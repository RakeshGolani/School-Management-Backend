const express = require('express');
const router = express.Router();
const StudentController = require('../app/Http/Controllers/Student/StudentController');

// Dedicated Student / Parent Portal Routes
router.get('/', StudentController.index);
router.get('/:id', StudentController.show);

module.exports = router;
