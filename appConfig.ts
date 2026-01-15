
/**
 * NEXUS TRADER - PERMANENT INFRASTRUCTURE CONFIG
 */
export const PERMANENT_KEYS = {
  PAYSTACK: {
    PUBLIC_KEY: 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 
    IS_ACTIVE: true
  },
  FLUTTERWAVE: {
    PUBLIC_KEY: 'FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X',
    IS_ACTIVE: true
  },
  ADMIN: {
    ROOT_PASSCODE: '08126972446',
    ROOT_NAME: 'Alex',
    ROOT_EMAIL: 'alex.root@nexus.ai'
  },
  API: {
    // SaaS Hub URL (Render/PaaS)
    BASE_URL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:10000',
    // Dedicated VPS Trading Node URL (Set this to your VPS IP/Domain)
    VPS_TRADING_NODE_URL: 'https://vps-trading-node.yourdomain.com',
    INTERNAL_AUTH_TOKEN: 'NX-SECURE-BRIDGE-TOKEN-2025'
  }
};

export const INITIAL_USER_REGISTRY = [
  { id: 'NX-9921', name: 'John Alpha', email: 'john@trading.com', tier: 'PRO', role: 'NONE', balance: 5400, mode: 'LIVE', status: 'ACTIVE', isLiveAccount: true, history: [] },
  { id: 'NX-4412', name: 'Sarah Beta', email: 'sarah@skynet.ai', tier: 'VIP', role: 'NONE', balance: 12500, mode: 'PAPER', status: 'ACTIVE', isLiveAccount: false, history: [] },
];

export const BOT_DEFAULTS = {
  MIN_CONFIDENCE: 85,
  DEFAULT_PAIR: 'EUR/USD',
  DEFAULT_STRATEGY: 'VIP_LIQUIDITY',
  STAKING_PLAN: 'FIXED',
  MAX_DRAWDOWN: 10
};
