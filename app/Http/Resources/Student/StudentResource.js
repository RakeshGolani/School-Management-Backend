const BaseResource = require('../BaseResource');

/**
 * StudentResource
 * Serializes Student attributes and formats photo asset URLs.
 */
class StudentResource extends BaseResource {
  toArray() {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    let photoUrl = null;
    if (this.resource.photo && typeof this.resource.photo === 'string' && this.resource.photo.trim() !== '' && !this.resource.photo.includes('ui-avatars.com')) {
      if (this.resource.photo.startsWith('http://') || this.resource.photo.startsWith('https://') || this.resource.photo.startsWith('data:image')) {
        photoUrl = this.resource.photo;
      } else {
        photoUrl = `${baseUrl}${this.resource.photo.startsWith('/') ? this.resource.photo : `/${this.resource.photo}`}`;
      }
    } else if (this.resource.image_url && !this.resource.image_url.includes('ui-avatars.com')) {
      photoUrl = this.resource.image_url;
    }

    return {
      uuid: this.resource.uuid,
      id: this.resource.uuid || this.resource.id,
      _id: this.resource.id,
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
      rollNumber: this.resource.roll_number || `10${this.resource.id}`,
      roll_number: this.resource.roll_number || `10${this.resource.id}`,
      classId: this.resource.class_id || null,
      class_id: this.resource.class_id || null,
      grade: (() => {
        if (this.resource.schoolClass) {
          const cName = this.resource.schoolClass.class_name;
          const sec = this.resource.schoolClass.section;
          return cName.toLowerCase().startsWith('grade') ? `${cName}-${sec}` : `Grade ${cName}-${sec}`;
        }
        if (this.resource.grade) {
          return this.resource.grade.toLowerCase().startsWith('grade') ? this.resource.grade : `Grade ${this.resource.grade}`;
        }
        return 'N/A';
      })(),
      section: this.resource.schoolClass ? this.resource.schoolClass.section : (this.resource.section || 'A'),
      schoolClass: this.resource.schoolClass ? {
        id: this.resource.schoolClass.id,
        className: this.resource.schoolClass.class_name,
        class_name: this.resource.schoolClass.class_name,
        section: this.resource.schoolClass.section,
        roomNumber: this.resource.schoolClass.room_number,
        room_number: this.resource.schoolClass.room_number,
        classTeacher: this.resource.schoolClass.classTeacher ? {
          id: this.resource.schoolClass.classTeacher.id,
          name: this.resource.schoolClass.classTeacher.name,
          email: this.resource.schoolClass.classTeacher.email,
          phone: this.resource.schoolClass.classTeacher.phone,
          employeeId: this.resource.schoolClass.classTeacher.employee_id
        } : null
      } : null,
      gender: this.resource.gender || 'male',
      dob: this.resource.dob || null,
      guardianName: this.resource.guardian_name || 'Guardian',
      guardian_name: this.resource.guardian_name || 'Guardian',
      guardianEmail: this.resource.parent ? this.resource.parent.email : '',
      guardian_email: this.resource.parent ? this.resource.parent.email : '',
      guardianAddress: this.resource.parent ? this.resource.parent.address : '',
      guardian_address: this.resource.parent ? this.resource.parent.address : '',
      guardianPhone: this.resource.guardian_phone || '',
      guardian_phone: this.resource.guardian_phone || '',
      alternatePhone: this.resource.alternate_phone || '',
      alternate_phone: this.resource.alternate_phone || '',
      parentId: this.resource.parent_id || null,
      parent_id: this.resource.parent_id || null,
      photo: photoUrl,
      image_url: photoUrl,
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
      school: this.resource.school ? {
        id: this.resource.school.id,
        uuid: this.resource.school.uuid,
        code: this.resource.school.code,
        schoolName: this.resource.school.school_name,
        school_name: this.resource.school.school_name,
        email: this.resource.school.email,
        phone: this.resource.school.phone,
        logo: this.resource.school.logo,
        logo_url: this.resource.school.logo_url
      } : null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = StudentResource;
