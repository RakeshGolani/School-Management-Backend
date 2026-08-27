const BaseController = require('../BaseController');
const { 
  FeeCategory, 
  StudentFee, 
  FeePayment, 
  Student, 
  SchoolClass, 
  AcademicYear,
  sequelize 
} = require('../../../Models');
const NotificationService = require('../../../Services/NotificationService');
const { Op } = require('sequelize');

class FeeController extends BaseController {
  /**
   * Get all fee categories for the school
   */
  async getCategories(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { academic_year_id } = req.query;

      const whereClause = { school_id };
      if (academic_year_id) {
        whereClause.academic_year_id = academic_year_id;
      }

      const categories = await FeeCategory.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      return this.sendResponse(res, categories, 'Fee categories retrieved successfully');
    } catch (error) {
      console.error('Error fetching fee categories:', error);
      return this.sendError(res, 'Failed to fetch fee categories', error.message, 500);
    }
  }

  /**
   * Create a new fee category
   */
  async createCategory(req, res) {
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { name, amount, due_date, description, academic_year_id } = req.body;

      if (!name || amount === undefined) {
        return this.sendValidationError(res, [], 'name and amount are required');
      }

      // Get active academic year if not provided
      let finalAcademicYearId = academic_year_id;
      if (!finalAcademicYearId) {
        const activeYear = await AcademicYear.findOne({
          where: { school_id, is_active: true }
        });
        finalAcademicYearId = activeYear?.id || null;
      }

      const category = await FeeCategory.create({
        school_id,
        academic_year_id: finalAcademicYearId,
        name,
        amount: parseFloat(amount),
        due_date: due_date || null,
        description
      });

      return this.sendResponse(res, category, 'Fee category created successfully', 201);
    } catch (error) {
      console.error('Error creating fee category:', error);
      return this.sendError(res, 'Failed to create fee category', error.message, 500);
    }
  }

  /**
   * Update a fee category
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, amount, due_date, description, academic_year_id } = req.body;

      const category = await this.findByUuidOrPk(FeeCategory, id);
      if (!category) {
        return this.sendError(res, 'Fee category not found', null, 404);
      }

      await category.update({
        name: name || category.name,
        amount: amount !== undefined ? parseFloat(amount) : category.amount,
        due_date: due_date !== undefined ? due_date : category.due_date,
        description: description !== undefined ? description : category.description,
        academic_year_id: academic_year_id || category.academic_year_id
      });

      return this.sendResponse(res, category, 'Fee category updated successfully');
    } catch (error) {
      console.error('Error updating fee category:', error);
      return this.sendError(res, 'Failed to update fee category', error.message, 500);
    }
  }

  /**
   * Delete a fee category
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await this.findByUuidOrPk(FeeCategory, id);
      if (!category) {
        return this.sendError(res, 'Fee category not found', null, 404);
      }

      // Check if it's already allocated to students
      const allocationsCount = await StudentFee.count({
        where: { fee_category_id: id }
      });

      if (allocationsCount > 0) {
        return this.sendError(res, 'Cannot delete fee category as it is already allocated to students. Void allocations first.', null, 400);
      }

      await category.destroy();
      return this.sendResponse(res, null, 'Fee category deleted successfully');
    } catch (error) {
      console.error('Error deleting fee category:', error);
      return this.sendError(res, 'Failed to delete fee category', error.message, 500);
    }
  }

  /**
   * Fetch allocated student fees with pagination and filters
   */
  async getAllocations(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { class_id, status, search, page = 1, limit = 10, academic_year_id } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { school_id };

      if (academic_year_id) {
        whereClause.academic_year_id = academic_year_id;
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      // Build student search where clause
      const studentWhere = {};
      if (search && search.trim() !== '') {
        studentWhere[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { admission_number: { [Op.like]: `%${search}%` } }
        ];
      }

      if (class_id && class_id !== 'all') {
        studentWhere.class_id = class_id;
      }

      const { count, rows } = await StudentFee.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Student,
            as: 'student',
            where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
            required: true, // Only fetch allocations that have a matching student
            include: [
              {
                model: SchoolClass,
                as: 'schoolClass',
                attributes: ['id', 'class_name', 'section']
              }
            ],
            attributes: ['id', 'first_name', 'last_name', 'admission_number', 'photo', 'gender']
          },
          {
            model: FeeCategory,
            as: 'feeCategory',
            attributes: ['id', 'name', 'amount', 'due_date']
          }
        ]
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return this.sendResponse(res, {
        data: rows,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }, 'Student fee allocations retrieved successfully');
    } catch (error) {
      console.error('Error fetching fee allocations:', error);
      return this.sendError(res, 'Failed to fetch fee allocations', error.message, 500);
    }
  }

  /**
   * Allocate a fee category to an entire class or specific students
   */
  async allocateFee(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { fee_category_id, class_id, student_ids, amount, due_date } = req.body;

      if (!fee_category_id) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'fee_category_id is required');
      }

      const category = await FeeCategory.findByPk(fee_category_id, { transaction });
      if (!category) {
        await transaction.rollback();
        return this.sendError(res, 'Fee category not found', null, 404);
      }

      const finalAmount = amount !== undefined ? parseFloat(amount) : category.amount;
      const finalDueDate = due_date || category.due_date;
      const academic_year_id = category.academic_year_id;

      // Find target students
      let targetStudentIds = [];
      if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
        targetStudentIds = student_ids;
      } else if (class_id && class_id !== 'all') {
        const students = await Student.findAll({
          where: { school_id, class_id, status: 'active' },
          attributes: ['id'],
          transaction
        });
        targetStudentIds = students.map(s => s.id);
      } else {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'Please provide either class_id or student_ids to allocate fees');
      }

      if (targetStudentIds.length === 0) {
        await transaction.rollback();
        return this.sendError(res, 'No active students found matching the assignment target.', null, 400);
      }

      // Check if they are already allocated to prevent duplicates
      const existingAllocations = await StudentFee.findAll({
        where: {
          school_id,
          fee_category_id,
          student_id: { [Op.in]: targetStudentIds }
        },
        attributes: ['student_id'],
        transaction
      });
      const existingStudentIds = existingAllocations.map(ea => ea.student_id);

      // Filter out students who already have this allocation
      const studentsToAllocate = targetStudentIds.filter(sid => !existingStudentIds.includes(sid));

      if (studentsToAllocate.length === 0) {
        await transaction.rollback();
        return this.sendResponse(res, null, 'Selected fee category is already allocated to all target students.');
      }

      const allocationRecords = studentsToAllocate.map(sid => ({
        school_id,
        academic_year_id,
        student_id: sid,
        fee_category_id,
        amount: finalAmount,
        paid_amount: 0.00,
        discount_amount: 0.00,
        status: 'unpaid',
        due_date: finalDueDate
      }));

      await StudentFee.bulkCreate(allocationRecords, { transaction });
      await transaction.commit();

      // Dispatch fee due alerts to parents
      for (const sid of studentsToAllocate) {
        NotificationService.notifyFeeDue({
          school_id,
          student_id: sid,
          fee_title: category.name || 'School Fee',
          amount: finalAmount,
          due_date: finalDueDate
        }).catch(err => console.error('Error dispatching fee due notification:', err));
      }

      return this.sendResponse(
        res, 
        { allocatedCount: studentsToAllocate.length }, 
        `Successfully allocated fee structure to ${studentsToAllocate.length} students!`
      );
    } catch (error) {
      await transaction.rollback();
      console.error('Error allocating fees:', error);
      return this.sendError(res, 'Failed to allocate fees', error.message, 500);
    }
  }

  /**
   * Delete / void a student fee allocation
   */
  async deleteAllocation(req, res) {
    try {
      const { id } = req.params;

      const studentFee = await this.findByUuidOrPk(StudentFee, id);
      if (!studentFee) {
        return this.sendError(res, 'Fee allocation not found', null, 404);
      }

      // Prevent deletion if payment has been made
      if (parseFloat(studentFee.paid_amount) > 0) {
        return this.sendError(res, 'Cannot void fee allocation because payments have already been recorded.', null, 400);
      }

      await studentFee.destroy();
      return this.sendResponse(res, null, 'Fee allocation voided successfully');
    } catch (error) {
      console.error('Error deleting fee allocation:', error);
      return this.sendError(res, 'Failed to void fee allocation', error.message, 500);
    }
  }

  /**
   * Record payment towards a student fee allocation
   */
  async recordPayment(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { student_fee_id, amount_paid, payment_date, payment_mode, reference_number, remarks } = req.body;

      if (!student_fee_id || amount_paid === undefined) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'student_fee_id and amount_paid are required');
      }

      const pAmount = parseFloat(amount_paid);
      if (pAmount <= 0) {
        await transaction.rollback();
        return this.sendValidationError(res, [], 'Payment amount must be greater than zero');
      }

      const studentFee = await StudentFee.findByPk(student_fee_id, {
        transaction,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: FeeCategory,
            as: 'feeCategory',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!studentFee) {
        await transaction.rollback();
        return this.sendError(res, 'Fee allocation record not found', null, 404);
      }

      const balance = parseFloat(studentFee.amount) - parseFloat(studentFee.paid_amount) - parseFloat(studentFee.discount_amount);
      if (pAmount > balance) {
        await transaction.rollback();
        return this.sendValidationError(
          res, 
          [], 
          `Payment amount (₹${pAmount}) exceeds the remaining balance (₹${balance})`
        );
      }

      // Calculate new total paid
      const newPaidTotal = parseFloat(studentFee.paid_amount) + pAmount;
      const finalPaidAmount = parseFloat(newPaidTotal.toFixed(2));

      // Calculate status
      let newStatus = 'unpaid';
      const totalCovered = finalPaidAmount + parseFloat(studentFee.discount_amount);
      if (totalCovered >= parseFloat(studentFee.amount)) {
        newStatus = 'paid';
      } else if (finalPaidAmount > 0) {
        newStatus = 'partially_paid';
      }

      // Update allocation record
      await studentFee.update({
        paid_amount: finalPaidAmount,
        status: newStatus
      }, { transaction });

      // Generate unique receipt number
      // We search payment counts to increment order
      const paymentCount = await FeePayment.count({
        where: { school_id },
        transaction
      });
      const currentYear = new Date().getFullYear();
      const receipt_number = `REC-${currentYear}-${String(paymentCount + 1).padStart(4, '0')}`;

      // Create transaction record
      const payment = await FeePayment.create({
        school_id,
        student_fee_id,
        amount_paid: pAmount,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        payment_mode: payment_mode || 'cash',
        reference_number,
        remarks,
        receipt_number
      }, { transaction });

      await transaction.commit();

      // Dispatch fee payment notification to Parent & Student
      NotificationService.notifyFeePayment({
        school_id,
        student_id: studentFee.student_id,
        fee_title: studentFee.feeCategory?.name || 'School Fee',
        amount: pAmount,
        receipt_no: receipt_number
      }).catch(err => console.error('Error dispatching fee payment notification:', err));

      return this.sendResponse(
        res, 
        { payment, remainingBalance: balance - pAmount, status: newStatus }, 
        `Payment of ₹${pAmount} recorded successfully! Receipt: ${receipt_number}`, 
        201
      );
    } catch (error) {
      await transaction.rollback();
      console.error('Error recording payment:', error);
      return this.sendError(res, 'Failed to record payment', error.message, 500);
    }
  }

  /**
   * Fetch payment ledger/history with filters
   */
  async getPayments(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { payment_mode, search, page = 1, limit = 10, academic_year_id } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { school_id };

      if (payment_mode && payment_mode !== 'all') {
        whereClause.payment_mode = payment_mode;
      }

      const studentWhere = {};
      if (search && search.trim() !== '') {
        studentWhere[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { admission_number: { [Op.like]: `%${search}%` } }
        ];
      }

      const studentFeeWhere = {};
      if (academic_year_id) {
        studentFeeWhere.academic_year_id = academic_year_id;
      }

      const { count, rows } = await FeePayment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: StudentFee,
            as: 'studentFee',
            required: true,
            where: Object.keys(studentFeeWhere).length > 0 ? studentFeeWhere : undefined,
            include: [
              {
                model: Student,
                as: 'student',
                where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
                required: true,
                attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                include: [
                  {
                    model: SchoolClass,
                    as: 'schoolClass',
                    attributes: ['class_name', 'section']
                  }
                ]
              },
              {
                model: FeeCategory,
                as: 'feeCategory',
                attributes: ['name']
              }
            ]
          }
        ]
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return this.sendResponse(res, {
        data: rows,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }, 'Fee payments ledger retrieved successfully');
    } catch (error) {
      console.error('Error fetching payments ledger:', error);
      return this.sendError(res, 'Failed to fetch payments ledger', error.message, 500);
    }
  }

  /**
   * Fetch statistical aggregates of fees
   */
  async getStats(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;
      const { academic_year_id } = req.query;

      const whereClause = { school_id };
      if (academic_year_id) {
        whereClause.academic_year_id = academic_year_id;
      }

      // Calculate totals from StudentFee
      const totals = await StudentFee.findOne({
        where: whereClause,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalExpected'],
          [sequelize.fn('SUM', sequelize.col('paid_amount')), 'totalCollected'],
          [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalDiscount']
        ],
        raw: true
      });

      const expected = parseFloat(totals.totalExpected) || 0;
      const collected = parseFloat(totals.totalCollected) || 0;
      const discount = parseFloat(totals.totalDiscount) || 0;
      const pending = Math.max(0, expected - collected - discount);

      const collectionRate = expected > 0 ? Math.round((collected / (expected - discount)) * 100) : 0;

      // Group counts by status
      const statusCounts = await StudentFee.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const statusMap = { unpaid: 0, partially_paid: 0, paid: 0 };
      statusCounts.forEach(s => {
        if (statusMap[s.status] !== undefined) {
          statusMap[s.status] = parseInt(s.count) || 0;
        }
      });

      const paymentWhere = { school_id };
      const paymentInclude = [];

      if (academic_year_id) {
        paymentInclude.push({
          model: StudentFee,
          as: 'studentFee',
          where: { academic_year_id },
          required: true,
          attributes: []
        });
      }

      // Fetch payment mode details for collection breakdown
      const modeCounts = await FeePayment.findAll({
        where: paymentWhere,
        include: paymentInclude,
        attributes: [
          'payment_mode',
          [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total']
        ],
        group: ['payment_mode'],
        raw: true
      });

      const paymentModes = modeCounts.map(m => ({
        mode: m.payment_mode,
        total: parseFloat(m.total) || 0
      }));

      return this.sendResponse(res, {
        summary: {
          expected,
          collected,
          discount,
          pending,
          collectionRate
        },
        statuses: statusMap,
        modes: paymentModes
      }, 'Fee statistics loaded successfully');
    } catch (error) {
      console.error('Error loading fee stats:', error);
      return this.sendError(res, 'Failed to fetch fee statistics', error.message, 500);
    }
  }

  /**
   * Fetch details of a single fee payment for receipt generation
   */
  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const school_id = req.user?.school_id || req.query.school_id || 1;

      const payment = await FeePayment.findOne({
        where: { id, school_id },
        include: [
          {
            model: StudentFee,
            as: 'studentFee',
            include: [
              {
                model: Student,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                include: [
                  {
                    model: SchoolClass,
                    as: 'schoolClass',
                    attributes: ['class_name', 'section']
                  }
                ]
              },
              {
                model: FeeCategory,
                as: 'feeCategory',
                attributes: ['name']
              }
            ]
          }
        ]
      });

      if (!payment) {
        return this.sendError(res, 'Payment receipt record not found', null, 404);
      }

      return this.sendResponse(res, payment, 'Payment details retrieved successfully');
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return this.sendError(res, 'Failed to fetch payment details', error.message, 500);
    }
  }
}

module.exports = new FeeController();
