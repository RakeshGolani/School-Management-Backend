const BaseController = require('../BaseController');

/**
 * StudentController
 * Dedicated Controller for Student / Parent Portal operations
 */
class StudentController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
  }

  async index(req, res) {
    return this.sendResponse(res, [], 'Student portal initialized');
  }

  async show(req, res) {
    return this.sendResponse(res, { id: req.params.id }, 'Student profile');
  }
}

module.exports = new StudentController();
