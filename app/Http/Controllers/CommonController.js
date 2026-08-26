const CommonService = require('../../Services/CommonService');

class CommonController {
  static async updateStatus(req, res) {
    try {
      const { module, id, status } = req.body;
      
      if (!module || !id || !status) {
        return res.status(400).json({ success: false, message: "Module, id, and status are required" });
      }

      const result = await CommonService.updateStatus(module, id, status);

      return res.status(200).json({
        success: true,
        message: `${module} status updated successfully`,
        data: result
      });
    } catch (error) {
      console.error('CommonController updateStatus Error:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }

  static async deleteEntity(req, res) {
    try {
      const { module, id } = req.body;
      
      if (!module || !id) {
        return res.status(400).json({ success: false, message: "Module and id are required" });
      }

      const result = await CommonService.deleteEntity(module, id);

      return res.status(200).json({
        success: true,
        message: `${module} deleted successfully`,
        data: result
      });
    } catch (error) {
      console.error('CommonController deleteEntity Error:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }

  static async getSystemSettings(req, res) {
    try {
      const { SystemSetting } = require('../../Models');
      let settings = await SystemSetting.findOne();
      if (!settings) {
        settings = await SystemSetting.create({});
      }
      return res.status(200).json({
        success: true,
        message: 'System settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      console.error('CommonController getSystemSettings Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = CommonController;
