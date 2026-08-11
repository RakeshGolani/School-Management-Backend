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
}

module.exports = new AdminTransactionController();
