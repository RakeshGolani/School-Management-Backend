/**
 * ApiResponse Trait
 * Provides standardized API response formats.
 */
const ApiResponse = {
  /**
   * Send a standard success response
   * @param {Object} res Express response object
   * @param {any} data Response data
   * @param {string} message Success message
   * @param {number} code HTTP status code
   */
  sendResponse(res, data, message = 'Success', code = 200) {
    return res.status(code).json({
      success: true,
      message,
      data
    });
  },

  /**
   * Send a standard error response
   * @param {Object} res Express response object
   * @param {string} errorMessage General error message
   * @param {any} errorDetails Detailed error information (optional)
   * @param {number} code HTTP status code
   */
  sendError(res, errorMessage, errorDetails = null, code = 400) {
    const response = {
      success: false,
      message: errorMessage
    };

    if (errorDetails) {
      response.details = errorDetails;
    }

    return res.status(code).json(response);
  },

  /**
   * Send a standard Laravel-like validation error response
   * @param {Object} res Express response object
   * @param {Object} errors Key-value pair of fields and their validation messages
   * @param {string} message Error message header
   * @param {number} code HTTP status code
   */
  sendValidationError(res, errors, message = 'The given data was invalid.', code = 422) {
    return res.status(code).json({
      success: false,
      message,
      errors
    });
  }
};

module.exports = ApiResponse;
