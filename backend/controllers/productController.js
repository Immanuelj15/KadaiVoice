const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const AuditLog = require('../models/AuditLog');

// @desc Get all products for shop
// @route GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const filter = { shop: req.shopId, isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameTamil: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }

    const products = await Product.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new product
// @route POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      nameTamil,
      sku,
      barcode,
      category,
      purchasePrice,
      sellingPrice,
      currentStock,
      unit,
      minStockLevel,
      supplier,
    } = req.body;

    if (!name || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name, purchase price, and selling price are required.' });
    }

    const product = await Product.create({
      shop: req.shopId,
      name: name.trim(),
      nameTamil: nameTamil ? nameTamil.trim() : '',
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode || '',
      category: category || 'Groceries & Grains',
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      currentStock: parseFloat(currentStock) || 0,
      unit: unit || 'packet',
      minStockLevel: parseFloat(minStockLevel) || 5,
      supplier: supplier || '',
    });

    // Record initial stock movement
    if (product.currentStock > 0) {
      await StockMovement.create({
        shop: req.shopId,
        product: product._id,
        productName: product.name,
        type: 'INITIAL_STOCK',
        quantity: product.currentStock,
        balanceBefore: 0,
        balanceAfter: product.currentStock,
        referenceType: 'Manual',
        reason: 'Opening stock entry',
        performedBy: req.user ? req.user.name : 'Owner',
      });
    }

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'PRODUCT_CREATE',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name, sellingPrice: product.sellingPrice, stock: product.currentStock },
    });

    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      data: product,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update product
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.shopId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const fieldsToUpdate = [
      'name', 'nameTamil', 'sku', 'barcode', 'category',
      'purchasePrice', 'sellingPrice', 'unit', 'minStockLevel', 'supplier'
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'PRODUCT_UPDATE',
      entity: 'Product',
      entityId: product._id.toString(),
      details: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: product,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Soft delete product
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.shopId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.isActive = false;
    await product.save();

    await AuditLog.create({
      shop: req.shopId,
      user: req.user._id,
      action: 'PRODUCT_DELETE',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name },
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed successfully.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Bulk add opening inventory
// @route POST /api/products/bulk
exports.bulkAddProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of products.' });
    }

    const createdList = [];
    for (const item of products) {
      const p = await Product.create({
        shop: req.shopId,
        name: item.name,
        nameTamil: item.nameTamil || '',
        category: item.category || 'Groceries & Grains',
        purchasePrice: item.purchasePrice || 0,
        sellingPrice: item.sellingPrice || 0,
        currentStock: item.currentStock || 0,
        unit: item.unit || 'packet',
        minStockLevel: item.minStockLevel || 5,
        supplier: item.supplier || 'Local Distributor',
      });

      if (p.currentStock > 0) {
        await StockMovement.create({
          shop: req.shopId,
          product: p._id,
          productName: p.name,
          type: 'INITIAL_STOCK',
          quantity: p.currentStock,
          balanceBefore: 0,
          balanceAfter: p.currentStock,
          referenceType: 'Manual',
          reason: 'Bulk opening inventory setup',
          performedBy: req.user.name,
        });
      }
      createdList.push(p);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully loaded ${createdList.length} products into inventory!`,
      data: createdList,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

