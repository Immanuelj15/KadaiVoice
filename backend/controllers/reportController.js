const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const CreditTransaction = require('../models/CreditTransaction');
const gnaniTimbre = require('../services/gnaniTimbre');
const Shop = require('../models/Shop');

// Helper to determine GST tax slab for Kirana store items
const getGSTRate = (category = '', name = '') => {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();

  // 18%: Soaps, Detergents, Shampoo, Personal Care, Household
  if (cat.includes('household') || cat.includes('personal') || n.includes('soap') || n.includes('surf') || n.includes('shampoo') || n.includes('vim')) {
    return 18;
  }
  // 12%: Ghee, Processed dairy
  if (n.includes('ghee') || n.includes('butter')) {
    return 12;
  }
  // 5%: Cooking oil, Spices, Sugar, Tea, Coffee
  if (cat.includes('oil') || cat.includes('spices') || n.includes('oil') || n.includes('sugar') || n.includes('tea') || n.includes('coffee') || n.includes('masala')) {
    return 5;
  }
  // 0%: Grains, Rice, Atta, Dal, Raw Milk, Eggs (Nil-rated staples)
  return 0;
};

// @desc Generate Daily Closing Report
// @route GET /api/reports/daily
exports.getDailyReport = async (req, res) => {
  try {
    const shopId = req.shopId;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      shop: shopId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isReversed: false,
    });

    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;
    let totalCostOfGoods = 0;
    let totalItemsSold = 0;
    const productFrequency = {};

    sales.forEach((s) => {
      totalSales += s.total;
      totalCostOfGoods += s.costOfGoodsSold || 0;

      if (s.paymentMethod === 'CASH') cashSales += s.total;
      else if (s.paymentMethod === 'UPI') upiSales += s.total;
      else if (s.paymentMethod === 'CREDIT') creditSales += s.total;

      s.items.forEach((item) => {
        totalItemsSold += item.quantity;
        productFrequency[item.productName] = (productFrequency[item.productName] || 0) + item.quantity;
      });
    });

    const grossProfit = Math.round((totalSales - totalCostOfGoods) * 100) / 100;

    const expenses = await Expense.find({
      shop: shopId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingResult = Math.round((grossProfit - totalExpenses) * 100) / 100;

    const creditTransactionsToday = await CreditTransaction.find({
      shop: shopId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    let creditIssued = 0;
    let creditCollected = 0;

    creditTransactionsToday.forEach((tx) => {
      if (tx.type === 'CREDIT_SALE') creditIssued += tx.amount;
      else if (tx.type === 'REPAYMENT') creditCollected += tx.amount;
    });

    const allProducts = await Product.find({ shop: shopId, isActive: true });
    let closingStockValuation = 0;
    const lowStockItems = [];

    allProducts.forEach((p) => {
      const stock = Math.max(0, p.currentStock);
      closingStockValuation += stock * p.purchasePrice;
      if (p.currentStock <= p.minStockLevel) {
        lowStockItems.push({
          name: p.name,
          currentStock: p.currentStock,
          unit: p.unit,
        });
      }
    });

    const sortedProducts = Object.entries(productFrequency).sort((a, b) => b[1] - a[1]);
    const topProductName = sortedProducts.length > 0 ? sortedProducts[0][0] : 'General Groceries';

    const shop = await Shop.findById(shopId);
    const lang = shop.preferredLanguage || 'ta-en';

    let voiceSummaryText = '';
    if (lang.includes('ta')) {
      voiceSummaryText = `இன்று உங்கள் கடையில் ரூபாய் ${Math.round(totalSales)} விற்பனை நடந்துள்ளது. அதிக விற்பனையான பொருள் ${topProductName}. ${lowStockItems.length} பொருட்கள் இருப்பு குறைவாக உள்ளன.`;
    } else {
      voiceSummaryText = `Today your shop recorded ${Math.round(totalSales)} rupees in sales. ${topProductName} was your top-selling product. ${lowStockItems.length} products are running low on stock.`;
    }

    let audioUrl = null;
    let useWebSpeech = true;
    try {
      const ttsResult = await gnaniTimbre.speak({
        text: voiceSummaryText,
        language: lang.includes('ta') ? 'ta-IN' : 'en-IN',
      });
      audioUrl = ttsResult.audioUrl;
      useWebSpeech = ttsResult.useWebSpeech;
    } catch (ttsErr) {
      console.warn('TTS for report failed:', ttsErr.message);
    }

    return res.status(200).json({
      success: true,
      reportDate: startOfDay.toISOString().split('T')[0],
      shopName: shop.name,
      metrics: {
        totalSales: Math.round(totalSales * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        upiSales: Math.round(upiSales * 100) / 100,
        creditSales: Math.round(creditSales * 100) / 100,
        totalItemsSold,
        costOfGoodsSold: Math.round(totalCostOfGoods * 100) / 100,
        grossProfit,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netOperatingResult,
        creditIssued: Math.round(creditIssued * 100) / 100,
        creditCollected: Math.round(creditCollected * 100) / 100,
        closingStockValuation: Math.round(closingStockValuation * 100) / 100,
        lowStockCount: lowStockItems.length,
        totalTransactions: sales.length,
      },
      topSellingProductToday: topProductName,
      lowStockItems,
      expenses,
      recentSales: sales.slice(0, 10),
      aiSummary: {
        text: voiceSummaryText,
        audioUrl,
        useWebSpeech,
      },
    });
  } catch (err) {
    console.error('Daily Report Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Generate Weekly Comparison Report
// @route GET /api/reports/weekly
exports.getWeeklyReport = async (req, res) => {
  try {
    const shopId = req.shopId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      shop: shopId,
      createdAt: { $gte: sevenDaysAgo },
      isReversed: false,
    });

    const weeklyTotal = sales.reduce((sum, s) => sum + s.total, 0);
    const weeklyProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);

    return res.status(200).json({
      success: true,
      weeklyTotal: Math.round(weeklyTotal * 100) / 100,
      weeklyProfit: Math.round(weeklyProfit * 100) / 100,
      transactionsCount: sales.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Export Sales data in Tally XML format (Tally ERP9 / Tally Prime Import Compatible)
// @route GET /api/reports/tally-xml
exports.exportTallyXML = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId);
    const { startDate, endDate } = req.query;

    const filter = { shop: req.shopId, isReversed: false };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = e;
      }
    }

    const sales = await Sale.find(filter).sort({ createdAt: 1 });

    let xmlVouchers = '';
    sales.forEach((s) => {
      const tallyDate = new Date(s.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const ledgerName = s.paymentMethod === 'CASH' ? 'Cash' : s.paymentMethod === 'UPI' ? 'Bank Account' : (s.customerName || 'Sundry Debtors');

      xmlVouchers += `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>${tallyDate}</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${s.invoiceNumber}</VOUCHERNUMBER>
          <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
          <NARRATION>KadaiVoice AI Bill ${s.invoiceNumber} - ${s.items.length} items</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${ledgerName}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-${s.total}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Sales Account</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>${s.total}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>`;
    });

    const fullTallyXML = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${shop.name}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${xmlVouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="Tally_${shop.name.replace(/\s+/g, '_')}_Sales.xml"`);
    return res.status(200).send(fullTallyXML);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Export GST Data with Tax Slabs Bifurcation (GSTR-1 JSON Format)
// @route GET /api/reports/gst-export
exports.exportGSTJSON = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId);
    const { startDate, endDate } = req.query;

    const filter = { shop: req.shopId, isReversed: false };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = e;
      }
    }

    const sales = await Sale.find(filter).populate('items.product');

    // Bifurcate by official GST Slabs: 0%, 5%, 12%, 18%
    const slabSummary = {
      '0%': { rate: 0, taxableValue: 0, cgst: 0, sgst: 0, totalInvoiceValue: 0, description: 'Exempted Food Grains, Raw Milk & Atta' },
      '5%': { rate: 5, taxableValue: 0, cgst: 0, sgst: 0, totalInvoiceValue: 0, description: 'Edible Cooking Oils, Sugar, Tea & Spices' },
      '12%': { rate: 12, taxableValue: 0, cgst: 0, sgst: 0, totalInvoiceValue: 0, description: 'Pure Ghee & Processed Butter' },
      '18%': { rate: 18, taxableValue: 0, cgst: 0, sgst: 0, totalInvoiceValue: 0, description: 'Personal Care, Detergents, Soaps & Cleaning' },
    };

    let totalTurnover = 0;

    sales.forEach((s) => {
      totalTurnover += s.total;

      s.items.forEach((item) => {
        const rate = getGSTRate(item.product?.category || '', item.productName);
        const slabKey = `${rate}%`;

        // Taxable value = Total / (1 + rate/100)
        const itemTotal = item.totalPrice || 0;
        const taxable = Math.round((itemTotal / (1 + rate / 100)) * 100) / 100;
        const taxAmount = Math.round((itemTotal - taxable) * 100) / 100;
        const halfTax = Math.round((taxAmount / 2) * 100) / 100;

        if (slabSummary[slabKey]) {
          slabSummary[slabKey].taxableValue = Math.round((slabSummary[slabKey].taxableValue + taxable) * 100) / 100;
          slabSummary[slabKey].cgst = Math.round((slabSummary[slabKey].cgst + halfTax) * 100) / 100;
          slabSummary[slabKey].sgst = Math.round((slabSummary[slabKey].sgst + halfTax) * 100) / 100;
          slabSummary[slabKey].totalInvoiceValue = Math.round((slabSummary[slabKey].totalInvoiceValue + itemTotal) * 100) / 100;
        }
      });
    });

    const gstReturnData = {
      gstin: shop.gstin || '33AAAAA0000A1Z5',
      legalName: shop.name,
      tradeName: shop.name,
      period: new Date().toISOString().slice(0, 7),
      grossTurnover: Math.round(totalTurnover * 100) / 100,
      totalInvoicesCount: sales.length,
      b2cs: Object.entries(slabSummary).map(([slab, data]) => ({
        taxRate: data.rate,
        slabCategory: data.description,
        taxableValue: data.taxableValue,
        centralTax: data.cgst,
        stateTax: data.sgst,
        totalValue: data.totalInvoiceValue,
      })),
      complianceNotes: 'Generated by KadaiVoice AI with automatic HSN/SAC rate mapping for Indian Kirana stores.',
    };

    return res.status(200).json({
      success: true,
      gstReturnData,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
