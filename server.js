require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

/**
 * STARTUP VALIDATION
 * Checks for required environment variables for payment gateways.
 */
const verifyEnv = () => {
  const required = ['PAYSTACK_SECRET_KEY', 'FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_SECRET_HASH'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}. Webhooks and Payments may fail in production.`);
  }
};
verifyEnv();

const CONFIG = {
  PAYSTACK_SECRET: process.env.PAYSTACK_SECRET_KEY,
  FLW_SECRET: process.env.FLUTTERWAVE_SECRET_KEY,
  FLW_HASH: process.env.FLUTTERWAVE_SECRET_HASH
};

const app = express();
app.use(express.json());
app.use(cors());

// --- API ENDPOINTS ---

app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, tier, userId } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: Math.round(amount * 1600 * 100), 
      metadata: { userId, tier },
      callback_url: `${req.headers.origin}/?status=success`
    }, {
      headers: {
        Authorization: `Bearer ${CONFIG.PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ success: true, checkoutUrl: response.data.data.authorization_url, reference: response.data.data.reference });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data?.message || e.message });
  }
});

app.post('/api/flutterwave/initialize', async (req, res) => {
  const { email, amount, tier, userId, name } = req.body;
  const tx_ref = `NX-FLW-${Date.now()}-${userId}`;
  try {
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref, amount, currency: "USD",
      redirect_url: `${req.headers.origin}/?status=success`,
      meta: { userId, tier },
      customer: { email, name },
      customizations: { title: "NexusTrade AI License", description: `Grade: ${tier} Node Provisioning` }
    }, {
      headers: {
        Authorization: `Bearer ${CONFIG.FLW_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ success: true, checkoutUrl: response.data.data.link, reference: tx_ref });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data?.message || e.message });
  }
});

// --- WEBHOOKS ---
app.post('/api/webhooks/paystack', (req, res) => {
  const hash = crypto.createHmac('sha512', CONFIG.PAYSTACK_SECRET || '').update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid');
  res.sendStatus(200);
});

app.post('/api/webhooks/flutterwave', (req, res) => {
  if (req.headers['verif-hash'] !== CONFIG.FLW_HASH) return res.status(401).send('Invalid');
  res.sendStatus(200);
});

// --- STATIC FRONTEND SERVING ---
app.use(express.static(path.join(__dirname, '.')));

// Handle SPA routing - send index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[SYSTEM] NexusTrade Production Node Active on Port ${PORT}`));