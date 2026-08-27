const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SchoolInvoice = sequelize.define('SchoolInvoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  billing_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('paid', 'unpaid', 'void'),
    allowNull: false,
    defaultValue: 'unpaid'
  },
  invoice_pdf_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'school_invoices',
  timestamps: true
});

module.exports = SchoolInvoice;
