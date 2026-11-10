const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerDetails);

module.exports = router;

