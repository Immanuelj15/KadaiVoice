const express = require('express');
const router = express.Router();
const aiInsightsController = require('../controllers/aiInsightsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/insights', aiInsightsController.getInsights);

module.exports = router;

