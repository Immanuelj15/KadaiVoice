const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
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
  nameTamil: {
    type: String,
    trim: true,
    default: '',
  },
  sku: {
    type: String,
    trim: true,
    default: '',
  },
  barcode: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Groceries & Grains',
      'Dairy & Eggs',
      'Cooking Oil & Ghee',
      'Spices & Masalas',
      'Snacks & Beverages',
      'Household & Cleaning',
      'Personal Care',
      'Instant Foods',
      'Other'
    ],
    default: 'Groceries & Grains',
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'liter', 'ml', 'packet', 'piece', 'box', 'can', 'bag'],
    default: 'packet',
  },
  minStockLevel: {
    type: Number,
    default: 5,
  },
  supplier: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound index for fast lookup and uniqueness per shop
ProductSchema.index({ shop: 1, name: 1 });
ProductSchema.index({ shop: 1, barcode: 1 });
ProductSchema.index({ shop: 1, currentStock: 1 });

module.exports = mongoose.model('Product', ProductSchema);

