const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  totalPurchases: {
    type: Number,
    default: 0,
  },
  outstandingCredit: {
    type: Number,
    default: 0,
  },
  creditLimit: {
    type: Number,
    default: 5000,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

CustomerSchema.index({ shop: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ shop: 1, name: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);

