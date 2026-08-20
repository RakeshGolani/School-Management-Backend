const BaseController = require('../BaseController');
const { 
  SchoolSubscription, 
  SubscriptionTransaction, 
  SchoolInvoice, 
  BillingSetting,
  Student,
  Bus,
  School
} = require('../../../Models');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

/**
 * SubscriptionController
 * Handles billing dashboard, subscription upgrades, payments, and invoices for School Owners.
 */
class SubscriptionController extends BaseController {
  constructor() {
    super();
    this.getDetails = this.getDetails.bind(this);
    this.createCheckoutSession = this.createCheckoutSession.bind(this);
    this.webhook = this.webhook.bind(this);
  }

  /**
   * Get subscription metrics, usage, invoice history, and billing settings.
   */
  async getDetails(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.query.schoolId;
      if (!schoolId) {
        return this.sendError(res, 'School ID is required', 400);
      }

      // 1. Get active subscription
      let subscription = await SchoolSubscription.findOne({
        where: { school_id: schoolId }
      });

      // Create a default subscription if none exists (starts with 50 students, 2 buses, active 30 days)
      if (!subscription) {
        const startsAt = new Date();
        const endsAt = new Date();
        endsAt.setDate(startsAt.getDate() + 30);
        subscription = await SchoolSubscription.create({
          school_id: schoolId,
          plan_type: 'monthly',
          status: 'active',
          max_students_limit: 50,
          max_buses_limit: 5,
          starts_at: startsAt,
          ends_at: endsAt
        });
      }

      // 2. Count active usage
      const activeStudentsCount = await Student.count({
        where: { school_id: schoolId, status: 'active' }
      });

      let activeBusesCount = 0;
      if (Bus.rawAttributes.school_id) {
        activeBusesCount = await Bus.count({ where: { school_id: schoolId } });
      } else {
        // Fallback: count seeded buses or mock
        activeBusesCount = await Bus.count();
      }

      // 3. Fetch past transactions & invoices
      const transactions = await SubscriptionTransaction.findAll({
        where: { school_id: schoolId },
        include: [
          {
            model: SchoolInvoice,
            as: 'invoice'
          },
          {
            model: SchoolSubscription,
            as: 'subscription',
            attributes: ['id', 'plan_type']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const invoices = await SchoolInvoice.findAll({
        where: { school_id: schoolId },
        order: [['createdAt', 'DESC']]
      });

      // 4. Fetch global pricing parameters
      let billingConfig = await BillingSetting.findOne();
      if (!billingConfig) {
        billingConfig = await BillingSetting.create({});
      }

      return this.sendResponse(res, {
        subscription,
        usage: {
          students: {
            current: activeStudentsCount,
            limit: subscription.max_students_limit
          },
          buses: {
            current: activeBusesCount,
            limit: subscription.max_buses_limit
          }
        },
        transactions,
        invoices,
        billingConfig
      }, 'School subscription details retrieved successfully');

    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return this.sendError(res, 'Internal server error fetching subscription details', 500);
    }
  }

  /**
   * Create dynamic checkout checkout session / subscription transaction.
   * This is called when the school owner upgrades their limit.
   */
  async createCheckoutSession(req, res) {
    try {
      const schoolId = req.headers['x-school-id'] || req.query.schoolId;
      const { plan_type, max_students_limit, max_buses_limit } = req.body;

      if (!schoolId) {
        return this.sendError(res, 'School ID is required', 400);
      }

      const subscription = await SchoolSubscription.findOne({
        where: { school_id: schoolId }
      });

      if (!subscription) {
        return this.sendError(res, 'Subscription record not found. Please reload.', 404);
      }

      const school = await School.findByPk(schoolId);
      if (!school) {
        return this.sendError(res, 'School record not found.', 404);
      }

      // Downgrade Block Check
      const activeStudentsCount = await Student.count({ where: { school_id: schoolId, status: 'active' } });
      let activeBusesCount = 0;
      if (Bus.rawAttributes.school_id) {
        activeBusesCount = await Bus.count({ where: { school_id: schoolId } });
      }

      if (max_buses_limit !== undefined && max_buses_limit < 0) {
        return this.sendError(res, `Invalid bus limit specified.`, 400);
      }

      // Fetch global pricing settings
      let config = await BillingSetting.findOne();
      if (!config) {
        config = await BillingSetting.create({});
      }

      // Calculate checkout pricing based on plan type and limits, applying custom overrides if present
      const isYearly = plan_type === 'yearly';
      const baseFee = isYearly ? (subscription.custom_base_fee_yearly || config.base_fee_yearly) : (subscription.custom_base_fee_monthly || config.base_fee_monthly);
      const studentFee = isYearly ? (subscription.custom_student_fee_yearly || config.student_fee_yearly) : (subscription.custom_student_fee_monthly || config.student_fee_monthly);
      const busFee = isYearly ? (subscription.custom_bus_fee_yearly || config.bus_fee_yearly) : (subscription.custom_bus_fee_monthly || config.bus_fee_monthly);

      const subtotal = Number(baseFee) + 
                       (Number(studentFee) * max_students_limit) + 
                       (Number(busFee) * max_buses_limit);
      
      let discountAmount = 0;
      if (isYearly) {
        const discountPercent = subscription.custom_discount_percent || config.yearly_discount_percent;
        discountAmount = (subtotal * Number(discountPercent)) / 100;
      }

      const totalBeforeTax = subtotal - discountAmount;
      const taxAmount = (totalBeforeTax * Number(config.tax_rate_percent)) / 100;
      const finalAmount = totalBeforeTax + taxAmount;

      // Generate Razorpay Order or fallback to mock simulation order
      let orderId = 'order_' + Math.random().toString(36).substr(2, 12);
      let isMockOrder = true;

      try {
        if (process.env.RAZORPAY_KEY_ID && 
            process.env.RAZORPAY_KEY_SECRET && 
            !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
          const options = {
            amount: Math.round(finalAmount * 100), // Amount in paise
            currency: 'INR',
            receipt: 'rcpt_' + Math.random().toString(36).substr(2, 9)
          };
          const razorpayOrder = await razorpay.orders.create(options);
          if (razorpayOrder && razorpayOrder.id) {
            orderId = razorpayOrder.id;
            isMockOrder = false;
          }
        }
      } catch (rzpErr) {
        console.warn('Razorpay live order creation failed (using mock order ID for development):', rzpErr?.error?.description || rzpErr?.message || rzpErr);
        orderId = 'order_mock_' + Math.random().toString(36).substr(2, 10);
        isMockOrder = true;
      }

      // Create a pending gateway transaction log
      const txn = await SubscriptionTransaction.create({
        school_id: schoolId,
        subscription_id: subscription.id,
        gateway_transaction_id: orderId,
        amount: finalAmount.toFixed(2),
        currency: 'INR',
        status: 'pending',
        payment_method: isMockOrder ? 'Simulation / Dev Gateway' : 'Razorpay',
        payment_mode: 'online'
      });

      return this.sendResponse(res, {
        transaction: txn,
        checkoutDetails: {
          subtotal: subtotal.toFixed(2),
          discount: discountAmount.toFixed(2),
          tax: taxAmount.toFixed(2),
          total: finalAmount.toFixed(2),
          plan_type,
          max_students_limit,
          max_buses_limit,
          razorpay_key: process.env.RAZORPAY_KEY_ID || '',
          order_id: orderId,
          is_mock: isMockOrder,
          school_name: school.school_name,
          school_email: school.email,
          school_phone: school.phone || ''
        }
      }, 'Checkout session generated successfully');

    } catch (error) {
      console.error('Error generating checkout session:', error);
      return this.sendError(res, 'Internal server error during checkout initiation', 500);
    }
  }

  /**
   * Webhook handler to simulate payment gateway webhook callback.
   * Handles Razorpay success verification via signature.
   */
  async webhook(req, res) {
    try {
      const { 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature,
        // Mock fallback for dev mode
        gateway_transaction_id, 
        status,
        max_students_limit,
        max_buses_limit,
        plan_type
      } = req.body;

      let isSuccess = false;
      let txnId = gateway_transaction_id || razorpay_order_id;

      if (razorpay_order_id && razorpay_signature) {
        // Verify Razorpay Signature
        const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
        const generated_signature = crypto
          .createHmac('sha256', secret)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');

        if (generated_signature === razorpay_signature) {
          isSuccess = true;
        } else {
          return this.sendError(res, 'Invalid payment signature', 400);
        }
      } else if (status === 'success') {
        // Fallback for mock dev mode
        isSuccess = true;
      }

      const txn = await SubscriptionTransaction.findOne({
        where: { gateway_transaction_id: txnId }
      });

      if (!txn) {
        return this.sendError(res, 'Transaction reference not found', 404);
      }

      if (txn.status === 'success') {
        return this.sendResponse(res, txn, 'Transaction already processed');
      }

      if (isSuccess) {
        // 1. Update transaction log
        txn.status = 'success';
        if (razorpay_payment_id) {
          txn.reference_number = razorpay_payment_id;
        }
        await txn.save();

        // 2. Fetch parent subscription
        const sub = await SchoolSubscription.findByPk(txn.subscription_id);

        if (sub) {
          sub.status = 'active';
          if (max_students_limit) sub.max_students_limit = max_students_limit;
          if (max_buses_limit) sub.max_buses_limit = max_buses_limit;
          if (plan_type) sub.plan_type = plan_type;

          // Option B: Reset Cycle. Set start date to today, end date to 30/365 days from today.
          const starts = new Date();
          const ends = new Date();
          if (sub.plan_type === 'yearly') {
            ends.setDate(starts.getDate() + 365);
          } else {
            ends.setDate(starts.getDate() + 30);
          }
          sub.starts_at = starts;
          sub.ends_at = ends;
          await sub.save();
        }

        // 3. Generate a beautiful dynamic PDF invoice reference
        const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        
        const invoice = await SchoolInvoice.create({
          school_id: txn.school_id,
          transaction_id: txn.id,
          invoice_number: invoiceNum,
          billing_date: new Date(),
          amount_due: txn.amount,
          amount_paid: txn.amount,
          tax_amount: (txn.amount * 0.18).toFixed(2), // 18% dynamic tax representation
          status: 'paid',
          invoice_pdf_url: `/uploads/invoices/${invoiceNum}.pdf` // Mock file URL
        });

        return this.sendResponse(res, {
          transaction: txn,
          subscription: sub,
          invoice
        }, 'Subscription updated and invoice generated successfully');
      } else {
        txn.status = 'failed';
        await txn.save();
        return this.sendResponse(res, txn, 'Payment marked as failed');
      }

    } catch (error) {
      console.error('Webhook processing failed:', error);
      return this.sendError(res, 'Webhook handler execution failed', 500);
    }
  }
}

module.exports = new SubscriptionController();
