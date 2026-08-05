const { validationResult } = require('express-validator');
const ApiResponse = require('../../Traits/ApiResponse');
const { removeFile } = require('../../../utils/UploadUtils');

/**
 * BaseRequest
 * Handles validation execution and automatically formats errors into Laravel-like layout.
 */
class BaseRequest {
  /**
   * Middleware handler to run validation rules and check results.
   * @param {Array} rules Array of express-validator rules
   * @returns {Array} Express middleware array
   */
  static validate(rules) {
    return [
      ...rules,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          // Clean up uploaded file if validation failed (matching aRoadRunner architecture)
          if (req.file) {
            removeFile(req.file);
          }
          const formattedErrors = {};
          
          // Reformat errors into { fieldName: [message1, message2] }
          errors.array().forEach(err => {
            const field = err.path || err.param;
            if (field) {
              if (!formattedErrors[field]) {
                formattedErrors[field] = [];
              }
              formattedErrors[field].push(err.msg);
            }
          });

          return ApiResponse.sendValidationError(
            res, 
            formattedErrors, 
            'The given data was invalid.'
          );
        }
        next();
      }
    ];
  }
}

module.exports = BaseRequest;
