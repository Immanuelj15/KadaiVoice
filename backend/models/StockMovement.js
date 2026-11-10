const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  productName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'REVERSAL', 'INITIAL_STOCK'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true, // Positive for in, negative for out
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  referenceType: {
    type: String,
    enum: ['Sale', 'Purchase', 'Manual', 'VoiceCommand'],
    default: 'Manual',
  },
  referenceId: {
    type: String,
    default: '',
  },
  reason: {
    type: String,
    default: '',
  },
  performedBy: {
    type: String,
    default: 'System',
  },
}, { timestamps: true });

StockMovementSchema.index({ shop: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', StockMovementSchema);

