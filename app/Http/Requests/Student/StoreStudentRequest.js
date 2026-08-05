const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * StoreStudentRequest
 * Validates new student admission creation requests.
 */
class StoreStudentRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('first_name')
        .notEmpty().withMessage('First name is required.')
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters.'),
      body('last_name')
        .notEmpty().withMessage('Last name is required.')
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters.'),
      body('admission_number')
        .optional({ nullable: true }),
      body('grade')
        .notEmpty().withMessage('Grade / Class assignment is required.'),
      body('section')
        .optional({ nullable: true }),
      body('guardian_name')
        .notEmpty().withMessage('Guardian name is required.'),
      body('guardian_email')
        .notEmpty().withMessage('Guardian email is required.')
        .isEmail().withMessage('Must be a valid email address.'),
      body('guardian_phone')
        .notEmpty().withMessage('Guardian phone is required.'),
      body('alternate_phone')
        .optional({ nullable: true }),
      body('nfc_card_uid')
        .optional({ nullable: true }),
      body('is_bus_service_enabled')
        .optional({ nullable: true }),
      body('bus_route_id')
        .optional({ nullable: true }),
      body('bus_stop_id')
        .optional({ nullable: true })
    ]);
  }
}

module.exports = StoreStudentRequest;
