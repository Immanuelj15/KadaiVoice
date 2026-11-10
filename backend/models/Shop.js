const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'My Store',
  },
  ownerName: {
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
    street: { type: String, default: '' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    pincode: { type: String, default: '' },
  },
  businessType: {
    type: String,
    enum: ['Kirana Store', 'Grocery Shop', 'Petty Shop', 'Provision Store', 'Supermarket', 'Other'],
    default: 'Kirana Store',
  },
  preferredLanguage: {
    type: String,
    enum: ['ta', 'ta-en', 'en'], // Tamil, Tanglish, English
    default: 'ta-en',
  },
  currency: {
    type: String,
    default: 'INR',
  },
  financialYearStart: {
    type: String,
    default: '04-01',
  },
  allowNegativeInventory: {
    type: Boolean,
    default: false,
  },
  isConfigured: {
    type: Boolean,
    default: false,
  },
  isDemo: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Shop', ShopSchema);

