const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const StudentFee = sequelize.define('StudentFee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fee_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  remaining_balance: {
    type: DataTypes.VIRTUAL,
    get() {
      const amt = parseFloat(this.getDataValue('amount')) || 0;
      const paid = parseFloat(this.getDataValue('paid_amount')) || 0;
      const discount = parseFloat(this.getDataValue('discount_amount')) || 0;
      return Math.max(0, amt - paid - discount);
    }
  }
}, {
  tableName: 'student_fees',
  timestamps: true,
  paranoid: true
});

module.exports = StudentFee;
