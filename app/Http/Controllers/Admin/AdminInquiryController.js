const { Inquiry } = require('../../../Models');
const BaseController = require('../BaseController');
const { Op } = require('sequelize');

class AdminInquiryController extends BaseController {
  // GET /api/admin/inquiries
  static async index(req, res) {
    try {
      const { 
        search = '', 
        status = 'ALL', 
        page = 1, 
        limit = 10 
      } = req.query;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const where = {};

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (search && search.trim()) {
        const query = `%${search.trim()}%`;
        where[Op.or] = [
          { representative_name: { [Op.like]: query } },
          { email: { [Op.like]: query } },
          { school_name: { [Op.like]: query } },
          { phone: { [Op.like]: query } },
          { notes: { [Op.like]: query } }
        ];
      }

      const { count, rows: inquiries } = await Inquiry.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset
      });

      // Calculate real-time KPI metrics
      const allInquiries = await Inquiry.findAll({ attributes: ['status'] });
      const metrics = {
        total: allInquiries.length,
        pending: allInquiries.filter(i => i.status === 'PENDING').length,
        contacted: allInquiries.filter(i => i.status === 'CONTACTED').length,
        scheduled: allInquiries.filter(i => i.status === 'SCHEDULED').length,
        resolved: allInquiries.filter(i => i.status === 'RESOLVED').length,
        closed: allInquiries.filter(i => i.status === 'CLOSED').length
      };

      return res.json({
        success: true,
        data: inquiries,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        },
        metrics
      });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch demonstration inquiries' });
    }
  }

  // GET /api/admin/inquiries/:id
  static async show(req, res) {
    try {
      const { id } = req.params;
      const inquiry = await AdminInquiryController.findByUuidOrPk(Inquiry, id);

      if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Inquiry not found' });
      }

      return res.json({
        success: true,
        data: inquiry
      });
    } catch (error) {
      console.error('Error fetching inquiry details:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch inquiry details' });
    }
  }

  // PUT /api/admin/inquiries/:id/status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'CONTACTED', 'SCHEDULED', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const inquiry = await AdminInquiryController.findByUuidOrPk(Inquiry, id);
      if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Inquiry not found' });
      }

      inquiry.status = status;
      await inquiry.save();

      return res.json({
        success: true,
        message: `Inquiry status updated to ${status}`,
        data: inquiry
      });
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      return res.status(500).json({ success: false, message: 'Failed to update status' });
    }
  }

  // PUT /api/admin/inquiries/:id/notes
  static async updateNotes(req, res) {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;

      const inquiry = await AdminInquiryController.findByUuidOrPk(Inquiry, id);
      if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Inquiry not found' });
      }

      inquiry.admin_notes = admin_notes;
      await inquiry.save();

      return res.json({
        success: true,
        message: 'Admin notes updated successfully',
        data: inquiry
      });
    } catch (error) {
      console.error('Error updating inquiry notes:', error);
      return res.status(500).json({ success: false, message: 'Failed to update notes' });
    }
  }

  // DELETE /api/admin/inquiries/:id
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const inquiry = await AdminInquiryController.findByUuidOrPk(Inquiry, id);

      if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Inquiry not found' });
      }

      await inquiry.destroy();

      return res.json({
        success: true,
        message: 'Inquiry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
    }
  }
}

module.exports = AdminInquiryController;
