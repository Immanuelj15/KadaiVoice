const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// @desc Generate data-driven AI Business Insights
// @route GET /api/ai/insights
exports.getInsights = async (req, res) => {
  try {
    const shopId = req.shopId;
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // 1. Fetch sales from past 14 days
    const recentSales = await Sale.find({
      shop: shopId,
      createdAt: { $gte: fourteenDaysAgo },
      isReversed: false,
    });

    // 2. Fetch catalog products
    const products = await Product.find({ shop: shopId, isActive: true });

    // Aggregate product sales velocity
    const velocityMap = {};
    const basketPairs = {};

    recentSales.forEach((sale) => {
      // Velocity
      sale.items.forEach((item) => {
        velocityMap[item.productName] = (velocityMap[item.productName] || 0) + item.quantity;
      });

      // Basket analysis (frequently bought together)
      if (sale.items.length > 1) {
        for (let i = 0; i < sale.items.length; i++) {
          for (let j = i + 1; j < sale.items.length; j++) {
            const pair = [sale.items[i].productName, sale.items[j].productName].sort().join(' + ');
            basketPairs[pair] = (basketPairs[pair] || 0) + 1;
          }
        }
      }
    });

    // 3. Fast-moving vs Slow-moving products
    const fastMoving = [];
    const slowMoving = [];
    const restockingAdvice = [];

    products.forEach((p) => {
      const soldQty = velocityMap[p.name] || 0;
      const dailyRunRate = soldQty / 14;

      if (soldQty > 10) {
        fastMoving.push({
          name: p.name,
          category: p.category,
          soldPast14Days: soldQty,
          currentStock: p.currentStock,
          unit: p.unit,
        });
      } else if (p.currentStock > 15 && soldQty <= 2) {
        slowMoving.push({
          name: p.name,
          category: p.category,
          currentStock: p.currentStock,
          soldPast14Days: soldQty,
          unit: p.unit,
          capitalTiedUp: Math.round(p.currentStock * p.purchasePrice),
        });
      }

      // Restocking recommendation
      if (p.currentStock <= p.minStockLevel) {
        const suggestedReorder = Math.max(10, Math.ceil(dailyRunRate * 14 * 1.5));
        restockingAdvice.push({
          productId: p._id,
          name: p.name,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          unit: p.unit,
          urgency: p.currentStock === 0 ? 'CRITICAL' : 'HIGH',
          suggestedReorderQuantity: suggestedReorder,
          estimatedReorderCost: Math.round(suggestedReorder * p.purchasePrice),
          reason: p.currentStock === 0
            ? 'Stock is completely depleted. Reorder immediately.'
            : `Stock is below safety threshold (${p.minStockLevel} ${p.unit}).`,
        });
      }
    });

    // 4. Basket Insights
    const topBundles = Object.entries(basketPairs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([bundle, count]) => ({
        combination: bundle,
        coOccurrenceCount: count,
        suggestion: `Customers often buy ${bundle} together. Place them near each other or offer a combo.`,
      }));

    // 5. Strategic AI Advice Cards
    const strategicInsights = [
      {
        id: 1,
        type: 'INVENTORY_OPTIMIZATION',
        title: 'Restock High-Velocity Kirana Staples',
        description: `${restockingAdvice.length} item(s) require reordering. Prioritize daily essentials like Milk, Rice, and Cooking Oil to prevent revenue leakage.`,
        urgency: restockingAdvice.length > 0 ? 'HIGH' : 'LOW',
      },
      {
        id: 2,
        type: 'WORKING_CAPITAL',
        title: 'Clear Stagnant Capital in Slow Movers',
        description: slowMoving.length > 0
          ? `You have ₹${slowMoving.reduce((sum, s) => sum + s.capitalTiedUp, 0)} tied up in ${slowMoving.length} slow-moving items like ${slowMoving.slice(0, 2).map(s => s.name).join(', ')}. Consider a small festival discount.`
          : 'Working capital turnover is healthy across product catalog.',
        urgency: slowMoving.length > 3 ? 'MEDIUM' : 'LOW',
      },
      {
        id: 3,
        type: 'BASKET_EXPANSION',
        title: 'Cross-Merchandise Complementary Items',
        description: topBundles.length > 0
          ? `Strongest pairing detected: "${topBundles[0].combination}". Suggest the secondary item to customers verbally.`
          : 'Promote snacks alongside evening tea milk customers.',
        urgency: 'MEDIUM',
      },
    ];

    return res.status(200).json({
      success: true,
      analysisPeriod: 'Past 14 Days',
      fastMoving: fastMoving.slice(0, 5),
      slowMoving: slowMoving.slice(0, 5),
      restockingAdvice,
      topBundles,
      strategicInsights,
    });
  } catch (err) {
    console.error('AI Insights Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

