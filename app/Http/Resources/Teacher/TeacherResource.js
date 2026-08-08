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

    const assignedClassesList = this.resource.assignedClasses 
      ? this.resource.assignedClasses.map(ac => {
          if (ac.schoolClass) {
            return `${ac.schoolClass.class_name}-${ac.schoolClass.section}`;
          }
          return ac.class_id ? `Class #${ac.class_id}` : (ac.class_name || '');
        }).filter(Boolean)
      : (this.resource.class_assigned ? this.resource.class_assigned.split(',').map(c => c.trim()).filter(Boolean) : []);

    const classAssignedStr = assignedClassesList.length > 0 ? assignedClassesList.join(', ') : (this.resource.class_assigned || '');

    return {
      id: this.resource.id,
      schoolId: this.resource.school_id,
      employeeId: this.resource.employee_id || `EMP-${this.resource.id + 1000}`,
      name: this.resource.name,
      email: this.resource.email,
      phone: this.resource.phone || '',
      gender: this.resource.gender || 'male',
      qualification: this.resource.qualification || '',
      subject: this.resource.subject || '',
      classAssigned: classAssignedStr,
      assignedClasses: assignedClassesList,
      photo: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = TeacherResource;
