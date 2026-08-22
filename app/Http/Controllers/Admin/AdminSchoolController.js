const { validationResult } = require('express-validator');
const { School, Admin, SchoolSubscription, AcademicYear, Package } = require('../../../Models');
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
        include: [
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'code', 'name', 'icon', 'badge_color', 'modules']
          }
        ],
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
            model: Package,
            as: 'package',
            attributes: ['id', 'code', 'name', 'icon', 'badge_color', 'modules']
          },
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
      const { school_name, code, email, password, phone, address, primary_color, background_color, logo, package_id } = req.body;

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

      // Determine package_id fallback if not provided (default to FULL_SUITE package)
      let resolvedPackageId = package_id;
      if (!resolvedPackageId) {
        const defaultPkg = await Package.findOne({ where: { code: 'FULL_SUITE' } });
        if (defaultPkg) resolvedPackageId = defaultPkg.id;
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
        package_id: resolvedPackageId,
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

      const schoolWithPackage = await School.findByPk(school.id, {
        include: [{ model: Package, as: 'package' }]
      });

      return res.status(201).json({
        success: true,
        message: 'School created successfully and credentials sent to email',
        data: schoolWithPackage || school
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
      const { id } = req.params;
      const { school_name, code, email, password, phone, address, latitude, longitude, primary_color, background_color, logo, package_id } = req.body;

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

      if (package_id !== undefined) {
        updateData.package_id = package_id ? parseInt(package_id) : null;
      }

      if (logo !== undefined && logo !== null && logo !== '') {
        updateData.logo = logo;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await school.update(updateData);

      const updatedSchool = await School.findByPk(id, {
        include: [{ model: Package, as: 'package' }]
      });

      return res.json({
        success: true,
        message: 'School updated successfully',
        data: updatedSchool || school
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

  // PUT /api/admin/schools/:id/pricing
  static async updateCustomPricing(req, res) {
    try {
      const { id } = req.params;
      const {
        custom_base_fee_monthly,
        custom_base_fee_yearly,
        custom_student_fee_monthly,
        custom_student_fee_yearly,
        custom_bus_fee_monthly,
        custom_bus_fee_yearly,
        custom_discount_percent
      } = req.body;

      const school = await School.findByPk(id);
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      let subscription = await SchoolSubscription.findOne({ where: { school_id: id } });
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found for this school' });
      }

      // Update allowed fields
      if (custom_base_fee_monthly !== undefined) subscription.custom_base_fee_monthly = custom_base_fee_monthly;
      if (custom_base_fee_yearly !== undefined) subscription.custom_base_fee_yearly = custom_base_fee_yearly;
      if (custom_student_fee_monthly !== undefined) subscription.custom_student_fee_monthly = custom_student_fee_monthly;
      if (custom_student_fee_yearly !== undefined) subscription.custom_student_fee_yearly = custom_student_fee_yearly;
      if (custom_bus_fee_monthly !== undefined) subscription.custom_bus_fee_monthly = custom_bus_fee_monthly;
      if (custom_bus_fee_yearly !== undefined) subscription.custom_bus_fee_yearly = custom_bus_fee_yearly;
      if (custom_discount_percent !== undefined) subscription.custom_discount_percent = custom_discount_percent;

      await subscription.save();

      return res.json({
        success: true,
        message: 'Custom pricing updated successfully',
        data: subscription
      });
    } catch (error) {
      console.error('Error updating custom pricing:', error);
      return res.status(500).json({ success: false, message: 'Server error updating custom pricing' });
    }
  }
}

module.exports = AdminSchoolController;
