const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * StoreTeacherRequest
 * Validates new teacher profile creation requests.
 */
class StoreTeacherRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('name')
        .notEmpty().withMessage('Teacher name is required.')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
      body('email')
        .notEmpty().withMessage('Email address is required.')
        .isEmail().withMessage('Must be a valid email address.'),
      body('phone')
        .notEmpty().withMessage('Phone number is required.'),
      body('subject')
        .notEmpty().withMessage('Primary subject is required.'),
      body('qualification')
        .optional({ nullable: true }),
      body('class_assigned')
        .optional({ nullable: true }),
      body('gender')
        .optional({ nullable: true })
        .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
      body('employee_id')
        .optional({ nullable: true }),
      body('nfc_card_uid')
        .optional({ nullable: true })
    ]);
  }
}

module.exports = StoreTeacherRequest;
