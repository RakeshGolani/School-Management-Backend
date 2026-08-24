const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * StudentLoginRequest
 * Validates request data for student portal and mobile app logins.
 */
class StudentLoginRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('identifier')
        .notEmpty().withMessage('Admission number, Roll number, or Student Email is required.')
        .trim(),
      body('password')
        .notEmpty().withMessage('Password is required.')
    ]);
  }
}

module.exports = StudentLoginRequest;
