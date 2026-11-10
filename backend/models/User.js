const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'staff', 'admin'],
    default: 'owner',
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  preferredLanguage: {
    type: String,
    enum: ['ta', 'ta-en', 'en'],
    default: 'ta-en',
  },
  avatar: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

