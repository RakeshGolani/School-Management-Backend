const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * TeacherLoginRequest
 * Validates request data for teacher portal / mobile app logins.
 */
class TeacherLoginRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('email')
        .notEmpty().withMessage('Email or Employee ID is required.')
        .trim(),
      body('password')
        .notEmpty().withMessage('Password is required.')
    ]);
  }
}

module.exports = TeacherLoginRequest;
