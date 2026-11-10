const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', inventoryController.getInventoryOverview);
router.get('/low-stock', inventoryController.getLowStock);
router.post('/adjust', inventoryController.adjustStock);
router.post('/purchase', inventoryController.recordPurchase);
router.get('/movements', inventoryController.getStockMovements);
router.post('/supplier-indent', inventoryController.generateSupplierIndent);

module.exports = router;
