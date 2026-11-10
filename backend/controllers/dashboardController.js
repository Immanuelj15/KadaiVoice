const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');

// @desc Get main business dashboard metrics
// @route GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const shopId = req.shopId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Sales & Gross Profit
    const todaySales = await Sale.find({
      shop: shopId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
      isReversed: false,
    });

    let todayRevenue = 0;
    let todayGrossProfit = 0;
    let todayCashSales = 0;
    let todayUpiSales = 0;
    let todayCreditSales = 0;
    let totalItemsSoldToday = 0;
    const productSalesMap = {};

    todaySales.forEach((sale) => {
      todayRevenue += sale.total;
      todayGrossProfit += sale.grossProfit;

      if (sale.paymentMethod === 'CASH') todayCashSales += sale.total;
      else if (sale.paymentMethod === 'UPI') todayUpiSales += sale.total;
      else if (sale.paymentMethod === 'CREDIT') todayCreditSales += sale.total;

      sale.items.forEach((item) => {
        totalItemsSoldToday += item.quantity;
        const key = item.productName;
        productSalesMap[key] = (productSalesMap[key] || 0) + item.quantity;
      });
    });

    // 2. Product Counts & Low Stock Alerts
    const allProducts = await Product.find({ shop: shopId, isActive: true });
    const totalProducts = allProducts.length;

    const lowStockProducts = allProducts
      .filter((p) => p.currentStock <= p.minStockLevel)
      .map((p) => ({
        id: p._id,
        name: p.name,
        nameTamil: p.nameTamil,
        category: p.category,
        currentStock: p.currentStock,
        minStockLevel: p.minStockLevel,
        unit: p.unit,
        sellingPrice: p.sellingPrice,
      }));

    // 3. Pending Customer Credit
    const customers = await Customer.find({ shop: shopId });
    const pendingCustomerCredit = customers.reduce((sum, c) => sum + (c.outstandingCredit || 0), 0);

    // 4. Top Selling Products (from all non-reversed sales in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSalesAggregate = await Sale.aggregate([
      { $match: { shop: shopId, isReversed: false, createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          unit: { $first: '$items.unit' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // 5. Recent 6 transactions
    const recentTransactions = await Sale.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('invoiceNumber customerName total paymentMethod paymentStatus isReversed items createdAt');

    // 6. Natural Language AI Business Summary
    let aiSummary = '';
    const topToday = Object.entries(productSalesMap).sort((a, b) => b[1] - a[1]);
    const topTodayStr = topToday.length > 0
      ? `Today you sold ${topToday.slice(0, 2).map(([name, qty]) => `${qty} of ${name}`).join(' and ')}.`
      : 'No items sold yet today.';

    const lowStockStr = lowStockProducts.length > 0
      ? `${lowStockProducts.length} items (${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}) are running low on stock. Restock soon to prevent missed sales.`
      : 'All product inventory levels are healthy.';

    aiSummary = `${topTodayStr} ${lowStockStr} Total business collection stands at ₹${Math.round(todayRevenue)}.`;

    return res.status(200).json({
      success: true,
      kpis: {
        todaySales: Math.round(todayRevenue * 100) / 100,
        todayGrossProfit: Math.round(todayGrossProfit * 100) / 100,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        pendingCustomerCredit: Math.round(pendingCustomerCredit * 100) / 100,
        todayTransactionsCount: todaySales.length,
        totalItemsSoldToday,
        paymentBreakdown: {
          cash: Math.round(todayCashSales * 100) / 100,
          upi: Math.round(todayUpiSales * 100) / 100,
          credit: Math.round(todayCreditSales * 100) / 100,
        },
      },
      aiSummary,
      topSellingProducts: topSalesAggregate,
      lowStockAlerts: lowStockProducts.slice(0, 5),
      recentTransactions,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get sales chart trends for past 7 days & payment breakdown
// @route GET /api/dashboard/sales-chart
exports.getSalesChart = async (req, res) => {
  try {
    const shopId = req.shopId;
    const days = 7;
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const daySales = await Sale.find({
        shop: shopId,
        createdAt: { $gte: start, $lte: end },
        isReversed: false,
      });

      let salesAmount = 0;
      let profit = 0;
      let cash = 0;
      let upi = 0;
      let credit = 0;

      daySales.forEach((s) => {
        salesAmount += s.total;
        profit += s.grossProfit;
        if (s.paymentMethod === 'CASH') cash += s.total;
        else if (s.paymentMethod === 'UPI') upi += s.total;
        else if (s.paymentMethod === 'CREDIT') credit += s.total;
      });

      const dayName = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      chartData.push({
        date: dayName,
        rawDate: start.toISOString().split('T')[0],
        sales: Math.round(salesAmount),
        profit: Math.round(profit),
        cash: Math.round(cash),
        upi: Math.round(upi),
        credit: Math.round(credit),
        orders: daySales.length,
      });
    }

    return res.status(200).json({
      success: true,
      chartData,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

