/**
 * BaseResource
 * Parent class for transforming database models or custom payloads into standardized API structures.
 */
class BaseResource {
  /**
   * @param {Object} resource Data object to transform
   */
  constructor(resource) {
    this.resource = resource;
  }

  /**
   * Transform the resource into an object.
   * Overwrite this method in child Resource classes.
   * @param {Object} request Express request object (optional)
   * @returns {Object}
   */
  toArray(request = null) {
    return this.resource;
  }

  /**
   * Helper to format a single resource
   * @param {Object} request Express request object (optional)
   * @returns {Object|null}
   */
  toJson(request = null) {
    if (!this.resource) return null;
    return this.toArray(request);
  }

  /**
   * Helper to format a collection/array of resources
   * @param {Array} resources Array of resources
   * @param {Object} request Express request object (optional)
   * @returns {Array}
   */
  static collection(resources, request = null) {
    if (!resources || !Array.isArray(resources)) {
      return [];
    }
    return resources.map(resource => {
      const ResourceClass = this;
      return new ResourceClass(resource).toArray(request);
    });
  }
}

module.exports = BaseResource;
