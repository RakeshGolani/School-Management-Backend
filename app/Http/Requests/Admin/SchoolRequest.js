const { body } = require('express-validator');

class SchoolRequest {
  static rules() {
    return [
      body('school_name')
        .notEmpty().withMessage('School name is required')
        .isString().withMessage('School name must be a string'),
      
      body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
        
      body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        
      body('code')
        .notEmpty().withMessage('School code is required'),
        
      body('phone')
        .optional()
        .isString(),
        
      body('address')
        .optional()
        .isString(),
        
      body('primary_color')
        .optional()
        .matches(/^#([0-9A-F]{3}){1,2}$/i).withMessage('Primary color must be a valid hex code'),
        
      body('background_color')
        .optional()
        .matches(/^#([0-9A-F]{3}){1,2}$/i).withMessage('Background color must be a valid hex code'),
    ];
  }
}

module.exports = SchoolRequest;
