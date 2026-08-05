const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * SchoolRegisterRequest
 * Validates request data for registering a new school.
 */
class SchoolRegisterRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('school_name')
        .notEmpty().withMessage('The school name field is required.')
        .isLength({ min: 3 }).withMessage('The school name must be at least 3 characters.'),
      body('code')
        .notEmpty().withMessage('The school registration code is required.'),
      body('email')
        .notEmpty().withMessage('The email field is required.')
        .isEmail().withMessage('The email must be a valid email address.'),
      body('password')
        .notEmpty().withMessage('The password field is required.')
        .isLength({ min: 6 }).withMessage('The password must be at least 6 characters.')
    ]);
  }
}

module.exports = SchoolRegisterRequest;
