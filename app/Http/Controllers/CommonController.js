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

  static async submitInquiry(req, res) {
    try {
      const { Inquiry } = require('../../Models');
      const { 
        representative_name, 
        representativeName, 
        email, 
        school_name, 
        school, 
        phone, 
        module_interest, 
        moduleInterest, 
        message 
      } = req.body;

      const finalName = (representative_name || representativeName || '').trim();
      const finalEmail = (email || '').trim().toLowerCase();
      const finalSchool = (school_name || school || '').trim();
      const finalPhone = (phone || '').trim();
      const finalModule = module_interest || moduleInterest || 'full_suite';
      const finalMessage = message ? String(message).trim() : null;

      if (!finalName || !finalEmail || !finalSchool || !finalPhone) {
        return res.status(400).json({
          success: false,
          message: 'Please provide representative name, email, school name, and phone number.'
        });
      }

      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }

      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || null;

      const inquiry = await Inquiry.create({
        representative_name: finalName,
        email: finalEmail,
        school_name: finalSchool,
        phone: finalPhone,
        module_interest: finalModule,
        message: finalMessage,
        status: 'PENDING',
        ip_address: clientIp
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your demonstration request has been submitted successfully. Our team will contact you shortly.',
        data: inquiry
      });
    } catch (error) {
      console.error('CommonController submitInquiry Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit demonstration inquiry'
      });
    }
  }

  static async getPlans(req, res) {
    try {
      const { Package, PlanFeature } = require('../../Models');
      const packages = await Package.findAll({
        where: { is_active: true },
        include: [
          {
            model: PlanFeature,
            as: 'features',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
          }
        ],
        order: [
          ['sort_order', 'ASC'],
          ['id', 'ASC'],
          [{ model: PlanFeature, as: 'features' }, 'sort_order', 'ASC']
        ]
      });

      const plans = packages.map(p => {
        const plain = p.toJSON();
        if (Array.isArray(plain.features)) {
          plain.features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        return plain;
      });

      return res.status(200).json({
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: {
          plans,
          packages: plans
        }
      });
    } catch (error) {
      console.error('CommonController getPlans Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve plans'
      });
    }
  }
}

module.exports = CommonController;
