const BaseResource = require('../BaseResource');

/**
 * TeacherResource
 * Serializes Teacher attributes and formats photo asset URLs.
 */
class TeacherResource extends BaseResource {
  toArray() {
    let photoUrl = this.resource.photo || null;
    if (photoUrl && photoUrl.startsWith('/uploads/')) {
      photoUrl = `http://localhost:5000${photoUrl}`;
    }

    return {
      id: this.resource.id,
      schoolId: this.resource.school_id,
      employeeId: this.resource.employee_id || `EMP-${this.resource.id + 1000}`,
      name: this.resource.name,
      email: this.resource.email,
      phone: this.resource.phone || '',
      gender: this.resource.gender || 'male',
      qualification: this.resource.qualification || 'M.Sc, B.Ed',
      subject: this.resource.subject || 'Mathematics',
      classAssigned: this.resource.class_assigned || 'Grade 10-A',
      photo: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = TeacherResource;
