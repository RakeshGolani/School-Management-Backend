const ApiResponse = require('../../Traits/ApiResponse');

/**
 * BaseController
 * All role-based controllers will extend this class to gain access to standard response traits.
 */
class BaseController {
  /**
   * Send success response
   */
  sendResponse(res, data, message, code) {
    return ApiResponse.sendResponse(res, data, message, code);
  }

  /**
   * Send error response
   */
  sendError(res, errorMessage, errorDetails, code) {
    return ApiResponse.sendError(res, errorMessage, errorDetails, code);
  }

  /**
   * Send validation error response
   */
  sendValidationError(res, errors, message, code) {
    return ApiResponse.sendValidationError(res, errors, message, code);
  }
}

module.exports = BaseController;
