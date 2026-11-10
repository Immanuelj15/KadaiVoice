const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const CreditTransaction = require('../models/CreditTransaction');
const StockMovement = require('../models/StockMovement');
const Expense = require('../models/Expense');
const Shop = require('../models/Shop');

const sampleProducts = [
  { name: 'Ponni Boiled Rice', nameTamil: 'பொன்னி புழுங்கல் அரிசி', category: 'Groceries & Grains', purchasePrice: 52, sellingPrice: 60, currentStock: 45, unit: 'kg', minStockLevel: 15, supplier: 'Thanjavur Agro Mills' },
  { name: 'Aavin Green Magic Milk', nameTamil: 'ஆவின் பால் பாக்கெட்', category: 'Dairy & Eggs', purchasePrice: 22, sellingPrice: 25, currentStock: 4, unit: 'packet', minStockLevel: 10, supplier: 'Aavin Co-op Depot' }, // Low stock
  { name: 'Gold Winner Sunflower Oil', nameTamil: 'சன்ஃபிளவர் எண்ணெய்', category: 'Cooking Oil & Ghee', purchasePrice: 135, sellingPrice: 150, currentStock: 18, unit: 'liter', minStockLevel: 8, supplier: 'Kaleesuwari Refinery' },
  { name: 'Toor Dal (First Quality)', nameTamil: 'துவரம் பருப்பு', category: 'Groceries & Grains', purchasePrice: 140, sellingPrice: 160, currentStock: 25, unit: 'kg', minStockLevel: 10, supplier: 'Madurai Traders' },
  { name: 'Fresh Farm Eggs', nameTamil: 'பண்ணை முட்டை', category: 'Dairy & Eggs', purchasePrice: 5.5, sellingPrice: 7, currentStock: 60, unit: 'piece', minStockLevel: 20, supplier: 'Namakkal Poultry' },
  { name: 'Aashirvaad Shudh Chakki Atta', nameTamil: 'ஆஷிர்வாத் கோதுமை மாவு', category: 'Groceries & Grains', purchasePrice: 210, sellingPrice: 235, currentStock: 12, unit: 'packet', minStockLevel: 5, supplier: 'ITC Distributor' },
  { name: 'Tata Iodized Salt', nameTamil: 'டாடா உப்பு', category: 'Groceries & Grains', purchasePrice: 22, sellingPrice: 28, currentStock: 35, unit: 'packet', minStockLevel: 10, supplier: 'Tata Consumer' },
  { name: 'Sugar (Fine White)', nameTamil: 'சர்க்கரை', category: 'Groceries & Grains', purchasePrice: 40, sellingPrice: 46, currentStock: 50, unit: 'kg', minStockLevel: 20, supplier: 'EID Parry Depot' },
  { name: '3 Roses Dust Tea', nameTamil: '3 ரோசஸ் டீ தூள்', category: 'Snacks & Beverages', purchasePrice: 140, sellingPrice: 160, currentStock: 14, unit: 'packet', minStockLevel: 6, supplier: 'Hindustan Unilever' },
  { name: 'Bru Instant Coffee 50g', nameTamil: 'ப்ரூ காபி தூள்', category: 'Snacks & Beverages', purchasePrice: 90, sellingPrice: 105, currentStock: 3, unit: 'packet', minStockLevel: 8, supplier: 'Hindustan Unilever' }, // Low stock
  { name: 'Achi Sambar Powder 100g', nameTamil: 'ஆச்சி சாம்பார் பொடி', category: 'Spices & Masalas', purchasePrice: 32, sellingPrice: 40, currentStock: 22, unit: 'packet', minStockLevel: 8, supplier: 'Aachi Spices' },
  { name: 'GRB Pure Cow Ghee 500ml', nameTamil: 'ஜிஆர்பி நெய்', category: 'Cooking Oil & Ghee', purchasePrice: 320, sellingPrice: 360, currentStock: 8, unit: 'can', minStockLevel: 4, supplier: 'GRB Dairy Foods' },
  { name: 'Hamam Neem Soap 100g', nameTamil: 'ஹமாம் சோப்', category: 'Personal Care', purchasePrice: 36, sellingPrice: 45, currentStock: 2, unit: 'piece', minStockLevel: 10, supplier: 'HUL Agency' }, // Low stock
  { name: 'Surf Excel Quick Wash 1kg', nameTamil: 'சர்ப் எக்செல்', category: 'Household & Cleaning', purchasePrice: 130, sellingPrice: 145, currentStock: 15, unit: 'packet', minStockLevel: 5, supplier: 'HUL Agency' },
  { name: 'Vim Dishwash Bar 200g', nameTamil: 'விம் சோப்பு பார்', category: 'Household & Cleaning', purchasePrice: 18, sellingPrice: 22, currentStock: 28, unit: 'piece', minStockLevel: 10, supplier: 'HUL Agency' },
  { name: 'Parle-G Gold Biscuits', nameTamil: 'பார்லே-ஜி பிஸ்கட்', category: 'Snacks & Beverages', purchasePrice: 8, sellingPrice: 10, currentStock: 40, unit: 'packet', minStockLevel: 15, supplier: 'Parle Products' },
  { name: 'Urad Dal (Gundu)', nameTamil: 'உளுந்தம் பருப்பு', category: 'Groceries & Grains', purchasePrice: 125, sellingPrice: 145, currentStock: 30, unit: 'kg', minStockLevel: 10, supplier: 'Madurai Traders' },
  { name: 'Everest Turmeric Powder 100g', nameTamil: 'மஞ்சள் தூள்', category: 'Spices & Masalas', purchasePrice: 28, sellingPrice: 35, currentStock: 16, unit: 'packet', minStockLevel: 6, supplier: 'Everest Spices' },
  { name: 'Clinic Plus Strong Health Shampoo 80ml', nameTamil: 'கிளினிக் பிளஸ் ஷாம்பூ', category: 'Personal Care', purchasePrice: 45, sellingPrice: 55, currentStock: 18, unit: 'packet', minStockLevel: 5, supplier: 'HUL Agency' },
  { name: 'Red Small Onions (Chinna Vengayam)', nameTamil: 'சின்ன வெங்காயம்', category: 'Groceries & Grains', purchasePrice: 48, sellingPrice: 65, currentStock: 20, unit: 'kg', minStockLevel: 8, supplier: 'Koyambedu Wholesale Market' },
];

const sampleCustomers = [
  { name: 'Ramesh Sundaram', phone: '9840123456', address: 'No. 12, South Mada Street', outstandingCredit: 1000, creditLimit: 5000 },
  { name: 'Suresh Kumar', phone: '9840234567', address: 'Plot 4, Pillayar Kovil St', outstandingCredit: 750, creditLimit: 4000 },
  { name: 'Karthik Raja', phone: '9840345678', address: 'Door 8, Gandhi Road', outstandingCredit: 0, creditLimit: 5000 },
  { name: 'Selvi Anbazhagan', phone: '9840456789', address: '24/1, Bazaar Lane', outstandingCredit: 1250, creditLimit: 3000 },
  { name: 'Muruganandam P', phone: '9840567890', address: '15, Anna Nagar 2nd St', outstandingCredit: 450, creditLimit: 5000 },
  { name: 'Priya Venkatesh', phone: '9840678901', address: '88, Lake View Colony', outstandingCredit: 0, creditLimit: 6000 },
  { name: 'Anand Mohan', phone: '9840789012', address: '7, Temple Street', outstandingCredit: 820, creditLimit: 4000 },
  { name: 'Mani Maran', phone: '9840890123', address: '31, Post Office Road', outstandingCredit: 0, creditLimit: 3500 },
  { name: 'Vijay Anand', phone: '9840901234', address: '19, Station Road', outstandingCredit: 1500, creditLimit: 5000 },
  { name: 'Lakshmi Narayanan', phone: '9840012345', address: '55, Main Road, Market Area', outstandingCredit: 300, creditLimit: 5000 },
];

async function seedDemoData(shopId, userId = null) {
  console.log(`[Seed] Populating realistic demo data for shop ${shopId}...`);

  // Clear existing transactions for fresh demo
  await Product.deleteMany({ shop: shopId });
  await Customer.deleteMany({ shop: shopId });
  await Sale.deleteMany({ shop: shopId });
  await CreditTransaction.deleteMany({ shop: shopId });
  await StockMovement.deleteMany({ shop: shopId });
  await Expense.deleteMany({ shop: shopId });

  // 1. Insert 20 products
  const createdProducts = [];
  for (const item of sampleProducts) {
    const prod = await Product.create({
      shop: shopId,
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      ...item,
    });
    createdProducts.push(prod);

    // Initial movement
    await StockMovement.create({
      shop: shopId,
      product: prod._id,
      productName: prod.name,
      type: 'INITIAL_STOCK',
      quantity: prod.currentStock,
      balanceBefore: 0,
      balanceAfter: prod.currentStock,
      referenceType: 'Manual',
      reason: 'Opening stock demo initialization',
      performedBy: 'System Seeder',
    });
  }

  // 2. Insert 10 customers
  const createdCustomers = [];
  for (const c of sampleCustomers) {
    const cust = await Customer.create({
      shop: shopId,
      ...c,
      totalPurchases: c.outstandingCredit > 0 ? c.outstandingCredit * 3 : 2400,
    });
    createdCustomers.push(cust);

    // If customer has credit, record initial credit transaction
    if (c.outstandingCredit > 0) {
      await CreditTransaction.create({
        shop: shopId,
        customer: cust._id,
        type: 'CREDIT_SALE',
        amount: c.outstandingCredit,
        paymentMethod: 'CASH',
        balanceBefore: 0,
        balanceAfter: c.outstandingCredit,
        notes: 'Opening credit ledger balance',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // 3. Create realistic sample sales spanning past 5 days
  const paymentModes = ['CASH', 'UPI', 'CASH', 'UPI', 'CREDIT'];
  const dates = [4, 3, 2, 1, 0]; // days ago

  let invoiceSeq = 100;
  for (const dayOffset of dates) {
    const txDate = new Date();
    txDate.setDate(txDate.getDate() - dayOffset);

    // 3 to 6 sales per day
    const salesCount = dayOffset === 0 ? 5 : 4;
    for (let s = 0; s < salesCount; s++) {
      invoiceSeq++;
      const pMode = paymentModes[s % paymentModes.length];
      const cust = pMode === 'CREDIT' ? createdCustomers[s % createdCustomers.length] : null;

      // Pick 2-3 random products
      const p1 = createdProducts[(s * 3) % createdProducts.length];
      const p2 = createdProducts[(s * 3 + 1) % createdProducts.length];
      const items = [
        {
          product: p1._id,
          productName: p1.name,
          quantity: 2,
          unit: p1.unit,
          unitPrice: p1.sellingPrice,
          purchasePrice: p1.purchasePrice,
          totalPrice: 2 * p1.sellingPrice,
        },
        {
          product: p2._id,
          productName: p2.name,
          quantity: 1,
          unit: p2.unit,
          unitPrice: p2.sellingPrice,
          purchasePrice: p2.purchasePrice,
          totalPrice: 1 * p2.sellingPrice,
        },
      ];

      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const cogs = items.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0);
      const grossProfit = subtotal - cogs;

      const saleCreatedAt = new Date(txDate);
      saleCreatedAt.setHours(9 + s * 2, 15 + s * 7, 0);

      await Sale.create({
        shop: shopId,
        invoiceNumber: `INV-2026-${invoiceSeq}`,
        customer: cust ? cust._id : null,
        customerName: cust ? cust.name : 'Walk-in Customer',
        items,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        costOfGoodsSold: cogs,
        grossProfit,
        paymentMethod: pMode,
        paymentStatus: pMode === 'CREDIT' ? 'PENDING' : 'PAID',
        voiceCommandOrigin: s % 2 === 0,
        voiceTranscript: s % 2 === 0 ? `Sold 2 ${p1.unit} ${p1.name} and 1 ${p2.unit} ${p2.name}` : '',
        createdAt: saleCreatedAt,
      });
    }
  }

  // 4. Sample Shop Expenses
  await Expense.create([
    { shop: shopId, title: 'Shop Electricity Bill', category: 'Electricity', amount: 850, paymentMethod: 'UPI' },
    { shop: shopId, title: 'Delivery & Helper Daily Wage', category: 'Salaries & Wages', amount: 500, paymentMethod: 'CASH' },
    { shop: shopId, title: 'Tea & Refreshments', category: 'Tea & Refreshments', amount: 120, paymentMethod: 'CASH' },
  ]);

  // Mark shop as configured
  await Shop.findByIdAndUpdate(shopId, {
    name: 'Immanuel Mini Mart',
    ownerName: 'Immanuel',
    isConfigured: true,
    isDemo: true,
  });

  return {
    productsCount: createdProducts.length,
    customersCount: createdCustomers.length,
    message: 'Demo store initialized with Immanuel Mini Mart profile!',
  };
}

module.exports = seedDemoData;

