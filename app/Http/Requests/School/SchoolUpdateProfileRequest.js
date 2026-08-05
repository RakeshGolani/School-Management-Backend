const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * SchoolUpdateProfileRequest
 * Validates request data for updating school profile details.
 */
class SchoolUpdateProfileRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('school_name')
        .notEmpty().withMessage('The school name field is required.')
        .isLength({ min: 3 }).withMessage('The school name must be at least 3 characters.'),
      body('email')
        .notEmpty().withMessage('The email field is required.')
        .isEmail().withMessage('The email must be a valid email address.'),
      body('phone')
        .optional({ nullable: true }),
      body('address')
        .optional({ nullable: true }),
      body('logo')
        .optional({ nullable: true })
    ]);
  }
}

module.exports = SchoolUpdateProfileRequest;
