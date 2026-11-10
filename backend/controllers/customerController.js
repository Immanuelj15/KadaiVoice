const Customer = require('../models/Customer');
const CreditTransaction = require('../models/CreditTransaction');
const Sale = require('../models/Sale');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');

// @desc Get all customers
// @route GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const { search, hasCredit } = req.query;
    const filter = { shop: req.shopId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasCredit === 'true') {
      filter.outstandingCredit = { $gt: 0 };
    }

    const customers = await Customer.find(filter).sort({ outstandingCredit: -1, name: 1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create a new customer
// @route POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, creditLimit = 5000, notes = '' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required.' });
    }

    const existing = await Customer.findOne({ shop: req.shopId, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this phone number already exists.' });
    }

    const customer = await Customer.create({
      shop: req.shopId,
      name: name.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : '',
      creditLimit: parseFloat(creditLimit) || 5000,
      notes: notes.trim(),
    });

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'CUSTOMER_CREATE',
      entity: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer added successfully!',
      data: customer,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get customer profile, credit ledger & sales history
// @route GET /api/customers/:id
exports.getCustomerDetails = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, shop: req.shopId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const creditHistory = await CreditTransaction.find({
      shop: req.shopId,
      customer: customer._id,
    }).sort({ createdAt: -1 });

    const salesHistory = await Sale.find({
      shop: req.shopId,
      customer: customer._id,
    }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      success: true,
      customer,
      creditHistory,
      salesHistory,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Record Customer Credit Repayment
// @route POST /api/credits/repayments
exports.recordRepayment = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod = 'CASH', notes = '' } = req.body;

    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid customer ID and repayment amount are required.' });
    }

    const customer = await Customer.findOne({ _id: customerId, shop: req.shopId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const paymentAmount = parseFloat(amount);
    const balanceBefore = customer.outstandingCredit;
    const balanceAfter = Math.max(0, Math.round((balanceBefore - paymentAmount) * 100) / 100);

    customer.outstandingCredit = balanceAfter;
    await customer.save();

    const transaction = await CreditTransaction.create({
      shop: req.shopId,
      customer: customer._id,
      type: 'REPAYMENT',
      amount: paymentAmount,
      paymentMethod,
      balanceBefore,
      balanceAfter,
      notes: notes || 'Repayment received',
    });

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'CREDIT_REPAYMENT',
      entity: 'CreditTransaction',
      entityId: transaction._id.toString(),
      details: { customerName: customer.name, amount: paymentAmount, balanceAfter },
    });

    return res.status(201).json({
      success: true,
      message: `Repayment of ₹${paymentAmount} recorded for ${customer.name}. Outstanding balance: ₹${balanceAfter}`,
      transaction,
      customer,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get Credit Summary & List of Credit Transactions
// @route GET /api/credits
exports.getCreditOverview = async (req, res) => {
  try {
    const customersWithCredit = await Customer.find({
      shop: req.shopId,
      outstandingCredit: { $gt: 0 },
    }).sort({ outstandingCredit: -1 });

    const totalOutstanding = customersWithCredit.reduce((sum, c) => sum + c.outstandingCredit, 0);

    const recentTransactions = await CreditTransaction.find({ shop: req.shopId })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      summary: {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        customersWithCreditCount: customersWithCredit.length,
      },
      customers: customersWithCredit,
      recentTransactions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Generate WhatsApp Credit Reminder with UPI payment link
// @route POST /api/credits/whatsapp-reminder/:customerId
exports.generateWhatsAppReminder = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.customerId, shop: req.shopId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const shop = await Shop.findById(req.shopId);
    const amount = customer.outstandingCredit || 0;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Customer has no outstanding credit balance.' });
    }

    // Clean phone number (add 91 country code if 10 digits)
    let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const upiId = shop.upiId || 'shop@upi';
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Khata Balance Settlement')}`;

    const messageText = `வணக்கம் ${customer.name} 🙏,\n\nஉங்கள் ${shop.name} கடை கடன் கணக்கில் மீதமுள்ள பாக்கி தொகை: *₹${amount}*.\n\nதயவுசெய்து இந்த UPI இணைப்பை கிளிக் செய்து (GPay / PhonePe / Paytm) மூலம் செலுத்தலாம்:\n${upiPayLink}\n\nநன்றி! உங்கள் ஆதரவுக்கு வாழ்த்துகள்! 💐\n-${shop.name}`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    return res.status(200).json({
      success: true,
      customerName: customer.name,
      phone: cleanPhone,
      amount,
      messageText,
      upiPayLink,
      whatsappUrl,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
