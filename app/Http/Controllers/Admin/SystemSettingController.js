const BaseController = require('../BaseController');
const { SystemSetting } = require('../../../Models');

class SystemSettingController extends BaseController {
  constructor() {
    super();
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
  }

  async getSettings(req, res) {
    try {
      let settings = await SystemSetting.findOne();
      if (!settings) {
        settings = await SystemSetting.create({});
      }
      return this.sendResponse(res, settings, 'System settings retrieved successfully');
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return this.sendError(res, 'Internal server error', 500);
    }
  }

  async updateSettings(req, res) {
    try {
      let settings = await SystemSetting.findOne();
      const payload = { ...req.body };
      
      if (req.file) {
        payload.logo_url = `/uploads/system/${req.file.filename}`;
      }

      if (!settings) {
        settings = await SystemSetting.create(payload);
      } else {
        await settings.update(payload);
      }
      return this.sendResponse(res, settings, 'System settings updated successfully');
    } catch (error) {
      console.error('Error updating system settings:', error);
      return this.sendError(res, 'Internal server error', 500);
    }
  }
}

module.exports = new SystemSettingController();
