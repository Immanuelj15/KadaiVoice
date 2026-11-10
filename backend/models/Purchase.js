const mongoose = require('mongoose');

const PurchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unit: {
    type: String,
    default: 'packet',
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const PurchaseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
  },
  supplierContact: {
    type: String,
    default: '',
  },
  items: [PurchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT'],
    default: 'CASH',
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

PurchaseSchema.index({ shop: 1, purchaseDate: -1 });

module.exports = mongoose.model('Purchase', PurchaseSchema);

