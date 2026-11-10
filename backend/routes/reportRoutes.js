const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/tally-xml', reportController.exportTallyXML);
router.get('/gst-export', reportController.exportGSTJSON);

module.exports = router;
