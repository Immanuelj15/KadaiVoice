const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Customer = require('../models/Customer');
const CreditTransaction = require('../models/CreditTransaction');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');

// @desc Get all sales transactions
// @route GET /api/sales
exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, search, limit = 100 } = req.query;
    const filter = { shop: req.shopId };

    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get single sale details
// @route GET /api/sales/:id
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shop: req.shopId }).populate('customer');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale transaction not found.' });
    }

    const shop = await Shop.findById(req.shopId);

    return res.status(200).json({
      success: true,
      sale,
      shop,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create a new sale
// @route POST /api/sales
exports.createSale = async (req, res) => {
  try {
    const {
      items,
      paymentMethod = 'CASH',
      customerId = null,
      customerName,
      customerPhone,
      discount = 0,
      tax = 0,
      notes = '',
      voiceCommandOrigin = false,
      voiceTranscript = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required to complete a sale.' });
    }

    const shop = await Shop.findById(req.shopId);
    let subtotal = 0;
    let costOfGoodsSold = 0;
    const processedItems = [];

    // 1. Verify items & stock availability
    for (const item of items) {
      let product = null;
      if (item.productId) {
        product = await Product.findOne({ _id: item.productId, shop: req.shopId });
      } else if (item.productName) {
        product = await Product.findOne({
          shop: req.shopId,
          name: { $regex: new RegExp(`^${item.productName.trim()}$`, 'i') },
        });
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productName || item.productId}" was not found in catalog.`,
        });
      }

      const qty = parseFloat(item.quantity) || 1;
      const unitPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : product.sellingPrice;
      const purchasePrice = product.purchasePrice || 0;

      // Negative stock validation
      if (product.currentStock < qty && !shop.allowNegativeInventory) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.currentStock} ${product.unit}, Requested: ${qty} ${product.unit}.`,
        });
      }

      const lineTotal = Math.round(qty * unitPrice * 100) / 100;
      const lineCost = Math.round(qty * purchasePrice * 100) / 100;

      subtotal += lineTotal;
      costOfGoodsSold += lineCost;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        unitPrice,
        purchasePrice,
        totalPrice: lineTotal,
      });
    }

    const finalSubtotal = Math.round(subtotal * 100) / 100;
    const finalDiscount = Math.round(parseFloat(discount || 0) * 100) / 100;
    const finalTax = Math.round(parseFloat(tax || 0) * 100) / 100;
    const finalTotal = Math.max(0, Math.round((finalSubtotal - finalDiscount + finalTax) * 100) / 100);
    const grossProfit = Math.round((finalTotal - costOfGoodsSold) * 100) / 100;

    // 2. Customer resolution for credit
    let resolvedCustomer = null;
    let finalCustomerName = customerName || 'Walk-in Customer';
    let finalCustomerPhone = customerPhone || '';

    if (customerId) {
      resolvedCustomer = await Customer.findOne({ _id: customerId, shop: req.shopId });
      if (resolvedCustomer) {
        finalCustomerName = resolvedCustomer.name;
        finalCustomerPhone = resolvedCustomer.phone;
      }
    } else if (paymentMethod === 'CREDIT' && customerName) {
      // Find or create customer
      resolvedCustomer = await Customer.findOne({
        shop: req.shopId,
        $or: [
          { name: { $regex: new RegExp(`^${customerName.trim()}$`, 'i') } },
          ...(customerPhone ? [{ phone: customerPhone.trim() }] : []),
        ],
      });

      if (!resolvedCustomer) {
        resolvedCustomer = await Customer.create({
          shop: req.shopId,
          name: customerName.trim(),
          phone: customerPhone ? customerPhone.trim() : `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          outstandingCredit: 0,
        });
      }
    }

    if (paymentMethod === 'CREDIT' && !resolvedCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A valid customer is required for credit transactions.',
      });
    }

    // 3. Generate unique invoice number
    const countToday = await Sale.countDocuments({
      shop: req.shopId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    // 4. Create Sale Record
    const sale = await Sale.create({
      shop: req.shopId,
      invoiceNumber,
      customer: resolvedCustomer ? resolvedCustomer._id : null,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      items: processedItems,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      tax: finalTax,
      total: finalTotal,
      costOfGoodsSold,
      grossProfit,
      paymentMethod,
      paymentStatus: paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
      voiceCommandOrigin,
      voiceTranscript,
      notes,
    });

    // 5. Update Inventory and log Stock Movements
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      const balanceBefore = product.currentStock;
      const balanceAfter = balanceBefore - item.quantity;

      product.currentStock = balanceAfter;
      await product.save();

      await StockMovement.create({
        shop: req.shopId,
        product: product._id,
        productName: product.name,
        type: 'SALE',
        quantity: -item.quantity,
        balanceBefore,
        balanceAfter,
        referenceType: voiceCommandOrigin ? 'VoiceCommand' : 'Sale',
        referenceId: sale.invoiceNumber,
        reason: `Sale ${sale.invoiceNumber}`,
        performedBy: req.user ? req.user.name : 'Voice System',
      });
    }

    // 6. Update Customer Credit ledger if Credit Sale
    if (paymentMethod === 'CREDIT' && resolvedCustomer) {
      const balanceBefore = resolvedCustomer.outstandingCredit || 0;
      const balanceAfter = Math.round((balanceBefore + finalTotal) * 100) / 100;

      resolvedCustomer.outstandingCredit = balanceAfter;
      resolvedCustomer.totalPurchases = (resolvedCustomer.totalPurchases || 0) + finalTotal;
      await resolvedCustomer.save();

      await CreditTransaction.create({
        shop: req.shopId,
        customer: resolvedCustomer._id,
        type: 'CREDIT_SALE',
        amount: finalTotal,
        sale: sale._id,
        paymentMethod: 'CASH',
        balanceBefore,
        balanceAfter,
        notes: `Credit invoice ${sale.invoiceNumber}`,
      });
    } else if (resolvedCustomer) {
      resolvedCustomer.totalPurchases = (resolvedCustomer.totalPurchases || 0) + finalTotal;
      await resolvedCustomer.save();
    }

    // 7. Audit log
    await AuditLog.create({
      shop: req.shopId,
      user: req.user ? req.user._id : null,
      action: 'SALE_CREATE',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: {
        invoiceNumber,
        total: finalTotal,
        paymentMethod,
        itemCount: processedItems.length,
        voiceCommandOrigin,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Sale ${invoiceNumber} created successfully!`,
      sale,
    });
  } catch (err) {
    console.error('Create Sale Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Reverse / Cancel a Sale
// @route POST /api/sales/:id/reverse
exports.reverseSale = async (req, res) => {
  try {
    const { reason = 'Cancelled by shop owner' } = req.body;
    const sale = await Sale.findOne({ _id: req.params.id, shop: req.shopId });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found.' });
    }

    if (sale.isReversed) {
      return res.status(400).json({ success: false, message: 'This sale has already been reversed.' });
    }

    // 1. Mark sale as reversed
    sale.isReversed = true;
    sale.reversedAt = new Date();
    sale.reversedReason = reason;
    await sale.save();

    // 2. Restore inventory
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const balanceBefore = product.currentStock;
        const balanceAfter = balanceBefore + item.quantity;
        product.currentStock = balanceAfter;
        await product.save();

        await StockMovement.create({
          shop: req.shopId,
          product: product._id,
          productName: product.name,
          type: 'REVERSAL',
          quantity: item.quantity,
          balanceBefore,
          balanceAfter,
          referenceType: 'Sale',
          referenceId: sale.invoiceNumber,
          reason: `Reversal of ${sale.invoiceNumber}: ${reason}`,
          performedBy: req.user ? req.user.name : 'Owner',
        });
      }
    }

    // 3. Reverse Credit if applicable
    if (sale.paymentMethod === 'CREDIT' && sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        const balanceBefore = customer.outstandingCredit;
        const balanceAfter = Math.max(0, Math.round((balanceBefore - sale.total) * 100) / 100);
        customer.outstandingCredit = balanceAfter;
        await customer.save();

        await CreditTransaction.create({
          shop: req.shopId,
          customer: customer._id,
          type: 'REPAYMENT',
          amount: sale.total,
          sale: sale._id,
          paymentMethod: 'OTHER',
          balanceBefore,
          balanceAfter,
          notes: `Reversal credit writeback for ${sale.invoiceNumber}`,
        });
      }
    }

    await AuditLog.create({
      shop: req.shopId,
      user: req.user ? req.user._id : null,
      action: 'SALE_REVERSE',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: { invoiceNumber: sale.invoiceNumber, reason },
    });

    return res.status(200).json({
      success: true,
      message: `Sale ${sale.invoiceNumber} has been reversed and stock restored.`,
      sale,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

