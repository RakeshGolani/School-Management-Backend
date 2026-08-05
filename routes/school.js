const express = require('express');
const router = express.Router();
const SchoolController = require('../app/Http/Controllers/School/SchoolController');
const SchoolLoginRequest = require('../app/Http/Requests/School/SchoolLoginRequest');
const SchoolRegisterRequest = require('../app/Http/Requests/School/SchoolRegisterRequest');

const SchoolUpdateProfileRequest = require('../app/Http/Requests/School/SchoolUpdateProfileRequest');
const SchoolChangePasswordRequest = require('../app/Http/Requests/School/SchoolChangePasswordRequest');
const { makeUploader } = require('../utils/UploadUtils');

const uploadLogo = makeUploader('schools', ['jpg', 'jpeg', 'png', 'webp']).single('logo');

// School Registration
router.post('/register', SchoolRegisterRequest.rules(), SchoolController.register);

// School Login
router.post('/login', SchoolLoginRequest.rules(), SchoolController.login);

// School Profile
router.get('/profile', SchoolController.profile);
router.post('/profile/update', uploadLogo, SchoolUpdateProfileRequest.rules(), SchoolController.updateProfile);
router.post('/change-password', SchoolChangePasswordRequest.rules(), SchoolController.changePassword);

module.exports = router;
