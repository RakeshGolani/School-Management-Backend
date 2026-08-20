const { validationResult } = require('express-validator');
const { School, Admin, SchoolSubscription, AcademicYear } = require('../../../Models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../../../../utils/EmailService');

/**
 * Helper to generate default current Academic Year details dynamically
 */
function getDefaultAcademicYearData(schoolId) {
  const now = new Date();
  const startYear = now.getFullYear();
  const endYear = startYear + 1;
  const yearName = `${startYear}-${endYear}`;

  // Current Date in YYYY-MM-DD format
  const startDateStr = now.toISOString().split('T')[0];

  // End Date: 1 year from registration date in YYYY-MM-DD format
  const endDateObj = new Date(now);
  endDateObj.setFullYear(endDateObj.getFullYear() + 1);
  const endDateStr = endDateObj.toISOString().split('T')[0];

  return {
    school_id: schoolId,
    year_name: yearName,
    start_date: startDateStr,
    end_date: endDateStr,
    is_active: true,
    status: 'ACTIVE',
    description: `Default Academic Session ${yearName}`
  };
}

class AdminSchoolController {
  
  // GET /api/admin/schools
  static async index(req, res) {
    try {
      const schools = await School.findAll({
        order: [['createdAt', 'DESC']]
      });
      return res.json({
        success: true,
        data: schools
      });
    } catch (error) {
      console.error('Error fetching schools:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching schools' });
    }
  }

  // GET /api/admin/schools/:id
  static async show(req, res) {
    try {
      const { id } = req.params;
      const { 
        School, 
        Teacher, 
        Student, 
        SchoolClass, 
        AcademicYear, 
        SchoolSubscription, 
        SubscriptionTransaction, 
        SchoolInvoice 
      } = require("../../../Models");

      const school = await School.findByPk(id, {
        include: [
          {
            model: SchoolSubscription,
            as: 'subscription'
          },
          {
            model: AcademicYear,
            as: 'academicYears'
          }
        ]
      });

      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      // Fetch Teachers for this school
      const teachers = await Teacher.findAll({
        where: { school_id: id },
        order: [['createdAt', 'DESC']]
      });

      // Fetch Students for this school
      const students = await Student.findAll({
        where: { school_id: id },
        include: [{ model: SchoolClass, as: 'schoolClass', attributes: ['id', 'class_name', 'section'] }],
        order: [['createdAt', 'DESC']]
      });

      // Fetch Classes for this school
      const classes = await SchoolClass.findAll({
        where: { school_id: id },
        include: [{ model: Teacher, as: 'classTeacher', attributes: ['id', 'name', 'email'] }],
        order: [['class_name', 'ASC'], ['section', 'ASC']]
      });

      // Fetch Transactions & Invoices for this school
      const transactions = await SubscriptionTransaction.findAll({
        where: { school_id: id },
        include: [{ model: SchoolInvoice, as: 'invoice' }],
        order: [['createdAt', 'DESC']]
      });

      return res.json({
        success: true,
        data: {
          school,
          stats: {
            totalTeachers: teachers.length,
            totalStudents: students.length,
            totalClasses: classes.length,
            activeStudents: students.filter(s => s.status === 'active').length,
          },
          teachers,
          students,
          classes,
          subscription: school.subscription || null,
          transactions
        }
      });
    } catch (error) {
      console.error('Error fetching school detail:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching school details' });
    }
  }

  // POST /api/admin/schools
  static async store(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach(err => {
        formattedErrors[err.path] = err.msg;
      });
      return res.status(422).json({ success: false, errors: formattedErrors });
    }

    try {
      const { school_name, code, email, password, phone, address, primary_color, background_color, logo } = req.body;

      // Check for unique email
      const existingEmail = await School.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(422).json({ success: false, errors: { email: 'Email already exists' } });
      }

      // Check for unique code
      const existingCode = await School.findOne({ where: { code } });
      if (existingCode) {
        return res.status(422).json({ success: false, errors: { code: 'School code already exists' } });
      }

      // Generate random password if not provided by Super Admin
      const rawPassword = password || crypto.randomBytes(4).toString('hex');
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const school = await School.create({
        school_name,
        code,
        email,
        password: hashedPassword,
        phone,
        address,
        logo,
        primary_color: primary_color || '#14b8a6',
        background_color: background_color || '#0f172a',
        status: 'active'
      });

      // Auto-create active Current Academic Year for the new school
      await AcademicYear.create(getDefaultAcademicYearData(school.id));

      // Send credentials email asynchronously
      emailService.sendNewSchoolCredentialsEmail({
        email,
        password: rawPassword,
        schoolName: school_name,
        code,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }).catch((err) => {
        console.error('Asynchronous credentials email dispatch error:', err);
      });

      return res.status(201).json({
        success: true,
        message: 'School created successfully and credentials sent to email',
        data: school
      });
    } catch (error) {
      console.error('Error creating school:', error);
      return res.status(500).json({ success: false, message: 'Server error creating school' });
    }
  }

  // PUT /api/admin/schools/:id
  static async update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach(err => {
        formattedErrors[err.path] = err.msg;
      });
      return res.status(422).json({ success: false, errors: formattedErrors });
    }

    try {
      const { school_name, code, email, password, phone, address, latitude, longitude, primary_color, background_color, logo } = req.body;

      const school = await School.findByPk(id);
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      // Check for unique email
      if (email !== school.email) {
        const existingEmail = await School.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(422).json({ success: false, errors: { email: 'Email already exists' } });
        }
      }

      // Check for unique code
      if (code !== school.code) {
        const existingCode = await School.findOne({ where: { code } });
        if (existingCode) {
          return res.status(422).json({ success: false, errors: { code: 'School code already exists' } });
        }
      }

      const updateData = {
        school_name,
        code,
        email,
        phone,
        address,
        latitude: latitude ? parseFloat(latitude) : school.latitude,
        longitude: longitude ? parseFloat(longitude) : school.longitude,
        primary_color: primary_color || '#14b8a6'
      };

      if (logo !== undefined && logo !== null && logo !== '') {
        updateData.logo = logo;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await school.update(updateData);

      return res.json({
        success: true,
        message: 'School updated successfully',
        data: school
      });
    } catch (error) {
      console.error('Error updating school:', error);
      return res.status(500).json({ success: false, message: 'Server error updating school' });
    }
  }

  // DELETE /api/admin/schools/:id
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const school = await School.findByPk(id);
      
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      await school.destroy(); // Soft delete because paranoid: true

      return res.json({
        success: true,
        message: 'School deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting school:', error);
      return res.status(500).json({ success: false, message: 'Server error deleting school' });
    }
  }

  // PUT /api/admin/schools/:id/status
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const school = await School.findByPk(id);
      
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      await school.update({ status });

      return res.json({
        success: true,
        message: `School status updated to ${status}`,
        data: school
      });
    } catch (error) {
      console.error('Error updating school status:', error);
      return res.status(500).json({ success: false, message: 'Server error updating school status' });
    }
  }
}

module.exports = AdminSchoolController;
