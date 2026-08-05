const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * UpdateTeacherRequest
 * Validates teacher profile update requests.
 */
class UpdateTeacherRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('name')
        .optional()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
      body('email')
        .optional()
        .isEmail().withMessage('Must be a valid email address.'),
      body('phone')
        .optional({ nullable: true }),
      body('subject')
        .optional({ nullable: true }),
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
        .optional({ nullable: true }),
      body('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended']).withMessage('Status must be active, inactive, or suspended.')
    ]);
  }
}

module.exports = UpdateTeacherRequest;
