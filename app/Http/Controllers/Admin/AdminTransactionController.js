const { SubscriptionTransaction, School, SchoolSubscription, SchoolInvoice } = require('../../../Models');
const { Op } = require('sequelize');

class AdminTransactionController {
  // Get list of subscription transactions
  async index(req, res) {
    try {
      const { search, status, page = 1, limit = 10, startDate, endDate } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {};

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const schoolWhere = {};
      if (search) {
        schoolWhere[Op.or] = [
          { school_name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
        if (search.startsWith('TXN-') || search.startsWith('pay_')) {
          whereClause[Op.or] = [
            { gateway_transaction_id: { [Op.like]: `%${search}%` } }
          ];
        }
      }

      const { count, rows: transactions } = await SubscriptionTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'code', 'school_name', 'email', 'phone', 'address'],
            where: Object.keys(schoolWhere).length > 0 ? schoolWhere : undefined
          },
          {
            model: SchoolSubscription,
            as: 'subscription',
            attributes: ['id', 'plan_type', 'status', 'max_students_limit', 'max_buses_limit']
          },
          {
            model: SchoolInvoice,
            as: 'invoice'
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Overall Summary Statistics
      const totalRevenue = await SubscriptionTransaction.sum('amount', { where: { status: 'success' } }) || 0;
      const totalSuccess = await SubscriptionTransaction.count({ where: { status: 'success' } });
      const totalPending = await SubscriptionTransaction.count({ where: { status: 'pending' } });
      const totalFailed = await SubscriptionTransaction.count({ where: { status: 'failed' } });

      return res.status(200).json({
        success: true,
        data: transactions,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        },
        stats: {
          totalRevenue: parseFloat(totalRevenue).toFixed(2),
          totalSuccess,
          totalPending,
          totalFailed
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  }

  // Get transaction single details
  async show(req, res) {
    try {
      const { id } = req.params;

      const transaction = await SubscriptionTransaction.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school'
          },
          {
            model: SchoolSubscription,
            as: 'subscription'
          },
          {
            model: SchoolInvoice,
            as: 'invoice'
          }
        ]
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction record not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction detail',
        error: error.message
      });
    }
  }

  // Record an offline manual payment
  async recordOfflinePayment(req, res) {
    try {
      const { school_id, amount, payment_method, reference_number, max_students_limit, max_buses_limit, plan_type } = req.body;

      if (!school_id || !amount || !payment_method) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      let subscription = await SchoolSubscription.findOne({ where: { school_id } });

      const starts = new Date();
      const ends = new Date();
      const selectedPlan = plan_type || 'monthly';
      if (selectedPlan === 'yearly') {
        ends.setDate(starts.getDate() + 365);
      } else {
        ends.setDate(starts.getDate() + 30);
      }

      if (!subscription) {
        subscription = await SchoolSubscription.create({
          school_id,
          plan_type: selectedPlan,
          status: 'active',
          max_students_limit: parseInt(max_students_limit) || 50,
          max_buses_limit: parseInt(max_buses_limit) || 5,
          starts_at: starts,
          ends_at: ends
        });
      } else {
        subscription.status = 'active';
        if (max_students_limit) subscription.max_students_limit = parseInt(max_students_limit);
        if (max_buses_limit) subscription.max_buses_limit = parseInt(max_buses_limit);
        if (plan_type) subscription.plan_type = plan_type;
        subscription.starts_at = starts;
        subscription.ends_at = ends;
        await subscription.save();
      }

      // Create transaction record
      const mockGatewayTxId = 'OFF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const txn = await SubscriptionTransaction.create({
        school_id,
        subscription_id: subscription.id,
        gateway_transaction_id: mockGatewayTxId,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'success',
        payment_method,
        payment_mode: 'offline',
        reference_number: reference_number || null
      });

      // Create Invoice
      const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const invoice = await SchoolInvoice.create({
        school_id,
        transaction_id: txn.id,
        invoice_number: invoiceNum,
        billing_date: new Date(),
        amount_due: amount,
        amount_paid: amount,
        tax_amount: (amount * 0.18).toFixed(2),
        status: 'paid',
        invoice_pdf_url: `/uploads/invoices/${invoiceNum}.pdf`
      });

      return res.status(200).json({
        success: true,
        message: 'Offline payment recorded successfully',
        data: { transaction: txn, invoice }
      });
    } catch (error) {
      console.error('Error recording offline payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to record offline payment',
        error: error.message
      });
    }
  }
}

module.exports = new AdminTransactionController();
