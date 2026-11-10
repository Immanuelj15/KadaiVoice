const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['LOW_STOCK', 'CREDIT_OVERDUE', 'SYSTEM', 'DAILY_REPORT', 'VOICE_TRANSACTION'],
    default: 'SYSTEM',
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

NotificationSchema.index({ shop: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

