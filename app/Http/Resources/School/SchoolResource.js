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
      latitude: this.resource.latitude !== undefined && this.resource.latitude !== null ? parseFloat(this.resource.latitude) : 19.1136,
      longitude: this.resource.longitude !== undefined && this.resource.longitude !== null ? parseFloat(this.resource.longitude) : 72.8697,
      logo: logoUrl,
      status: this.resource.status || 'active',
      primaryColor: this.resource.primary_color || '#0047AB',
      package: this.resource.package ? {
        id: this.resource.package.id,
        code: this.resource.package.code,
        name: this.resource.package.name,
        icon: this.resource.package.icon,
        badgeColor: this.resource.package.badge_color,
        modules: this.resource.package.modules || []
      } : {
        id: null,
        code: 'FULL_SUITE',
        name: 'Full Suite',
        icon: 'Layers',
        badgeColor: 'indigo',
        modules: ['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years', 'transport']
      },
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = SchoolResource;
