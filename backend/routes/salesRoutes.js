const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', salesController.getSales);
router.post('/', salesController.createSale);
router.get('/:id', salesController.getSaleById);
router.post('/:id/reverse', salesController.reverseSale);

module.exports = router;

