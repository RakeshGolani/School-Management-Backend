const BaseController = require('../BaseController');
const { School, AcademicYear, Package } = require('../../../Models');
const SchoolResource = require('../../Resources/School/SchoolResource');
const { removeFile } = require('../../../../utils/UploadUtils');
const bcrypt = require('bcryptjs');

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

/**
 * SchoolController
 * Handles dynamic School account registration, login authentication, and profile endpoints.
 */
class SchoolController extends BaseController {
  constructor() {
    super();
    // Bind methods to preserve 'this' context from BaseController
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.profile = this.profile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  /**
   * Register a new School entity
   */
  async register(req, res) {
    try {
      const { school_name, code, email, password, phone, address, package_id } = req.body;

      // Check if email or school code already exists
      const existingSchool = await School.findOne({
        where: { email }
      });

      if (existingSchool) {
        return this.sendError(res, 'A school account with this email address already exists.', 400);
      }

      const existingCode = await School.findOne({
        where: { code }
      });

      if (existingCode) {
        return this.sendError(res, 'A school with this registration code already exists.', 400);
      }

      // Determine default package
      let resolvedPackageId = package_id;
      if (!resolvedPackageId) {
        const fullSuitePkg = await Package.findOne({ where: { code: 'FULL_SUITE' } });
        if (fullSuitePkg) resolvedPackageId = fullSuitePkg.id;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create school
      const school = await School.create({
        school_name,
        code,
        email,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        package_id: resolvedPackageId,
        status: 'active'
      });

      // Auto-create active Current Academic Year for the new school
      await AcademicYear.create(getDefaultAcademicYearData(school.id));

      const schoolWithPackage = await School.findByPk(school.id, {
        include: [{ model: Package, as: 'package' }]
      });

      const schoolData = new SchoolResource(schoolWithPackage || school).toJson();
      return this.sendResponse(res, schoolData, 'School account created successfully', 201);
    } catch (error) {
      console.error('Error registering school:', error);
      return this.sendError(res, 'Failed to create school account: ' + error.message, 500);
    }
  }

  /**
   * School Portal Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return this.sendError(res, 'Email and password fields are required.', 400);
      }

      // Find school by email with package
      const school = await School.findOne({
        where: { email },
        include: [{ model: Package, as: 'package' }]
      });

      if (!school) {
        return this.sendError(res, 'Invalid credentials: School account not found.', 401);
      }

      // Check if school portal access is active
      if (school.status !== 'active') {
        return this.sendError(res, 'Your school portal access has been disabled by the Super Admin. Please contact support.', 403);
      }

      // Verify bcrypt password
      const isMatch = await bcrypt.compare(password, school.password);

      if (!isMatch) {
        return this.sendError(res, 'Invalid credentials: Incorrect password.', 401);
      }

      const schoolData = new SchoolResource(school).toJson();

      // Token payload
      const tokenPayload = {
        id: school.id,
        schoolName: school.school_name,
        code: school.code,
        email: school.email,
        role: 'school',
        issuedAt: new Date().toISOString()
      };

      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      return this.sendResponse(
        res,
        {
          token,
          user: schoolData
        },
        'School authentication successful'
      );
    } catch (error) {
      console.error('Error during school login:', error);
      return this.sendError(res, 'Internal server error during authentication: ' + error.message, 500);
    }
  }

  /**
   * Get School profile
   */
  async profile(req, res) {
    try {
      const { schoolId } = req.query;
      const school = await School.findByPk(schoolId || 1, {
        include: [{ model: Package, as: 'package' }]
      });

      if (!school) {
        return this.sendError(res, 'School profile not found', 404);
      }

      const schoolData = new SchoolResource(school).toJson();
      return this.sendResponse(res, schoolData, 'School profile retrieved successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Update School profile details and logo image
   */
  async updateProfile(req, res) {
    try {
      const { schoolId, school_name, email, phone, address, latitude, longitude, primary_color, primaryColor, logo } = req.body;
      const targetId = schoolId || 1;

      const school = await this.findByUuidOrPk(School, targetId);

      if (!school) {
        return this.sendError(res, 'School profile not found', 404);
      }

      if (school_name) school.school_name = school_name;
      if (email) school.email = email;
      if (phone !== undefined) school.phone = phone;
      if (address !== undefined) school.address = address;
      if (latitude !== undefined) school.latitude = latitude ? parseFloat(latitude) : null;
      if (longitude !== undefined) school.longitude = longitude ? parseFloat(longitude) : null;
      if (primary_color || primaryColor) school.primary_color = primary_color || primaryColor;

      // Handle file upload via Multer disk storage (matching aRoadRunner architecture)
      if (req.file) {
        if (school.logo) {
          removeFile(school.logo);
        }
        school.logo = `/uploads/schools/${req.file.filename}`;
      } else if (logo !== undefined) {
        if (!logo && school.logo) {
          removeFile(school.logo);
          school.logo = null;
        } else if (logo) {
          school.logo = logo;
        }
      }

      await school.save();

      const schoolData = new SchoolResource(school).toJson();
      return this.sendResponse(res, schoolData, 'School profile updated successfully');
    } catch (error) {
      console.error('Error updating school profile:', error);
      return this.sendError(res, 'Failed to update profile: ' + error.message, 500);
    }
  }

  /**
   * Change School Portal Password
   */
  async changePassword(req, res) {
    try {
      const { schoolId, current_password, new_password } = req.body;
      const targetId = schoolId || 1;

      const school = await School.findByPk(targetId);

      if (!school) {
        return this.sendError(res, 'School account not found', 404);
      }

      // Verify current password with bcrypt
      const isMatch = await bcrypt.compare(current_password, school.password);
      if (!isMatch) {
        return this.sendValidationError(
          res, 
          { current_password: ['Current password is incorrect.'] }, 
          'Current password is incorrect.', 
          400
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      school.password = hashedPassword;
      await school.save();

      return this.sendResponse(res, null, 'Password updated successfully!');
    } catch (error) {
      console.error('Error changing school password:', error);
      return this.sendError(res, 'Failed to change password: ' + error.message, 500);
    }
  }
}

module.exports = new SchoolController();
