
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

// --- TRADING BRIDGE (PROXY TO VPS) ---
app.post('/api/trading/execute', async (req, res) => {
  try {
    if (!CONFIG.VPS_URL || CONFIG.VPS_URL.includes('yourdomain.com')) {
      throw new Error('VPS Not Configured');
    }
    const response = await axios.post(`${CONFIG.VPS_URL}/execute`, req.body, {
      headers: { 'Authorization': `Bearer ${CONFIG.BRIDGE_TOKEN}` },
      timeout: 5000
    });
    res.json(response.data);
  } catch (e) {
    res.json({ 
      success: true, 
      mode: 'SIMULATION', 
      message: 'VPS Node Offline - Executing via SaaS Hub Simulation Fallback' 
    });
  }
});

app.get('/api/node/health', async (req, res) => {
  try {
    if (!CONFIG.VPS_URL || CONFIG.VPS_URL.includes('yourdomain.com')) {
      return res.json({ status: 'SIMULATED', message: 'Demo Mode Active' });
    }
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
app.listen(PORT, () => console.log(`[SAAS HUB] NexusNode Active on Port ${PORT}`));
