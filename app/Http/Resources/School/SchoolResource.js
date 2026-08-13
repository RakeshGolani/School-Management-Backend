const BaseResource = require('../BaseResource');

/**
 * SchoolResource
 * Formats School profile attributes for API responses.
 */
class SchoolResource extends BaseResource {
  toArray() {
    let logoUrl = this.resource.logo || null;
    if (logoUrl && logoUrl.startsWith('/uploads/')) {
      const backendUrl = process.env.APP_URL || 'http://localhost:5000';
      logoUrl = `${backendUrl}${logoUrl}`;
    }

    return {
      id: this.resource.id,
      schoolName: this.resource.school_name,
      code: this.resource.code,
      email: this.resource.email,
      phone: this.resource.phone || '',
      address: this.resource.address || '',
      logo: logoUrl,
      status: this.resource.status || 'active',
      primaryColor: this.resource.primary_color || '#14b8a6',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = SchoolResource;
