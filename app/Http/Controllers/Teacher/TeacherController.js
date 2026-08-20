const BaseController = require('../BaseController');

/**
 * TeacherController
 * Dedicated Controller for Teacher Portal / App operations
 */
class TeacherController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
  }

  async index(req, res) {
    return this.sendResponse(res, [], 'Teacher portal initialized');
  }

  async show(req, res) {
    return this.sendResponse(res, { id: req.params.id }, 'Teacher profile');
  }
}

module.exports = new TeacherController();
