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
      school_id: this.resource.school_id,
      firstName: this.resource.first_name,
      first_name: this.resource.first_name,
      lastName: this.resource.last_name,
      last_name: this.resource.last_name,
      fullName: `${this.resource.first_name} ${this.resource.last_name}`,
      full_name: `${this.resource.first_name} ${this.resource.last_name}`,
      admissionNumber: this.resource.admission_number || `ADM-${this.resource.id + 1000}`,
      admission_number: this.resource.admission_number || `ADM-${this.resource.id + 1000}`,
      grade: this.resource.grade || 'Grade 10-A',
      section: this.resource.section || 'A',
      gender: this.resource.gender || 'male',
      dob: this.resource.dob || null,
      guardianName: this.resource.guardian_name || 'Guardian',
      guardian_name: this.resource.guardian_name || 'Guardian',
      guardianEmail: this.resource.parent ? this.resource.parent.email : '',
      guardian_email: this.resource.parent ? this.resource.parent.email : '',
      guardianPhone: this.resource.guardian_phone || '',
      guardian_phone: this.resource.guardian_phone || '',
      alternatePhone: this.resource.alternate_phone || '',
      alternate_phone: this.resource.alternate_phone || '',
      parentId: this.resource.parent_id || null,
      parent_id: this.resource.parent_id || null,
      photo: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      nfc_card_uid: this.resource.nfc_card_uid || null,
      isBusServiceEnabled: Boolean(this.resource.is_bus_service_enabled),
      is_bus_service_enabled: Boolean(this.resource.is_bus_service_enabled),
      busRouteId: this.resource.bus_route_id || null,
      bus_route_id: this.resource.bus_route_id || null,
      busStopId: this.resource.bus_stop_id || null,
      bus_stop_id: this.resource.bus_stop_id || null,
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
