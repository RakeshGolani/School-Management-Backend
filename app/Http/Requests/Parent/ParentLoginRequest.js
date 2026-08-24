const { body } = require('express-validator');
const BaseRequest = require('../BaseRequest');

/**
 * ParentLoginRequest
 * Validates request data for parent portal and mobile app logins.
 */
class ParentLoginRequest extends BaseRequest {
  static rules() {
    return this.validate([
      body('identifier')
        .notEmpty().withMessage('Email or Phone number is required.')
        .trim(),
      body('password')
        .notEmpty().withMessage('Password is required.')
    ]);
  }
}

module.exports = ParentLoginRequest;
