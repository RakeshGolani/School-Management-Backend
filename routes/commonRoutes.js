const express = require('express');
const router = express.Router();
const CommonController = require('../app/Http/Controllers/CommonController');

// Using PUT and DELETE, but sending module/id in body is sometimes easier with POST/PUT
// For REST compliance, we'll use PUT for status and DELETE for delete (with body)
router.put('/status', CommonController.updateStatus);
router.delete('/delete', CommonController.deleteEntity);
router.get('/system-settings', CommonController.getSystemSettings);
router.post('/inquiries', CommonController.submitInquiry);

module.exports = router;
