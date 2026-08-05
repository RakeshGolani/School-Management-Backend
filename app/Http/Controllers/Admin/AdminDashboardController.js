const BaseController = require('../BaseController');
const AdminDashboardResource = require('../../Resources/Admin/AdminDashboardResource');
const { Admin } = require('../../../Models');
const bcrypt = require('bcryptjs');

/**
 * AdminDashboardController
 * Handles dynamic admin authentication and dashboard logic.
 */
class AdminDashboardController extends BaseController {
  constructor() {
    super();
    // Bind methods to preserve 'this' context from BaseController
    this.index = this.index.bind(this);
    this.login = this.login.bind(this);
  }

  /**
   * Get Admin dashboard info
   */
  async index(req, res) {
    try {
      const adminData = {
        id: 1,
        firstName: 'System',
        lastName: 'Admin',
        createdAt: new Date()
      };

      const data = new AdminDashboardResource(adminData).toJson();
      return this.sendResponse(res, data, 'Admin dashboard stats retrieved successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * Dynamic Admin Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return this.sendError(res, 'Email and password are required', 400);
      }

      // Query database for admin record
      const admin = await Admin.findOne({ where: { email } });

      if (!admin) {
        return this.sendError(res, 'Invalid credentials: User account not found', 401);
      }

      // Verify bcrypt password hash
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        return this.sendError(res, 'Invalid credentials: Password incorrect', 401);
      }

      // Generate session token string
      const tokenPayload = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        issuedAt: new Date().toISOString()
      };

      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      return this.sendResponse(
        res, 
        { 
          token, 
          user: { 
            id: admin.id, 
            name: admin.name, 
            email: admin.email, 
            role: 'admin' 
          } 
        }, 
        'Admin authentication successful'
      );
    } catch (error) {
      console.error('Error during admin login:', error);
      return this.sendError(res, 'Internal server error during authentication', 500);
    }
  }
}

module.exports = new AdminDashboardController();
