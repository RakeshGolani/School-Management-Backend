const BaseResource = require('../BaseResource');

/**
 * AdminDashboardResource
 * Transforms admin data into a formatted API response layout.
 */
class AdminDashboardResource extends BaseResource {
  /**
   * Transform data
   */
  toArray(request = null) {
    return {
      adminId: this.resource.id,
      name: `${this.resource.firstName || ''} ${this.resource.lastName || ''}`.trim(),
      role: 'Administrator',
      systemHealth: 'Optimal',
      joinedAt: this.resource.createdAt || new Date()
    };
  }
}

module.exports = AdminDashboardResource;
