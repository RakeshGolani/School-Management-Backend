const express = require('express');
const router = express.Router();
const ParentController = require('../app/Http/Controllers/Parent/ParentController');
const ParentLoginRequest = require('../app/Http/Requests/Parent/ParentLoginRequest');

// ===================== PARENT OTP & AUTH =====================
router.post('/send-otp', ParentController.sendOtp);
router.post('/verify-otp', ParentController.verifyOtp);
router.post('/login', ParentLoginRequest.rules(), ParentController.login);
router.post('/logout', ParentController.logout);
router.get('/profile', ParentController.profile);
router.get('/children', ParentController.children);

// ===================== PARENT PORTAL & APP DATA =====================
router.get('/', ParentController.index);
router.get('/:id', ParentController.show);

module.exports = router;
