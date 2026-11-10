const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');
const { JWT_SECRET } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Generate JWT Token
const generateToken = (userId, shopId) => {
  return jwt.sign({ userId, shopId }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc Register user & shop
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, shopName, email, phone, password, shopCategory, preferredLanguage } = req.body;

    if (!name || !shopName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists.',
      });
    }

    // 1. Create Shop
    const shop = await Shop.create({
      name: shopName,
      ownerName: name,
      phone,
      businessType: shopCategory || 'Kirana Store',
      preferredLanguage: preferredLanguage || 'ta-en',
      isConfigured: false,
    });

    // 2. Hash Password & Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'owner',
      shop: shop._id,
      preferredLanguage: preferredLanguage || 'ta-en',
    });

    const token = generateToken(user._id, shop._id);

    await AuditLog.create({
      shop: shop._id,
      user: user._id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email, shopName },
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
      shop: {
        id: shop._id,
        name: shop.name,
        ownerName: shop.ownerName,
        businessType: shop.businessType,
        isConfigured: shop.isConfigured,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phone: identifier.trim() }],
    }).populate('shop');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id, user.shop._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
      shop: user.shop,
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
};

// @desc Get current logged-in user profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('shop');
    return res.status(200).json({
      success: true,
      user,
      shop: user.shop,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Complete shop setup wizard
// @route POST /api/auth/setup
exports.completeSetup = async (req, res) => {
  try {
    const { shopName, ownerName, address, businessType, preferredLanguage, currency, allowNegativeInventory } = req.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }

    if (shopName) shop.name = shopName;
    if (ownerName) shop.ownerName = ownerName;
    if (address) shop.address = address;
    if (businessType) shop.businessType = businessType;
    if (preferredLanguage) shop.preferredLanguage = preferredLanguage;
    if (currency) shop.currency = currency;
    if (allowNegativeInventory !== undefined) shop.allowNegativeInventory = allowNegativeInventory;
    shop.isConfigured = true;

    await shop.save();

    return res.status(200).json({
      success: true,
      message: 'Shop setup completed successfully!',
      shop,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

