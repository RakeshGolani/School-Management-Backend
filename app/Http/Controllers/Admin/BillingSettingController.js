const BaseController = require('../BaseController');
const { BillingSetting } = require('../../../Models');

/**
 * BillingSettingController
 * Handles global SaaS pricing configurations for Super Admin.
 */
class BillingSettingController extends BaseController {
  constructor() {
    super();
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
  }

  /**
   * Get dynamic global billing settings
   */
  async getSettings(req, res) {
    try {
      // Find or create default settings row
      let settings = await BillingSetting.findOne();
      if (!settings) {
        settings = await BillingSetting.create({
          base_fee_monthly: 1000.00,
          base_fee_yearly: 10000.00,
          student_fee_monthly: 10.00,
          student_fee_yearly: 100.00,
          bus_fee_monthly: 100.00,
          bus_fee_yearly: 1000.00,
          yearly_discount_percent: 15.00,
          tax_rate_percent: 18.00,
          grace_period_days: 7
        });
      }

      return this.sendResponse(res, settings, 'Global billing settings retrieved successfully');
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      return this.sendError(res, 'Internal server error fetching billing settings', 500);
    }
  }

  /**
   * Update global billing settings
   */
  async updateSettings(req, res) {
    try {
      const {
        base_fee_monthly,
        base_fee_yearly,
        student_fee_monthly,
        student_fee_yearly,
        bus_fee_monthly,
        bus_fee_yearly,
        yearly_discount_percent,
        tax_rate_percent,
        grace_period_days
      } = req.body;

      let settings = await BillingSetting.findOne();
      if (!settings) {
        settings = await BillingSetting.create({});
      }

      // Update fields
      if (base_fee_monthly !== undefined) settings.base_fee_monthly = base_fee_monthly;
      if (base_fee_yearly !== undefined) settings.base_fee_yearly = base_fee_yearly;
      if (student_fee_monthly !== undefined) settings.student_fee_monthly = student_fee_monthly;
      if (student_fee_yearly !== undefined) settings.student_fee_yearly = student_fee_yearly;
      if (bus_fee_monthly !== undefined) settings.bus_fee_monthly = bus_fee_monthly;
      if (bus_fee_yearly !== undefined) settings.bus_fee_yearly = bus_fee_yearly;
      if (yearly_discount_percent !== undefined) settings.yearly_discount_percent = yearly_discount_percent;
      if (tax_rate_percent !== undefined) settings.tax_rate_percent = tax_rate_percent;
      if (grace_period_days !== undefined) settings.grace_period_days = grace_period_days;

      await settings.save();

      return this.sendResponse(res, settings, 'Global billing settings updated successfully');
    } catch (error) {
      console.error('Error updating billing settings:', error);
      return this.sendError(res, 'Internal server error updating billing settings', 500);
    }
  }
}

module.exports = new BillingSettingController();
