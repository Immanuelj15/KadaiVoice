const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Rent', 'Electricity', 'Salaries & Wages', 'Transport', 'Packaging', 'Shop Maintenance', 'Tea & Refreshments', 'Other'],
    default: 'Other',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER'],
    default: 'CASH',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

ExpenseSchema.index({ shop: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);

