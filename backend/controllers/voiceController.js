const gnaniPrisma = require('../services/gnaniPrisma');
const gnaniEvon = require('../services/gnaniEvon');
const gnaniTimbre = require('../services/gnaniTimbre');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const CreditTransaction = require('../models/CreditTransaction');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');

// @desc Transcribe audio via Gnani Prisma
// @route POST /api/voice/transcribe
exports.transcribeAudio = async (req, res) => {
  try {
    const languageCode = req.body.languageCode || 'ta-IN';
    const fallbackText = req.body.fallbackText || '';

    let audioBuffer = null;
    let filename = 'voice_command.webm';

    if (req.file) {
      audioBuffer = req.file.buffer || req.file.path;
      filename = req.file.originalname || filename;
    }

    const result = await gnaniPrisma.transcribe({
      audio: audioBuffer,
      languageCode,
      filename,
      fallbackText,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('STT Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to transcribe audio.',
      error: err.message,
    });
  }
};

// @desc Interpret transcript and extract structured transaction intent via Gnani Evon
// @route POST /api/voice/interpret
exports.interpretCommand = async (req, res) => {
  try {
    const { transcript, languageCode = 'ta-IN' } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, message: 'Transcript cannot be empty.' });
    }

    // Fetch shop catalog & customer list for context
    const products = await Product.find({ shop: req.shopId, isActive: true });
    const customers = await Customer.find({ shop: req.shopId });

    // Call Gnani Evon
    const extraction = await gnaniEvon.interpret({
      transcript,
      products,
      customers,
    });

    // Match extracted items against database to calculate verified pricing and stock availability
    const verifiedItems = [];
    let estimatedTotal = 0;
    const warnings = [];

    if (extraction.items && Array.isArray(extraction.items)) {
      for (const item of extraction.items) {
        // Find closest match in catalog
        const product = products.find(p =>
          p.name.toLowerCase() === item.productName.toLowerCase() ||
          p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
          item.productName.toLowerCase().includes(p.name.toLowerCase()) ||
          (p.nameTamil && item.productName.includes(p.nameTamil))
        );

        if (product) {
          const qty = item.quantity || 1;
          const unitPrice = product.sellingPrice;
          const lineTotal = Math.round(qty * unitPrice * 100) / 100;
          estimatedTotal += lineTotal;

          const stockWarning = product.currentStock < qty
            ? `Low stock: Only ${product.currentStock} ${product.unit} available in shop.`
            : null;

          if (stockWarning) {
            warnings.push(stockWarning);
          }

          verifiedItems.push({
            productId: product._id,
            productName: product.name,
            matchedCatalog: true,
            quantity: qty,
            unit: product.unit || item.unit,
            unitPrice,
            totalPrice: lineTotal,
            currentStock: product.currentStock,
            warning: stockWarning,
          });
        } else {
          // Unmatched product
          warnings.push(`"${item.productName}" is not registered in your catalog. Please review before confirming.`);
          verifiedItems.push({
            productId: null,
            productName: item.productName,
            matchedCatalog: false,
            quantity: item.quantity || 1,
            unit: item.unit || 'unit',
            unitPrice: 0,
            totalPrice: 0,
            currentStock: 0,
            warning: 'Unmatched item',
          });
        }
      }
    }

    // If CREATE_CREDIT has explicit amount, use it
    if (extraction.intent === 'CREATE_CREDIT' && extraction.creditAmount) {
      estimatedTotal = extraction.creditAmount;
    }

    // Generate natural voice response summary in shop language
    let spokenResponseText = '';
    const shop = await Shop.findById(req.shopId);
    const lang = languageCode || shop.preferredLanguage || 'ta-en';

    if (extraction.intent === 'CREATE_SALE') {
      const itemsBrief = verifiedItems.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ');
      if (lang.includes('ta')) {
        spokenResponseText = `${itemsBrief} விற்பனை தயார். மொத்த மதிப்பு ரூபாய் ${Math.round(estimatedTotal)}. உறுதி செய்யவா?`;
      } else {
        spokenResponseText = `Ready to record sale of ${itemsBrief}. Total amount is ₹${Math.round(estimatedTotal)}. Please confirm.`;
      }
    } else if (extraction.intent === 'ADD_STOCK') {
      const itemsBrief = verifiedItems.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ');
      spokenResponseText = lang.includes('ta')
        ? `${itemsBrief} இருப்பு சேர்க்க தயாராக உள்ளது. உறுதி செய்யவா?`
        : `Ready to add ${itemsBrief} to inventory. Please confirm.`;
    } else if (extraction.intent === 'CREATE_CREDIT') {
      spokenResponseText = lang.includes('ta')
        ? `${extraction.customerName || 'வாடிக்கையாளர்'} பெயரில் ரூபாய் ${Math.round(estimatedTotal)} கடன் பதிவு செய்யவா?`
        : `Record ₹${Math.round(estimatedTotal)} credit for ${extraction.customerName || 'Customer'}? Please confirm.`;
    } else if (extraction.intent === 'DAILY_REPORT') {
      spokenResponseText = lang.includes('ta')
        ? `இன்றைய வணிக அறிக்கையை திரையில் பார்க்கவும்.`
        : `Showing today's daily business report on your screen.`;
    } else if (extraction.intent === 'TOP_SELLING_PRODUCTS') {
      spokenResponseText = lang.includes('ta')
        ? `அதிக விற்பனையான பொருட்கள் திரையில் காட்டப்படுகின்றன.`
        : `Displaying top selling products.`;
    } else if (extraction.intent === 'LOW_STOCK_REPORT') {
      spokenResponseText = lang.includes('ta')
        ? `குறைந்த இருப்பு உள்ள பொருட்கள் எச்சரிக்கை திரையில் உள்ளது.`
        : `Displaying products running low on stock.`;
    } else {
      spokenResponseText = `Command recognized: ${extraction.summary || 'Ready'}.`;
    }

    return res.status(200).json({
      success: true,
      transcript,
      extraction: {
        ...extraction,
        verifiedItems,
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        warnings,
        spokenResponseText,
      },
    });
  } catch (err) {
    console.error('NLU Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Confirm and execute voice transaction safely
// @route POST /api/voice/confirm
exports.confirmVoiceTransaction = async (req, res) => {
  try {
    const {
      intent,
      items,
      paymentMethod = 'CASH',
      customerName,
      creditAmount,
      transcript,
    } = req.body;

    if (!intent) {
      return res.status(400).json({ success: false, message: 'Intent is required to confirm transaction.' });
    }

    const shop = await Shop.findById(req.shopId);

    // 1. CONFIRM SALE
    if (intent === 'CREATE_SALE') {
      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cannot confirm empty sale.' });
      }

      let subtotal = 0;
      let costOfGoodsSold = 0;
      const saleItems = [];

      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, shop: req.shopId });
        if (!product) {
          return res.status(400).json({ success: false, message: `Product ${item.productName} not found.` });
        }

        const qty = parseFloat(item.quantity) || 1;
        if (product.currentStock < qty && !shop.allowNegativeInventory) {
          return res.status(400).json({
            success: false,
            message: `Cannot confirm: insufficient stock for ${product.name} (have ${product.currentStock}, need ${qty}).`,
          });
        }

        const unitPrice = item.unitPrice || product.sellingPrice;
        const lineTotal = Math.round(qty * unitPrice * 100) / 100;
        const lineCost = Math.round(qty * (product.purchasePrice || 0) * 100) / 100;

        subtotal += lineTotal;
        costOfGoodsSold += lineCost;

        saleItems.push({
          product: product._id,
          productName: product.name,
          quantity: qty,
          unit: product.unit,
          unitPrice,
          purchasePrice: product.purchasePrice || 0,
          totalPrice: lineTotal,
        });

        // Decrement stock
        const balanceBefore = product.currentStock;
        const balanceAfter = balanceBefore - qty;
        product.currentStock = balanceAfter;
        await product.save();

        await StockMovement.create({
          shop: req.shopId,
          product: product._id,
          productName: product.name,
          type: 'SALE',
          quantity: -qty,
          balanceBefore,
          balanceAfter,
          referenceType: 'VoiceCommand',
          reason: 'Voice-assisted Sale',
          performedBy: req.user ? req.user.name : 'Voice Assistant',
        });
      }

      // Generate Invoice
      const countToday = await Sale.countDocuments({
        shop: req.shopId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      });
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

      const sale = await Sale.create({
        shop: req.shopId,
        invoiceNumber,
        customerName: customerName || 'Walk-in Customer',
        items: saleItems,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        costOfGoodsSold,
        grossProfit: Math.round((subtotal - costOfGoodsSold) * 100) / 100,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
        voiceCommandOrigin: true,
        voiceTranscript: transcript || '',
      });

      // Voice TTS feedback
      const spokenConfirmation = `விற்பனை எண் ${invoiceNumber} வெற்றிகரமாக பதிவு செய்யப்பட்டது. மொத்த தொகை ரூபாய் ${Math.round(subtotal)}.`;

      return res.status(201).json({
        success: true,
        message: `Sale ${invoiceNumber} confirmed successfully via voice!`,
        transaction: sale,
        spokenConfirmation,
      });
    }

    // 2. CONFIRM ADD STOCK
    if (intent === 'ADD_STOCK') {
      const updatedProducts = [];
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, shop: req.shopId });
        if (!product) continue;

        const qty = parseFloat(item.quantity) || 1;
        const balanceBefore = product.currentStock;
        const balanceAfter = balanceBefore + qty;
        product.currentStock = balanceAfter;
        await product.save();

        await StockMovement.create({
          shop: req.shopId,
          product: product._id,
          productName: product.name,
          type: 'ADJUSTMENT_IN',
          quantity: qty,
          balanceBefore,
          balanceAfter,
          referenceType: 'VoiceCommand',
          reason: 'Voice Stock In',
          performedBy: req.user ? req.user.name : 'Voice Assistant',
        });
        updatedProducts.push(product);
      }

      return res.status(200).json({
        success: true,
        message: `Stock updated for ${updatedProducts.length} items!`,
        spokenConfirmation: `சரக்கு இருப்பு வெற்றிகரமாக புதுப்பிக்கப்பட்டது.`,
        products: updatedProducts,
      });
    }

    // 3. CONFIRM CREDIT
    if (intent === 'CREATE_CREDIT') {
      let customer = await Customer.findOne({
        shop: req.shopId,
        name: { $regex: new RegExp(`^${(customerName || 'Customer').trim()}$`, 'i') },
      });

      if (!customer) {
        customer = await Customer.create({
          shop: req.shopId,
          name: customerName || 'Valued Customer',
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          outstandingCredit: 0,
        });
      }

      const amount = parseFloat(creditAmount) || 0;
      const balanceBefore = customer.outstandingCredit || 0;
      const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;

      customer.outstandingCredit = balanceAfter;
      customer.totalPurchases = (customer.totalPurchases || 0) + amount;
      await customer.save();

      const transaction = await CreditTransaction.create({
        shop: req.shopId,
        customer: customer._id,
        type: 'CREDIT_SALE',
        amount,
        paymentMethod: 'CASH',
        balanceBefore,
        balanceAfter,
        notes: `Voice credit: ${transcript || ''}`,
      });

      return res.status(200).json({
        success: true,
        message: `Credit of ₹${amount} recorded for ${customer.name}.`,
        spokenConfirmation: `${customer.name} கணக்கில் ரூபாய் ${amount} கடன் பதிவு செய்யப்பட்டது. மீதமுள்ள கடன் ரூபாய் ${balanceAfter}.`,
        transaction,
        customer,
      });
    }

    return res.status(400).json({ success: false, message: `Unsupported intent for confirmation: ${intent}` });
  } catch (err) {
    console.error('Confirmation Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Synthesize spoken response via Gnani Timbre
// @route POST /api/voice/speak
exports.synthesizeSpeech = async (req, res) => {
  try {
    const { text, language = 'ta-IN', voice = 'Kavya' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required for TTS synthesis.' });
    }

    const result = await gnaniTimbre.speak({ text, language, voice });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get Gnani AI configuration & connectivity status
// @route GET /api/voice/status
exports.getAIStatus = async (req, res) => {
  return res.status(200).json({
    success: true,
    gnani: {
      isConfigured: gnaniPrisma.isConfigured() && gnaniTimbre.isConfigured(),
      prismaSTT: {
        configured: gnaniPrisma.isConfigured(),
        endpoint: gnaniPrisma.endpoint,
        models: ['prisma-v3.0', 'prisma-v2.5'],
        supportedLanguages: ['Tamil (ta-IN)', 'English (en-IN)', 'Hindi (hi-IN)', 'Tanglish'],
      },
      evonLLM: {
        configured: gnaniEvon.isConfigured(),
        endpoint: gnaniEvon.endpoint || 'Built-in Indic NLU (Local Hybrid)',
        model: 'evon-v3.3',
      },
      timbreTTS: {
        configured: gnaniTimbre.isConfigured(),
        endpoint: gnaniTimbre.endpoint,
        models: ['timbre-v2.5', 'timbre-v3.0'],
        voices: ['Kavya', 'Pranav'],
      },
      activeMode: gnaniPrisma.isConfigured() ? 'LIVE_GNANI_AI' : 'MOCK_DEMO_SIMULATION',
      description: gnaniPrisma.isConfigured()
        ? 'Connected to official Gnani.ai API (api.vachana.ai).'
        : 'Running in explicitly labelled demonstration mode. Add GNANI_API_KEY in backend .env to enable live cloud inference.',
    },
  });
};

