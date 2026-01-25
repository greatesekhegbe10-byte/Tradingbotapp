

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
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
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

export interface GatewayConfig {
  name: PaymentGateway;
  isActive: boolean;
  publicKey: string;
  secretKey: string;
  webhookUrl: string;
  webhookSecret: string; // Used for signature verification
}

export interface PaymentLog {
  id: string;          // Transaction Reference
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  tier: UserTier;
  gateway: PaymentGateway;
  status: TransactionStatus;
  timestamp: string;
  verifiedAt?: string;
}

export interface BrokerCredentials {
  isActive: boolean;
  isAdminUnlocked: boolean;
  connectionStatus: 'DISCONNECTED' | 'LINKED' | 'FAILED';
  metaApi?: { isActive: boolean };
  mtPlatform?: { isActive: boolean };
}

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
    profitFactor: number;
    totalTrades: number;
    equityHistory: { date: string, value: number }[];
  };
  brokerConfig: BrokerCredentials;
  subscriptionExpiry?: string;
  photoURL?: string;
}

// Added missing fields to Trade interface to support risk monitor and resolution matrix
export interface Trade {
  id: string;
  symbol: string;
  type: TradeType | string;
  price: number;
  amount: number;
  status: 'OPEN' | 'WON' | 'LOST';
  timestamp: string;
  sl: number;
  tp: number;
  isTrailing?: boolean;
  maxPriceObserved?: number;
  profit?: number;
  payout?: number;
  exitReason?: 'SL' | 'TP' | 'TRAILING' | 'EXPIRY';
}

// Added missing Signal interface used in SignalDashboard
export interface Signal {
  id: string;
  pair: string;
  type: TradeType;
  entry: number;
  sl: number;
  tp: number;
  confidence: number;
  timestamp: string;
  strategyName: string;
  winRate: number;
}

// Added missing JournalEntry interface used in TradingJournal
export interface JournalEntry {
  id: string;
  tradeId: string;
  pair: string;
  type: TradeType;
  profit: number;
  rr: number;
  setup: string;
  timestamp: string;
  notes: string;
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
  useTrailingStop: boolean;
  trailingDistancePips: number;
}

export const STRATEGIES = [
  { id: 'BASIC_RSI', name: 'Neural RSI', tier: 'BASIC' },
  { id: 'PRO_SENTINEL', name: 'Sentinel Delta', tier: 'PRO' },
  { id: 'VIP_LIQUIDITY', name: 'Void Finder AI', tier: 'VIP' }
];

export const BINARY_BROKERS = ['PocketOption', 'Quotex', 'Deriv'];
export const INSTITUTIONAL_BROKERS = ['IC Markets', 'Pepperstone', 'Exness'];
export const CRYPTO_BROKERS = ['Binance', 'Bybit', 'OKX'];

export const PAIR_CONFIGS: Record<string, { name: string, precision: number, requiredTier: UserTier }> = {
  'EUR/USD': { name: 'Euro / US Dollar', precision: 5, requiredTier: 'BASIC' },
  'GBP/USD': { name: 'Pound / US Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/JPY': { name: 'US Dollar / Yen', precision: 3, requiredTier: 'BASIC' },
  'BTC/USD': { name: 'Bitcoin / US Dollar', precision: 2, requiredTier: 'PRO' },
  'XAU/USD': { name: 'Gold / US Dollar', precision: 2, requiredTier: 'VIP' },
};