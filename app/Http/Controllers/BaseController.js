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

  /**
   * Helper to build Sequelize where clause for UUID or integer PK
   */
  resolveIdWhere(identifier) {
    if (!identifier) return {};
    const isUuid = typeof identifier === 'string' && identifier.includes('-');
    if (isUuid || isNaN(identifier)) {
      return { uuid: identifier };
    }
    const { Op } = require('sequelize');
    return {
      [Op.or]: [
        { uuid: identifier },
        { id: parseInt(identifier, 10) }
      ]
    };
  }

  /**
   * Find model instance by UUID or PK
   */
  async findByUuidOrPk(Model, identifier, options = {}) {
    if (!identifier) return null;
    const isUuid = typeof identifier === 'string' && identifier.includes('-');
    if (isUuid || isNaN(identifier)) {
      return await Model.findOne({
        where: { uuid: identifier },
        ...options
      });
    }
    const { Op } = require('sequelize');
    return await Model.findOne({
      where: {
        [Op.or]: [
          { uuid: identifier },
          { id: parseInt(identifier, 10) }
        ]
      },
      ...options
    });
  }
}

module.exports = BaseController;
