const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * SchoolChangePasswordRequest
 * Validates current, new, and confirm password fields.
 */
class SchoolChangePasswordRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('current_password')
        .notEmpty().withMessage('Current password is required.')
        .isLength({ min: 6 }).withMessage('Current password must be at least 6 characters.'),
      body('new_password')
        .notEmpty().withMessage('New password is required.')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
      body('confirm_password')
        .notEmpty().withMessage('Please confirm your new password.')
        .custom((value, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error('Confirm password does not match new password.');
          }
          return true;
        })
    ]);
  }
}

module.exports = SchoolChangePasswordRequest;
