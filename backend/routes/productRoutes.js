const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all product routes

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.post('/bulk', productController.bulkAddProducts);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;

