
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const CONFIG = {
  PAYSTACK_SECRET: process.env.PAYSTACK_SECRET_KEY,
  FLW_SECRET: process.env.FLUTTERWAVE_SECRET_KEY,
  FLW_HASH: process.env.FLUTTERWAVE_SECRET_HASH,
  VPS_URL: process.env.VPS_TRADING_NODE_URL,
  BRIDGE_TOKEN: process.env.INTERNAL_AUTH_TOKEN || 'NX-SECURE-BRIDGE-TOKEN-2025'
};

// --- PAYMENT ENDPOINTS ---
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, tier, userId } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email, amount: Math.round(amount * 1600 * 100), 
      metadata: { userId, tier },
      callback_url: `${req.headers.origin}/?status=success`
    }, {
      headers: { Authorization: `Bearer ${CONFIG.PAYSTACK_SECRET}` }
    });
    res.json({ success: true, checkoutUrl: response.data.data.authorization_url });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// --- TRADING BRIDGE (PROXY TO VPS) ---
// This ensures frontend only talks to SaaS, and SaaS talks to VPS over secure line
app.post('/api/trading/execute', async (req, res) => {
  try {
    const response = await axios.post(`${CONFIG.VPS_URL}/execute`, req.body, {
      headers: { 'Authorization': `Bearer ${CONFIG.BRIDGE_TOKEN}` }
    });
    res.json(response.data);
  } catch (e) {
    // If VPS is not set up yet, fallback to simulation
    res.json({ success: true, mode: 'SIMULATION', message: 'VPS Node Offline - Executing via SaaS Hub Simulation' });
  }
});

app.get('/api/node/health', async (req, res) => {
  try {
    const response = await axios.get(`${CONFIG.VPS_URL}/health`, { timeout: 2000 });
    res.json({ status: 'CONNECTED', ip: response.data.ip });
  } catch (e) {
    res.json({ status: 'DISCONNECTED', message: 'Check VPS Firewall/PM2' });
  }
});

// --- STATIC SERVING ---
app.use(express.static(path.join(__dirname, '.')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[SAAS HUB] Active on Port ${PORT}`));
