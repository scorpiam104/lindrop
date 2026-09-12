require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoose = require('mongoose');
const checkoutRoutes = require('./routes/checkoutRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const fulfillmentRoutes = require('./routes/fulfillmentRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const posRoutes = require('./routes/posRoutes');
const adRoutes = require('./routes/adRoutes');
const ogRoutes = require('./routes/ogRoutes');
const socialRoutes = require('./routes/socialRoutes');
const aiReelsRoutes = require('./routes/aiReelsRoutes');
const walletRoutes = require('./routes/walletRoutes');
const staffRoutes = require('./routes/staffRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const plusUpRoutes = require('./routes/plusUpRoutes');
const { verifyMetaWebhook } = require('./services/whatsappService');
const { startRecoveryScheduler } = require('./jobs/recoveryScheduler');

const app = express();
const port = process.env.PORT || 5000;
let databaseReady = false;
let recoverySchedulerStarted = false;

app.use(cors());
app.use(helmet());
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/paystack', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

app.get('/api/health', (req, res) => {
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    service: 'social-commerce-api',
    database: databaseReady ? 'connected' : 'unavailable'
  });
});

// Meta verifies the endpoint before the database necessarily has a connection.
app.get('/api/webhooks/whatsapp', verifyMetaWebhook);

function requireDatabase(req, res, next) {
  if (!databaseReady) return res.status(503).json({ message: 'Database unavailable. Check MongoDB Atlas connectivity.' });
  return next();
}

app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/merchants', requireDatabase, merchantRoutes);
app.use('/api/products', requireDatabase, productRoutes);
app.use('/api/checkout', requireDatabase, checkoutRoutes);
app.use('/api/orders', requireDatabase, orderRoutes);
app.use('/api/admin', requireDatabase, adminRoutes);
app.use('/api/assistant', requireDatabase, assistantRoutes);
app.use('/api/fulfillment', requireDatabase, fulfillmentRoutes);
app.use('/api/recovery', requireDatabase, recoveryRoutes);
app.use('/api/pos', requireDatabase, posRoutes);
app.use('/api/ads', requireDatabase, adRoutes);
app.use('/api/og', requireDatabase, ogRoutes);
app.use('/api/social', requireDatabase, socialRoutes);
app.use('/api/ai', requireDatabase, aiReelsRoutes);
app.use('/api/wallet', requireDatabase, walletRoutes);
app.use('/api/staff', requireDatabase, staffRoutes);
app.use('/api/analytics', requireDatabase, analyticsRoutes);
app.use('/api', requireDatabase, plusUpRoutes);

async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not configured. Add apps/backend/.env before starting database-backed features.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    databaseReady = true;
    console.log('Connected to MongoDB');
    if (!recoverySchedulerStarted) {
      startRecoveryScheduler();
      recoverySchedulerStarted = true;
    }
  } catch (error) {
    databaseReady = false;
    console.error(`MongoDB unavailable: ${error.message}`);
    setTimeout(connectDatabase, 15000).unref();
  }
}

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
  connectDatabase();
});

module.exports = app;
