const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * LoginRequest
 * Validates request data for admin logins.
 */
class LoginRequest extends BaseRequest {
  /**
   * Validation rules middleware
   */
  static rules() {
    return this.validate([
      body('email')
        .notEmpty().withMessage('The email field is required.')
        .isEmail().withMessage('The email must be a valid email address.'),
      body('password')
        .notEmpty().withMessage('The password field is required.')
        .isLength({ min: 6 }).withMessage('The password must be at least 6 characters.')
    ]);
  }
}

module.exports = LoginRequest;
