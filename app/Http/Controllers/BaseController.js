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
    return BaseController.resolveIdWhere(identifier);
  }

  async resolveSchoolId(identifier) {
    return await BaseController.resolveSchoolId(identifier);
  }

  static async resolveSchoolId(identifier) {
    if (!identifier) return 1;
    if (typeof identifier === 'number') return identifier;
    if (typeof identifier === 'string' && !identifier.includes('-') && !isNaN(identifier)) {
      return parseInt(identifier, 10);
    }
    const { School } = require('../../Models');
    const school = await School.findOne({
      where: { uuid: identifier },
      attributes: ['id']
    });
    return school ? school.id : 1;
  }

  static resolveIdWhere(identifier) {
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
    return await BaseController.findByUuidOrPk(Model, identifier, options);
  }

  static async findByUuidOrPk(Model, identifier, options = {}) {
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

  /**
   * Universal School Status Validator
   * Checks if school is active; if not, responds with standardized 403 error.
   * Returns true if active, or false (and sends response) if inactive/disabled.
   */
  validateSchoolStatus(res, school) {
    if (!school) {
      this.sendError(res, 'Associated school institution not found or inaccessible.', null, 404);
      return false;
    }
    if (school.status !== 'active') {
      const msg = school.status === 'pending'
        ? 'Your school registration is currently pending Super Admin approval.'
        : 'Your school portal access has been disabled by the Super Admin. Please contact support.';
      this.sendError(res, msg, null, 403);
      return false;
    }
    return true;
  }

  /**
   * Universal User Account Status Validator
   * Checks if an individual user account (Teacher, Student, etc.) is active.
   */
  validateAccountStatus(res, entity, entityName = 'Account') {
    if (!entity) {
      this.sendError(res, `Invalid credentials: ${entityName} not found.`, null, 404);
      return false;
    }
    if (entity.status && entity.status !== 'active') {
      this.sendError(res, `Your ${entityName.toLowerCase()} is currently ${entity.status}. Please contact the school administrator.`, null, 403);
      return false;
    }
    return true;
  }

  /**
   * Universal Parent School Status Validator
   * Ensures at least one linked child belongs to an active school institution.
   */
  validateParentSchoolStatus(res, children = []) {
    if (!children || children.length === 0) return true;
    const hasActiveSchool = children.some(c => c.school && c.school.status === 'active');
    if (!hasActiveSchool) {
      this.sendError(res, 'Your school portal access has been disabled by the Super Admin. Please contact school administration.', null, 403);
      return false;
    }
    return true;
  }
}

module.exports = BaseController;
