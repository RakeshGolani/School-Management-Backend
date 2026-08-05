const BaseResource = require('../BaseResource');

/**
 * StudentResource
 * Serializes Student attributes and formats photo asset URLs.
 */
class StudentResource extends BaseResource {
  toArray() {
    let photoUrl = this.resource.photo || null;
    if (photoUrl && photoUrl.startsWith('/uploads/')) {
      photoUrl = `http://localhost:5000${photoUrl}`;
    }

    return {
      id: this.resource.id,
      schoolId: this.resource.school_id,
      firstName: this.resource.first_name,
      lastName: this.resource.last_name,
      fullName: `${this.resource.first_name} ${this.resource.last_name}`,
      admissionNumber: this.resource.admission_number || `ADM-${this.resource.id + 1000}`,
      grade: this.resource.grade || 'Grade 10-A',
      section: this.resource.section || 'A',
      gender: this.resource.gender || 'male',
      dob: this.resource.dob || null,
      guardianName: this.resource.guardian_name || 'Guardian',
      guardianEmail: this.resource.parent ? this.resource.parent.email : '',
      guardianPhone: this.resource.guardian_phone || '',
      alternatePhone: this.resource.alternate_phone || '',
      parentId: this.resource.parent_id || null,
      photo: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      isBusServiceEnabled: Boolean(this.resource.is_bus_service_enabled),
      busRouteId: this.resource.bus_route_id || null,
      busStopId: this.resource.bus_stop_id || null,
      busRoute: this.resource.busRoute ? {
        id: this.resource.busRoute.id,
        routeName: this.resource.busRoute.route_name,
        routeNumber: this.resource.busRoute.route_number
      } : null,
      busStop: this.resource.busStop ? {
        id: this.resource.busStop.id,
        stopName: this.resource.busStop.stop_name
      } : null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = StudentResource;
