const BaseController = require('../BaseController');
const { 
  SchoolSubscription, 
  SubscriptionTransaction, 
  SchoolInvoice, 
  BillingSetting,
  SystemSetting,
  Student,
  Bus,
  School,
  Package,
  PlanFeature
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
    this.resolveSchool = this.resolveSchool.bind(this);
  }

  /**
   * Helper to resolve School model from UUID or primary key integer
   */
  async resolveSchool(identifier) {
    if (!identifier) return null;
    const isUuid = typeof identifier === 'string' && identifier.includes('-');
    if (isUuid) {
      return await School.findOne({ where: { uuid: identifier } });
    }
    const parsedId = parseInt(identifier, 10);
    if (!isNaN(parsedId)) {
      const school = await School.findByPk(parsedId);
      if (school) return school;
    }
    return await School.findOne({ where: { uuid: identifier } });
  }

  /**
   * Get subscription metrics, usage, invoice history, and billing settings.
   */
  async getDetails(req, res) {
    try {
      const rawSchoolId = req.headers['x-school-id'] || req.query.schoolId;
      if (!rawSchoolId) {
        return this.sendError(res, 'School ID is required', 400);
      }

      const school = await this.resolveSchool(rawSchoolId);
      if (!school) {
        return this.sendError(res, 'School record not found', 404);
      }
      const schoolId = school.id;

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

      // 2. Fetch School's assigned Package & features
      const schoolRecord = await School.findByPk(schoolId, {
        include: [
          {
            model: Package,
            as: 'package',
            include: [
              {
                model: PlanFeature,
                as: 'features',
                where: { is_active: true },
                required: false,
                attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
              }
            ]
          }
        ]
      });

      let currentPackage = schoolRecord?.package || null;
      if (!currentPackage) {
        // Fallback to first active package (e.g. FULL_SUITE)
        currentPackage = await Package.findOne({
          where: { is_active: true },
          order: [['sort_order', 'ASC']],
          include: [
            {
              model: PlanFeature,
              as: 'features',
              where: { is_active: true },
              required: false,
              attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
            }
          ]
        });
      }

      if (currentPackage) {
        const plainPkg = currentPackage.toJSON ? currentPackage.toJSON() : currentPackage;
        if (Array.isArray(plainPkg.features)) {
          plainPkg.features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        currentPackage = plainPkg;
      }

      // 3. Fetch all active packages for reference / upgrade options
      const allPackagesRaw = await Package.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC']],
        include: [
          {
            model: PlanFeature,
            as: 'features',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
          }
        ]
      });

      const allPackages = allPackagesRaw.map(p => {
        const plain = p.toJSON();
        if (Array.isArray(plain.features)) {
          plain.features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        return plain;
      });

      // 4. Count active usage
      const activeStudentsCount = await Student.count({
        where: { school_id: schoolId, status: 'active' }
      });

      let activeBusesCount = 0;
      if (Bus.rawAttributes.school_id) {
        activeBusesCount = await Bus.count({ where: { school_id: schoolId } });
      } else {
        activeBusesCount = await Bus.count();
      }

      // 5. Fetch past transactions & invoices
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

      // 6. Fetch global pricing parameters
      let billingConfig = await BillingSetting.findOne();
      if (!billingConfig) {
        billingConfig = await BillingSetting.create({});
      }

      // 7. Fetch system settings
      let systemSettings = await SystemSetting.findOne();
      if (!systemSettings) {
        systemSettings = await SystemSetting.create({});
      }

      return this.sendResponse(res, {
        subscription,
        currentPackage,
        allPackages,
        schoolInfo: {
          id: school.id,
          uuid: school.uuid,
          school_name: school.school_name,
          code: school.code,
          email: school.email,
          phone: school.phone
        },
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
        billingConfig,
        systemSettings
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
  /**
   * Create dynamic checkout session / subscription transaction.
   * This is called when the school owner upgrades their limit or changes package.
   */
  async createCheckoutSession(req, res) {
    try {
      const rawSchoolId = req.headers['x-school-id'] || req.query.schoolId;
      const { plan_type, max_students_limit, max_buses_limit, package_code } = req.body;

      if (!rawSchoolId) {
        return this.sendError(res, 'School ID is required', 400);
      }

      const school = await this.resolveSchool(rawSchoolId);
      if (!school) {
        return this.sendError(res, 'School record not found.', 404);
      }
      const schoolId = school.id;

      const subscription = await SchoolSubscription.findOne({
        where: { school_id: schoolId }
      });

      if (!subscription) {
        return this.sendError(res, 'Subscription record not found. Please reload.', 404);
      }

      // Downgrade Block Check
      const activeStudentsCount = await Student.count({ where: { school_id: schoolId, status: 'active' } });
      if (max_students_limit !== undefined && max_students_limit < activeStudentsCount) {
        return this.sendError(res, `Cannot reduce student limit below currently active enrolled students (${activeStudentsCount}).`, 400);
      }

      if (max_buses_limit !== undefined && max_buses_limit < 0) {
        return this.sendError(res, `Invalid bus limit specified.`, 400);
      }

      // Fetch target package if selected or current school package
      let targetPackage = null;
      if (package_code) {
        targetPackage = await Package.findOne({ where: { code: package_code } });
      } else if (school.package_id) {
        targetPackage = await Package.findByPk(school.package_id);
      }

      // Fetch global pricing settings
      let config = await BillingSetting.findOne();
      if (!config) {
        config = await BillingSetting.create({});
      }

      // Calculate checkout pricing based on plan type and limits, applying custom overrides if present
      const isYearly = plan_type === 'yearly';
      let baseFee = 0;
      if (targetPackage) {
        if (isYearly) {
          const annualRate = Number(targetPackage.annual_price || 0);
          baseFee = (annualRate > 0 && annualRate < 15000) ? (annualRate * 12) : (annualRate || (Number(config.base_fee_yearly || 7999) * 12));
        } else {
          baseFee = Number(targetPackage.monthly_price || config.base_fee_monthly || 0);
        }
      } else {
        baseFee = isYearly ? (subscription.custom_base_fee_yearly || config.base_fee_yearly) : (subscription.custom_base_fee_monthly || config.base_fee_monthly);
      }

      const monthlyStudentFee = Number(subscription.custom_student_fee_monthly || config.student_fee_monthly || 10);
      const monthlyBusFee = Number(subscription.custom_bus_fee_monthly || config.bus_fee_monthly || 100);

      const studentFee = isYearly 
        ? Number(subscription.custom_student_fee_yearly || config.student_fee_yearly || (monthlyStudentFee * 12)) 
        : monthlyStudentFee;

      const busFee = isYearly 
        ? Number(subscription.custom_bus_fee_yearly || config.bus_fee_yearly || (monthlyBusFee * 12)) 
        : monthlyBusFee;

      const studentsCount = Number(max_students_limit || subscription.max_students_limit || 50);
      const busesCount = Number(max_buses_limit !== undefined ? max_buses_limit : (subscription.max_buses_limit || 5));

      // Dynamic Extra quota cost (above plan's base students / buses limit)
      const baseStudents = targetPackage?.base_students_limit || 50;
      const baseBuses = targetPackage?.base_buses_limit !== undefined ? targetPackage.base_buses_limit : 5;

      const extraStudents = Math.max(0, studentsCount - baseStudents);
      const extraBuses = Math.max(0, busesCount - baseBuses);

      const subtotal = Number(baseFee) + 
                       (Number(studentFee) * extraStudents) + 
                       (Number(busFee) * extraBuses);
      
      let discountAmount = 0;
      if (isYearly && !targetPackage) {
        const discountPercent = subscription.custom_discount_percent || config.yearly_discount_percent;
        discountAmount = (subtotal * Number(discountPercent)) / 100;
      }

      const totalBeforeTax = Math.max(0, subtotal - discountAmount);
      const taxAmount = (totalBeforeTax * Number(config.tax_rate_percent || 18)) / 100;
      const roundedTotal = Math.round(totalBeforeTax + taxAmount);

      // Generate Razorpay Order or fallback to mock simulation order
      let orderId = 'order_' + Math.random().toString(36).substr(2, 12);
      let isMockOrder = true;

      try {
        if (process.env.RAZORPAY_KEY_ID && 
            process.env.RAZORPAY_KEY_SECRET && 
            !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
          const options = {
            amount: roundedTotal * 100, // Exact rounded amount in paise (e.g. 1179900 = ₹11,799.00)
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

      let systemSettings = await SystemSetting.findOne();
      if (!systemSettings) {
        systemSettings = await SystemSetting.create({});
      }

      return this.sendResponse(res, {
        checkoutDetails: {
          subtotal: Math.round(totalBeforeTax).toFixed(2),
          discount: Math.round(discountAmount).toFixed(2),
          tax: (roundedTotal - Math.round(totalBeforeTax)).toFixed(2),
          total: roundedTotal.toFixed(2),
          plan_type,
          package_code: targetPackage?.code || null,
          max_students_limit: studentsCount,
          max_buses_limit: busesCount,
          razorpay_key: process.env.RAZORPAY_KEY_ID || '',
          order_id: orderId,
          is_mock: isMockOrder,
          // Super Admin Site Settings (Dynamic from system_settings)
          merchant_name: systemSettings.company_name || 'Vidyadmin',
          merchant_logo: systemSettings.logo_url || '',
          // School Customer Details (Payer)
          school_name: school.school_name,
          school_email: school.email,
          school_phone: school.phone || '',
          school_logo: school.logo_url || school.logo || '',
          primary_color: school.primary_color || ''
        }
      }, 'Checkout session generated successfully');

    } catch (error) {
      console.error('Error generating checkout session:', error);
      return this.sendError(res, 'Internal server error during checkout initiation', 500);
    }
  }

  /**
   * Webhook handler to simulate payment gateway webhook callback.
   * Handles Razorpay success and failure verification after Razorpay returns response.
   */
  async webhook(req, res) {
    try {
      const rawSchoolId = req.headers['x-school-id'] || req.query.schoolId;
      const { 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature,
        gateway_transaction_id, 
        status,
        amount,
        error_code,
        error_description,
        max_students_limit,
        max_buses_limit,
        plan_type,
        package_code
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
        // Dev / Simulation success mode
        isSuccess = true;
      }

      // Resolve school and subscription
      let school = null;
      if (rawSchoolId) {
        school = await this.resolveSchool(rawSchoolId);
      }

      let sub = null;
      if (school) {
        sub = await SchoolSubscription.findOne({ where: { school_id: school.id } });
      }
      if (!sub) {
        sub = await SchoolSubscription.findOne({ order: [['id', 'ASC']] });
        if (sub && !school) {
          school = await School.findByPk(sub.school_id);
        }
      }

      // Handle Failed Payment Response from Razorpay
      if (status === 'failed' || !isSuccess) {
        if (school && sub && txnId) {
          await SubscriptionTransaction.findOrCreate({
            where: { gateway_transaction_id: txnId },
            defaults: {
              school_id: school.id,
              subscription_id: sub.id,
              gateway_transaction_id: txnId,
              amount: Number(amount || 0),
              currency: 'INR',
              status: 'failed',
              payment_method: error_code ? `Razorpay (${error_code})` : 'Razorpay Failed',
              payment_mode: 'online',
              reference_number: error_description || 'Payment Declined / Cancelled'
            }
          });
        }
        return this.sendResponse(res, { status: 'failed' }, 'Payment failure recorded');
      }

      // Handle Successful Payment
      if (isSuccess && txnId) {

        let finalPaidAmount = Number(amount || 0);
        if (finalPaidAmount <= 0) {
          const config = await BillingSetting.findOne() || {};
          const isYearly = plan_type === 'yearly';
          const targetPkg = package_code ? await Package.findOne({ where: { code: package_code } }) : (school?.package_id ? await Package.findByPk(school.package_id) : null);
          const rawAnnual = Number(targetPkg?.annual_price || config.base_fee_yearly || 7999);
          const rawBaseFee = targetPkg 
            ? (isYearly ? (rawAnnual < 15000 ? rawAnnual * 12 : rawAnnual) : Number(targetPkg.monthly_price || 9999))
            : (isYearly ? (Number(config.base_fee_yearly || 7999) * 12) : Number(config.base_fee_monthly || 9999));
          const extraS = Math.max(0, Number(max_students_limit || 50) - (targetPkg?.base_students_limit || 50));
          const sRate = isYearly ? Number(config.student_fee_yearly || 120) : Number(config.student_fee_monthly || 10);
          const subT = rawBaseFee + (extraS * sRate);
          const taxAmt = (subT * 0.18);
          finalPaidAmount = Math.round(subT + taxAmt);
        }

        const paymentRef = razorpay_payment_id || txnId;

        // Create or update transaction record on successful response with actual Payment ID
        let [txn, created] = await SubscriptionTransaction.findOrCreate({
          where: { gateway_transaction_id: paymentRef },
          defaults: {
            school_id: school ? school.id : 1,
            subscription_id: sub ? sub.id : 1,
            gateway_transaction_id: paymentRef,
            amount: finalPaidAmount,
            currency: 'INR',
            status: 'success',
            payment_method: 'Razorpay',
            payment_mode: 'online',
            reference_number: paymentRef
          }
        });

        if (!created && txn) {
          txn.status = 'success';
          txn.gateway_transaction_id = paymentRef;
          txn.reference_number = paymentRef;
          txn.amount = finalPaidAmount;
          await txn.save();
        }

        if (sub) {
          sub.status = 'active';
          if (max_students_limit) sub.max_students_limit = max_students_limit;
          if (max_buses_limit) sub.max_buses_limit = max_buses_limit;
          if (plan_type) sub.plan_type = plan_type;

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

        // 3. Update School Package if upgraded
        if (package_code) {
          const targetPkg = await Package.findOne({ where: { code: package_code } });
          if (targetPkg) {
            const sch = await School.findByPk(txn.school_id);
            if (sch) {
              sch.package_id = targetPkg.id;
              await sch.save();
            }
          }
        }

        // 3. Generate a beautiful dynamic PDF invoice reference
        const invoiceNum = 'IW-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        
        const invoice = await SchoolInvoice.create({
          school_id: txn.school_id,
          transaction_id: txn.id,
          invoice_number: invoiceNum,
          billing_date: new Date(),
          amount_due: finalPaidAmount,
          amount_paid: finalPaidAmount,
          tax_amount: (finalPaidAmount * 0.18 / 1.18).toFixed(2), // GST tax portion
          status: 'paid',
          invoice_pdf_url: `/uploads/invoices/${invoiceNum}.pdf`
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
