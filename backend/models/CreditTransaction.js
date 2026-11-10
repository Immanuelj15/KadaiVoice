const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['CREDIT_SALE', 'REPAYMENT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
    default: 'CASH',
  },
  balanceBefore: {
    type: Number,
    required: true,
    default: 0,
  },
  balanceAfter: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

CreditTransactionSchema.index({ shop: 1, customer: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);

