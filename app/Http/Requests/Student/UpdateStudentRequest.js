const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * UpdateStudentRequest
 * Validates student profile updates.
 */
class UpdateStudentRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('first_name')
        .optional()
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters.'),
      body('last_name')
        .optional()
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters.'),
      body('admission_number')
        .optional({ nullable: true }),
      body('grade')
        .optional(),
      body('section')
        .optional({ nullable: true }),
      body('guardian_name')
        .optional({ nullable: true }),
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
        .optional({ nullable: true }),
      body('status')
        .optional()
    ]);
  }
}

module.exports = UpdateStudentRequest;
