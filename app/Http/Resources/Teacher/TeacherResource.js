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
      assignmentHistory: detailedAssignments,
      photo: photoUrl,
      nfcCardUid: this.resource.nfc_card_uid || null,
      status: this.resource.status || 'active',
      createdAt: this.resource.createdAt
    };
  }
}

module.exports = TeacherResource;
