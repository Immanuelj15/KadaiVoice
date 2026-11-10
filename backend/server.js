require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key-ID'],
}));

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiting for security
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/credits', require('./routes/creditRoutes'));
app.use('/api/voice', require('./routes/voiceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'KadaiVoice AI Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

// Seed default demo user if needed
async function checkAndSeedDemo() {
  const User = require('./models/User');
  const Shop = require('./models/Shop');
  const bcrypt = require('bcryptjs');
  const seedDemoData = require('./utils/seedDemoData');

  const count = await User.countDocuments();
  if (count === 0) {
    console.log('[Init] No users found. Seeding initial demo store: "Immanuel Mini Mart"...');
    const demoShop = await Shop.create({
      name: 'Immanuel Mini Mart',
      ownerName: 'Immanuel',
      phone: '9840123456',
      address: {
        street: '14, Bazaar Main Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      },
      businessType: 'Kirana Store',
      preferredLanguage: 'ta-en',
      isConfigured: true,
      isDemo: true,
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const demoUser = await User.create({
      name: 'Immanuel',
      email: 'demo@kadaivoice.ai',
      phone: '9840123456',
      password: hashedPassword,
      role: 'owner',
      shop: demoShop._id,
      preferredLanguage: 'ta-en',
    });

    await seedDemoData(demoShop._id, demoUser._id);
    console.log('[Init] Demo store ready! Login: demo@kadaivoice.ai / admin123');
  }
}

// Start Server
async function startServer() {
  try {
    await connectDB();
    await checkAndSeedDemo();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` KadaiVoice AI Backend is running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start KadaiVoice backend:', err.message);
    process.exit(1);
  }
}

startServer();

