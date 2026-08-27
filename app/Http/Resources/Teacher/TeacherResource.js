const BaseResource = require('../BaseResource');

/**
 * TeacherResource
 * Serializes Teacher attributes and formats photo asset URLs.
 */
class TeacherResource extends BaseResource {
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

    const detailedAssignments = this.resource.assignedClasses 
      ? this.resource.assignedClasses.map(ac => {
          const className = ac.schoolClass ? `${ac.schoolClass.class_name}-${ac.schoolClass.section}` : (ac.class_id ? `Class #${ac.class_id}` : '');
          const yearName = ac.academicYear ? ac.academicYear.year_name : null;
          return {
            id: ac.id,
            classId: ac.class_id,
            className: className,
            academicYearId: ac.academic_year_id,
            academicYearName: yearName
          };
        })
      : [];

    const assignedClassesList = detailedAssignments.length > 0
      ? detailedAssignments.map(a => a.className).filter(Boolean)
      : (this.resource.class_assigned ? this.resource.class_assigned.split(',').map(c => c.trim()).filter(Boolean) : []);

    const classAssignedStr = assignedClassesList.length > 0 ? assignedClassesList.join(', ') : (this.resource.class_assigned || '');

    return {
      uuid: this.resource.uuid,
      id: this.resource.uuid || this.resource.id,
      _id: this.resource.id,
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
      assignmentHistory: detailedAssignments,
      academicSessionHistory: detailedAssignments,
      photo: photoUrl,
      image_url: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = TeacherResource;
