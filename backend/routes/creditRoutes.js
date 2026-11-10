const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', customerController.getCreditOverview);
router.post('/repayments', customerController.recordRepayment);
router.post('/whatsapp-reminder/:customerId', customerController.generateWhatsAppReminder);

module.exports = router;
