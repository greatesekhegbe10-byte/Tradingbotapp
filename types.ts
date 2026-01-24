
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  CALL = 'CALL', 
  PUT = 'PUT'    
}

export type UserTier = 'BASIC' | 'PRO' | 'VIP';
export type AdminRole = 'NONE' | 'OBSERVER' | 'ROOT';
export type TradingMode = 'PAPER' | 'LIVE';
export type StakingPlan = 'FIXED' | 'MARTINGALE' | 'FIBONACCI' | 'COMPOUND';
export type SignalMode = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type ConnectionMethod = 'BINARY_API' | 'MT5_EA' | 'META_API' | 'WEBHOOK' | 'CRYPTO_API';
export type PaymentGateway = 'PAYSTACK' | 'FLUTTERWAVE';

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
}

// Added BrokerCredentials for dual engine configuration
export interface BrokerCredentials {
  metaApi: {
    apiKey: string;
    apiSecret: string;
    accountId: string;
    webhookUrl: string;
    isActive: boolean;
  };
  mtPlatform: {
    login: string;
    server: string;
    eaName: string;
    eaStatus: string;
    isActive: boolean;
  };
}

// Added UserProfile to track user state and settings
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  role: AdminRole;
  balance: number;
  mode: TradingMode;
  status: 'ACTIVE' | 'SUSPENDED' | 'IDLE';
  stats: {
    winRate: number;
    drawdown: number;
    profitFactor?: number;
  };
  brokerConfig?: BrokerCredentials;
  connectedBroker?: string;
  brokerType?: ConnectionMethod | string;
  isEmailVerified?: boolean;
  photoURL?: string;
  history?: any[];
}

// Added GatewayConfig for admin gateway management
export interface GatewayConfig {
  name: string;
  isActive: boolean;
  publicKey: string;
  secretKey: string;
  secretHash?: string;
  webhookUrl: string;
}

// Added PaymentLog for admin clearing house
export interface PaymentLog {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  tier: UserTier;
  gateway: PaymentGateway;
  status: 'PENDING' | 'VERIFIED';
  timestamp: string;
}

// Added JournalEntry for the analytical journal
export interface JournalEntry {
  id: string;
  tradeId: string;
  pair: string;
  type: TradeType;
  profit: number;
  rr: number;
  setup: string;
  timestamp: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType | string;
  price: number; // Entry Price
  amount: number;
  status: 'OPEN' | 'WON' | 'LOST';
  timestamp: string;
  payout?: number;
  profit?: number;
  // Risk Management Extensions
  sl: number;
  tp: number;
  isTrailing?: boolean;
  maxPriceObserved?: number; // Used for Trailing SL
  exitReason?: 'SL' | 'TP' | 'TRAILING' | 'MANUAL' | 'EXPIRY';
}

export interface AnalysisResult {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  marketDefinition: string;
  candlestickPattern: string;
  entryTiming: string;
  recommendedStrategyId: string;
  reasoning: string;
  primarySignal: string;
  confirmations: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedLotSize: string;
  stopLoss: number;
  takeProfit: number;
  newsContext: string;
}

export interface Signal {
  id: string;
  pair: string;
  type: TradeType;
  entry: number;
  sl: number;
  tp: number;
  confidence: number;
  timestamp: string;
  strategyId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIGGERED';
}

export interface BotConfig {
  isActive: boolean;
  isAutoTrade: boolean;
  killSwitch: boolean;
  pair: string;
  tier: UserTier;
  strategyId: string;
  riskPerTrade: number;
  minConfidence: number;
  isExecutionEnabled: boolean;
  vpsStatus: 'ONLINE' | 'OFFLINE';
  signalMode: SignalMode;
  maxDrawdown: number;
  stakingPlan: StakingPlan;
  // Global Risk Defaults
  useTrailingStop: boolean;
  trailingDistancePips: number;
}

export const PAIR_CONFIGS: Record<string, { name: string, precision: number, requiredTier: UserTier }> = {
  // Forex Majors (BASIC Tier)
  'EUR/USD': { name: 'Euro / US Dollar', precision: 5, requiredTier: 'BASIC' },
  'GBP/USD': { name: 'Pound / US Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/JPY': { name: 'US Dollar / Yen', precision: 3, requiredTier: 'BASIC' },
  'USD/CHF': { name: 'US Dollar / Swiss Franc', precision: 5, requiredTier: 'BASIC' },
  'AUD/USD': { name: 'Australian Dollar / US Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/CAD': { name: 'US Dollar / Canadian Dollar', precision: 5, requiredTier: 'BASIC' },
  'NZD/USD': { name: 'New Zealand Dollar / US Dollar', precision: 5, requiredTier: 'BASIC' },

  // Forex Minors (PRO Tier)
  'EUR/GBP': { name: 'Euro / British Pound', precision: 5, requiredTier: 'PRO' },
  'EUR/JPY': { name: 'Euro / Japanese Yen', precision: 3, requiredTier: 'PRO' },
  'GBP/JPY': { name: 'Pound / Japanese Yen', precision: 3, requiredTier: 'PRO' },
  'AUD/JPY': { name: 'Australian Dollar / Japanese Yen', precision: 3, requiredTier: 'PRO' },
  'CAD/JPY': { name: 'Canadian Dollar / Japanese Yen', precision: 3, requiredTier: 'PRO' },
  'EUR/AUD': { name: 'Euro / Australian Dollar', precision: 5, requiredTier: 'PRO' },
  'GBP/AUD': { name: 'British Pound / Australian Dollar', precision: 5, requiredTier: 'PRO' },
  
  // Crypto (PRO/VIP Tier)
  'BTC/USD': { name: 'Bitcoin / US Dollar', precision: 2, requiredTier: 'PRO' },
  'ETH/USD': { name: 'Ethereum / US Dollar', precision: 2, requiredTier: 'PRO' },
  'SOL/USD': { name: 'Solana / US Dollar', precision: 2, requiredTier: 'VIP' },
  'BNB/USD': { name: 'Binance Coin / US Dollar', precision: 2, requiredTier: 'VIP' },
  'XRP/USD': { name: 'Ripple / US Dollar', precision: 4, requiredTier: 'VIP' },
  'ADA/USD': { name: 'Cardano / US Dollar', precision: 4, requiredTier: 'VIP' },

  // Metals & Indices (VIP Tier)
  'XAU/USD': { name: 'Gold / US Dollar', precision: 2, requiredTier: 'VIP' },
  'XAG/USD': { name: 'Silver / US Dollar', precision: 2, requiredTier: 'VIP' },
  'NAS100': { name: 'Nasdaq 100 Index', precision: 2, requiredTier: 'VIP' },
  'US30': { name: 'Dow Jones 30 Index', precision: 2, requiredTier: 'VIP' },
};

export const BROKER_ASSET_MAP: Record<string, string[]> = {
  'PocketOption': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'],
  'Quotex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BTC/USD', 'ETH/USD', 'XAU/USD'],
  'IC Markets': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'EUR/AUD', 'GBP/AUD', 'XAU/USD', 'XAG/USD', 'NAS100', 'US30'],
  'Binance': ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'],
  'Pepperstone': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'NAS100', 'US30'],
  'Exness': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BTC/USD', 'XAU/USD']
};

export const STRATEGIES = [
  { id: 'BASIC_RSI', name: 'Neural RSI Momentum', description: 'Basic relative strength filtering for trending markets.', winRate: 65, tier: 'BASIC' },
  { id: 'PRO_SENTINEL', name: 'Sentinel Delta Scanner', description: 'Volume-weighted delta divergence for institutional entries.', winRate: 78, tier: 'PRO' },
  { id: 'VIP_LIQUIDITY', name: 'Void Finder AI', description: 'SMC fair value gap and liquidity sweep detection.', winRate: 88, tier: 'VIP' },
  { id: 'HFT_SNIPER', name: 'HFT Sniper Logic', description: 'Ultra-low latency tick analysis for micro-reversals.', winRate: 94, tier: 'VIP' }
];

export const BINARY_BROKERS = ['PocketOption', 'Quotex', 'Deriv', 'IQ Option'];
export const INSTITUTIONAL_BROKERS = ['IC Markets', 'Pepperstone', 'FXPro', 'Exness'];
export const CRYPTO_BROKERS = ['Binance', 'Bybit', 'OKX', 'Coinbase'];
