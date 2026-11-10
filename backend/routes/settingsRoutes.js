const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const seedDemoData = require('../utils/seedDemoData');

router.use(protect);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId);
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      success: true,
      shop,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/settings/shop
router.put('/shop', async (req, res) => {
  try {
    const { name, ownerName, phone, address, businessType, preferredLanguage, currency, allowNegativeInventory } = req.body;
    const shop = await Shop.findById(req.shopId);

    if (name) shop.name = name;
    if (ownerName) shop.ownerName = ownerName;
    if (phone) shop.phone = phone;
    if (address) shop.address = address;
    if (businessType) shop.businessType = businessType;
    if (preferredLanguage) shop.preferredLanguage = preferredLanguage;
    if (currency) shop.currency = currency;
    if (allowNegativeInventory !== undefined) shop.allowNegativeInventory = allowNegativeInventory;

    await shop.save();

    return res.status(200).json({
      success: true,
      message: 'Shop settings updated successfully!',
      shop,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/reset-demo
router.post('/reset-demo', async (req, res) => {
  try {
    const result = await seedDemoData(req.shopId, req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Demo store data refreshed with 20 products, 10 customers, sales and credit history!',
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

