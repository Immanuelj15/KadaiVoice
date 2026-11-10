const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Purchase = require('../models/Purchase');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');

// @desc Get inventory status overview
// @route GET /api/inventory
exports.getInventoryOverview = async (req, res) => {
  try {
    const products = await Product.find({ shop: req.shopId, isActive: true });

    let totalStockValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = Math.max(0, p.currentStock);
      totalStockValue += stock * p.purchasePrice;
      totalRetailValue += stock * p.sellingPrice;

      if (p.currentStock <= 0) {
        outOfStockCount++;
      } else if (p.currentStock <= p.minStockLevel) {
        lowStockCount++;
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalStockValue) * 100) / 100,
        lowStockCount,
        outOfStockCount,
      },
      products,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get low stock products
// @route GET /api/inventory/low-stock
exports.getLowStock = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      shop: req.shopId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }).sort({ currentStock: 1 });

    return res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Adjust product stock manually (IN / OUT)
// @route POST /api/inventory/adjust
exports.adjustStock = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body;

    if (!productId || !type || quantity === undefined || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product, type, or quantity.' });
    }

    const product = await Product.findOne({ _id: productId, shop: req.shopId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const shop = await Shop.findById(req.shopId);
    const balanceBefore = product.currentStock;
    const qtyChange = type === 'ADJUSTMENT_IN' ? Math.abs(quantity) : -Math.abs(quantity);
    const balanceAfter = balanceBefore + qtyChange;

    if (balanceAfter < 0 && !shop.allowNegativeInventory) {
      return res.status(400).json({
        success: false,
        message: `Stock cannot fall below zero. Current stock is ${balanceBefore} ${product.unit}.`,
      });
    }

    product.currentStock = balanceAfter;
    await product.save();

    const movement = await StockMovement.create({
      shop: req.shopId,
      product: product._id,
      productName: product.name,
      type: type === 'ADJUSTMENT_IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      quantity: qtyChange,
      balanceBefore,
      balanceAfter,
      referenceType: 'Manual',
      reason: reason || 'Manual stock adjustment',
      performedBy: req.user ? req.user.name : 'Owner',
    });

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { type, quantity, balanceBefore, balanceAfter, reason },
    });

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully!',
      product,
      movement,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Record purchase entry from supplier
// @route POST /api/inventory/purchase
exports.recordPurchase = async (req, res) => {
  try {
    const { supplierName, supplierContact, items, paymentMethod, paidAmount, notes } = req.body;

    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier name and at least one item are required.' });
    }

    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, shop: req.shopId });
      if (!product) continue;

      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.costPrice) || product.purchasePrice;
      const lineTotal = qty * cost;
      totalAmount += lineTotal;

      const balanceBefore = product.currentStock;
      const balanceAfter = balanceBefore + qty;

      product.currentStock = balanceAfter;
      if (item.costPrice) {
        product.purchasePrice = cost;
      }
      await product.save();

      await StockMovement.create({
        shop: req.shopId,
        product: product._id,
        productName: product.name,
        type: 'PURCHASE',
        quantity: qty,
        balanceBefore,
        balanceAfter,
        referenceType: 'Purchase',
        reason: `Goods received from ${supplierName}`,
        performedBy: req.user ? req.user.name : 'Owner',
      });

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        costPrice: cost,
        totalAmount: lineTotal,
      });
    }

    const invoiceNumber = `PUR-${Date.now().toString().slice(-6)}`;
    const purchase = await Purchase.create({
      shop: req.shopId,
      invoiceNumber,
      supplierName,
      supplierContact: supplierContact || '',
      items: processedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : totalAmount,
      paymentMethod: paymentMethod || 'CASH',
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase recorded and stock updated successfully!',
      purchase,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get stock movements history
// @route GET /api/inventory/movements
exports.getStockMovements = async (req, res) => {
  try {
    const { productId, limit = 50 } = req.query;
    const filter = { shop: req.shopId };

    if (productId) {
      filter.product = productId;
    }

    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: movements.length,
      data: movements,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Generate Wholesale Supplier Purchase Indent for WhatsApp
// @route POST /api/inventory/supplier-indent
exports.generateSupplierIndent = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId);
    let { items, supplierName, targetTime = 'Tomorrow 10:00 AM' } = req.body;

    // If no custom items passed, automatically fetch all low stock items
    if (!items || !Array.isArray(items) || items.length === 0) {
      const lowStockProds = await Product.find({
        shop: req.shopId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      });

      items = lowStockProds.map((p) => ({
        name: p.name,
        nameTamil: p.nameTamil,
        quantity: Math.max(10, p.minStockLevel * 2),
        unit: p.unit,
        supplier: p.supplier || 'Wholesale Distributor',
      }));
    }

    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No items running low on stock. All product inventories are healthy!',
        indents: [],
      });
    }

    // Group items by supplier
    const grouped = {};
    items.forEach((item) => {
      const sup = item.supplier || supplierName || 'General Wholesale Distributor';
      if (!grouped[sup]) grouped[sup] = [];
      grouped[sup].push(item);
    });

    const indents = [];
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    for (const [sup, supItems] of Object.entries(grouped)) {
      const itemsListText = supItems
        .map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity} ${it.unit}`)
        .join('\n');

      const messageText = `📦 *WHOLESALE PURCHASE ORDER*\n*From:* ${shop.name} (${shop.ownerName || 'Store Owner'})\n*Date:* ${dateStr}\n*To Supplier:* ${sup}\n\n*Required Stock Items:*\n${itemsListText}\n\n⏰ *Please dispatch by:* ${targetTime}\n📍 *Delivery Address:* ${shop.address?.street || 'Store Counter'}, ${shop.address?.city || 'Chennai'}\n📞 *Contact:* ${shop.phone || ''}\n\n_Generated via KadaiVoice AI_`;

      indents.push({
        supplierName: sup,
        itemsCount: supItems.length,
        messageText,
        whatsappUrl: `https://wa.me/?text=${encodeURIComponent(messageText)}`,
      });
    }

    return res.status(200).json({
      success: true,
      shopName: shop.name,
      indents,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
