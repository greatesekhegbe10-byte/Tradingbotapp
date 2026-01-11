
/**
 * NEXUS AI - BACKEND PAYMENT GATEWAY (NODE.JS / EXPRESS)
 * Deployment: Deploy this as a separate web service on Render/Heroku.
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// KEYS - USE ENVIRONMENT VARIABLES FOR PRODUCTION
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';

/**
 * 1. INITIATE PAYMENT
 * Called by Flutter/React frontend to get a payment URL
 */
app.post('/api/payments/initiate', async (req, res) => {
  const { email, amount, tier, userId } = req.body;
  
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo/cents
        currency: 'NGN',
        callback_url: 'https://your-frontend-url.com/payment-callback',
        metadata: {
          userId,
          tier,
          custom_fields: [{ display_name: "Tier", variable_name: "tier", value: tier }]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate payment', details: error.message });
  }
});

/**
 * 2. VERIFY PAYMENT
 * Called by frontend to confirm success
 */
app.get('/api/payments/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      }
    );

    const { status, data } = response.data;

    if (status && data.status === 'success') {
      // Logic to update user tier in your DB here
      // updateUserTier(data.metadata.userId, data.metadata.tier);
      res.json({ success: true, tier: data.metadata.tier });
    } else {
      res.json({ success: false, message: 'Payment not successful' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * 3. WEBHOOK HANDLER
 * Paystack sends POST requests here for every event
 */
app.post('/api/payments/webhook', (req, res) => {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  
  if (hash === req.headers['x-paystack-signature']) {
    const event = req.body;
    if (event.event === 'charge.success') {
      // UNLOCK USER TIER AUTOMATICALLY
      const { userId, tier } = event.data.metadata;
      console.log(`UNLOCKING ${tier} FOR USER ${userId}`);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Payment Server Active on port ${PORT}`));
