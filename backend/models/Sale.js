const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const SaleSchema = new mongoose.Schema({
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
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  customerName: {
    type: String,
    trim: true,
    default: 'Walk-in Customer',
  },
  customerPhone: {
    type: String,
    trim: true,
    default: '',
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  costOfGoodsSold: {
    type: Number,
    required: true,
    default: 0,
  },
  grossProfit: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'CREDIT'],
    default: 'CASH',
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING'],
    default: 'PAID',
  },
  voiceCommandOrigin: {
    type: Boolean,
    default: false,
  },
  voiceTranscript: {
    type: String,
    default: '',
  },
  isReversed: {
    type: Boolean,
    default: false,
  },
  reversedAt: {
    type: Date,
    default: null,
  },
  reversedReason: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

SaleSchema.index({ shop: 1, createdAt: -1 });
SaleSchema.index({ shop: 1, invoiceNumber: 1 });
SaleSchema.index({ shop: 1, paymentMethod: 1 });

module.exports = mongoose.model('Sale', SaleSchema);

