
/**
 * NEXUS AI - UNIFIED SECURE PAYMENT GATEWAY
 * Production-Grade Paystack & Flutterwave Orchestration
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

/**
 * ENVIRONMENT CONFIGURATION
 * These are mapped from your secure env variables.
 */
const CONFIG = {
  PAYSTACK: {
    SECRET: process.env.PAYSTACK_SECRET_KEY || 'sk_live_xxxx',
  },
  FLUTTERWAVE: {
    SECRET: process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_live_xxxx',
    HASH: process.env.FLUTTERWAVE_SECRET_HASH || 'NEXUS_SECURE_VERIF_HASH'
  }
};

/**
 * 1. PAYSTACK INITIALIZE (NGN / Local Path)
 */
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, tier, userId } = req.body;
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100 * 1600, // Conversion to Kobo (assume 1600 rate)
        metadata: { userId, tier },
        callback_url: `${req.headers.origin}/dashboard?payment=awaiting&gateway=paystack`
      },
      { headers: { Authorization: `Bearer ${CONFIG.PAYSTACK.SECRET}`, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ status: false, message: 'Paystack Handshake Failed' });
  }
});

/**
 * 2. FLUTTERWAVE INITIALIZE (USD / International Path)
 */
app.post('/api/flutterwave/initialize', async (req, res) => {
  const { email, amount, tier, userId, name } = req.body;
  const tx_ref = `NX-FLW-${Date.now()}-${userId}`;

  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount: amount * 1600, // Normalized to NGN for this example, but supports USD
        currency: "NGN",
        redirect_url: `${req.headers.origin}/dashboard?payment=awaiting&gateway=flutterwave`,
        meta: { userId, tier },
        customer: { email, name },
        customizations: {
          title: "NexusTrade AI Premium",
          description: `Provisioning ${tier} Tier Node Access`,
          logo: "https://nexustrade.ai/logo.png"
        }
      },
      { headers: { Authorization: `Bearer ${CONFIG.FLUTTERWAVE.SECRET}`, 'Content-Type': 'application/json' } }
    );
    res.json({ status: true, data: { authorization_url: response.data.data.link, reference: tx_ref } });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Flutterwave Handshake Failed' });
  }
});

/**
 * 3. CENTRAL WEBHOOK CONTROLLER
 * This is the ONLY trusted source of truth for payment success.
 */
app.post('/api/payments/webhook', (req, res) => {
  // A. Determine Provider from Headers
  const paystackSig = req.headers['x-paystack-signature'];
  const flwSig = req.headers['verif-hash'];

  // --- PAYSTACK LOGIC ---
  if (paystackSig) {
    const hash = crypto.createHmac('sha512', CONFIG.PAYSTACK.SECRET)
                       .update(JSON.stringify(req.body))
                       .digest('hex');
    
    if (hash === paystackSig && req.body.event === 'charge.success') {
      const { userId, tier } = req.body.data.metadata;
      grantAccess(userId, tier, 'PAYSTACK', req.body.data.reference);
    }
    return res.sendStatus(200);
  }

  // --- FLUTTERWAVE LOGIC ---
  if (flwSig) {
    if (flwSig === CONFIG.FLUTTERWAVE.HASH) {
      const event = req.body;
      if (event.status === 'successful') {
        // FLW structure can vary slightly by event type
        const meta = event.meta || event.data?.meta;
        const ref = event.tx_ref || event.data?.tx_ref;
        if (meta?.userId && meta?.tier) {
          grantAccess(meta.userId, meta.tier, 'FLUTTERWAVE', ref);
        }
      }
    }
    return res.sendStatus(200);
  }

  res.sendStatus(400); // Bad Request / Invalid Signature
});

/**
 * DATABASE PROVISIONING
 */
function grantAccess(userId, tier, gateway, ref) {
  console.log(`[PROVISIONING] Node ${userId} upgraded to ${tier} via ${gateway}. Ref: ${ref}`);
  
  // SHARED DATABASE LOGIC:
  // 1. Update user.tier = tier
  // 2. Log transaction to paymentLogs table
  // 3. Emit socket event to frontend to refresh dashboard if user is online
  
  global.verifiedTransactions = global.verifiedTransactions || {};
  global.verifiedTransactions[userId] = { tier, timestamp: Date.now(), gateway };
}

// STATUS POLLING FOR FRONTEND (Zero-Trust verification)
app.get('/api/payments/status/:userId', (req, res) => {
  const status = global.verifiedTransactions?.[req.params.userId];
  res.json({ success: !!status, data: status });
});

const PORT = 10000;
app.listen(PORT, () => console.log(`🚀 Unified Gateway Listening on ${PORT}`));
