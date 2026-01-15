
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

/**
 * STARTUP VALIDATION
 * Crashes the process if critical infrastructure keys are missing.
 */
const verifyEnv = () => {
  const required = ['PAYSTACK_SECRET_KEY', 'FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_SECRET_HASH'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[CRITICAL] Shutdown: Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
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

// --- PAYSTACK INITIALIZATION ---
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, tier, userId } = req.body;
  
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: Math.round(amount * 1600 * 100), // Convert USD to NGN Kobo (Example rate)
      metadata: { userId, tier },
      callback_url: `${req.headers.origin}/dashboard?status=success`
    }, {
      headers: {
        Authorization: `Bearer ${CONFIG.PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    // RETURN ONLY - DO NOT REDIRECT
    res.json({
      success: true,
      checkoutUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (e) {
    console.error(`[ERROR] Paystack Init Failed for ${userId}:`, e.response?.data?.message || e.message);
    res.status(400).json({ success: false, error: 'Gateway Handshake Rejected' });
  }
});

// --- FLUTTERWAVE INITIALIZATION ---
app.post('/api/flutterwave/initialize', async (req, res) => {
  const { email, amount, tier, userId, name } = req.body;
  
  const tx_ref = `NX-FLW-${Date.now()}-${userId}`;

  try {
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref,
      amount,
      currency: "USD",
      redirect_url: `${req.headers.origin}/dashboard?status=success`,
      meta: { userId, tier },
      customer: { email, name },
      customizations: {
        title: "NexusTrade AI License",
        description: `Grade: ${tier} Node Provisioning`,
        logo: "https://nexustrade.ai/logo.png"
      }
    }, {
      headers: {
        Authorization: `Bearer ${CONFIG.FLW_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    // RETURN ONLY - DO NOT REDIRECT
    res.json({
      success: true,
      checkoutUrl: response.data.data.link,
      reference: tx_ref
    });
  } catch (e) {
    console.error(`[ERROR] Flutterwave Init Failed for ${userId}:`, e.response?.data?.message || e.message);
    res.status(400).json({ success: false, error: 'Gateway Handshake Rejected' });
  }
});

// --- WEBHOOKS (SECURE AUTHENTICATORS) ---

app.post('/api/webhooks/paystack', (req, res) => {
  const hash = crypto.createHmac('sha512', CONFIG.PAYSTACK_SECRET)
                     .update(JSON.stringify(req.body))
                     .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid Signature');
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const { userId, tier } = event.data.metadata;
    console.log(`[PROVISION] Paystack Verified: Node ${userId} -> ${tier}`);
    // Database logic: User.findByIdAndUpdate(userId, { tier: tier })
  }

  res.sendStatus(200);
});

app.post('/api/webhooks/flutterwave', (req, res) => {
  const signature = req.headers['verif-hash'];
  if (!signature || signature !== CONFIG.FLW_HASH) {
    return res.status(401).send('Invalid Hash');
  }

  const payload = req.body;
  if (payload.status === 'successful') {
    const { userId, tier } = payload.meta;
    console.log(`[PROVISION] Flutterwave Verified: Node ${userId} -> ${tier}`);
    // Database logic: User.findByIdAndUpdate(userId, { tier: tier })
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[SYSTEM] Gateway Cluster v7.2 Active on Port ${PORT}`));
