
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

export interface GatewayConfig {
  name: PaymentGateway;
  publicKey: string;
  secretKey: string;
  webhookUrl: string;
  secretHash?: string; // Specific for Flutterwave
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  tier: UserTier;
  role: AdminRole;
  balance: number;
  mode: TradingMode;
  status: 'ACTIVE' | 'SUSPENDED';
  paymentMethods: string[];
  connectedBroker?: string;
  brokerType?: ConnectionMethod;
  isLiveAccount: boolean;
  staking: {
    plan: StakingPlan;
    multiplier: number;
    currentStep: number;
  };
  stats: UserStats;
}

export interface UserStats {
  totalProfit: number;
  winRate: number;
  drawdown: number;
  lossStreak: number;
  sessionTrades: number;
  lastTradeTime?: string;
}

export interface AnalysisResult {
  recommendation: TradeType;
  confidence: number; 
  reasoning: string;
  primarySignal: string;
  confirmations: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedLotSize: string;
  stopLoss: number;
  takeProfit: number;
  newsContext: string;
  candlestickPattern: string;
  marketDefinition: string;
  entryTiming: string;
  recommendedStrategyId: string;
  activeStrategyName?: string;
}

export interface SignalBreakdown {
  primarySignal: string;
  confirmations: string[];
  filtersPassed: string[];
  score: number;
  isBlocked: boolean;
  blockReason: string;
}

export interface NewsItem {
  id: string;
  title: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timestamp: string;
  source: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  price: number;
  amount: number;
  lotSize?: string;
  timestamp: Date;
  status: 'OPEN' | 'WON' | 'LOST' | 'CLOSED';
  mode: TradingMode;
  executionLogs: string[];
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
  payout?: number;
}

export interface BotConfig {
  isActive: boolean;
  isAutoTrade: boolean;
  killSwitch: boolean;
  pair: string;
  tier: UserTier;
  strategyId: string;
  maxDrawdown: number;
  riskPerTrade: number;
  useTrailingStop: boolean;
  stakingPlan: StakingPlan;
  binaryExpiry: number;
  signalMode: SignalMode;
  maxTradesPerSession: number;
  coolDownMinutes: number;
  useAiSignals: boolean;
  useNewsAnalysis: boolean;
  minConfidence: number;
  defaultStopLoss: number;
  defaultTakeProfit: number;
}

export const PAIR_CONFIGS: Record<string, any> = {
  // Majors
  'EUR/USD': { name: 'Euro Dollar', precision: 5, requiredTier: 'BASIC' },
  'GBP/USD': { name: 'Pound Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/JPY': { name: 'Dollar Yen', precision: 3, requiredTier: 'BASIC' },
  'USD/CHF': { name: 'Dollar Swiss', precision: 5, requiredTier: 'PRO' },
  'USD/CAD': { name: 'Dollar Loonie', precision: 5, requiredTier: 'PRO' },
  'AUD/USD': { name: 'Aussie Dollar', precision: 5, requiredTier: 'BASIC' },
  'NZD/USD': { name: 'Kiwi Dollar', precision: 5, requiredTier: 'PRO' },
  // Minors
  'EUR/GBP': { name: 'Euro Pound', precision: 5, requiredTier: 'PRO' },
  'EUR/AUD': { name: 'Euro Aussie', precision: 5, requiredTier: 'VIP' },
  'GBP/JPY': { name: 'Pound Yen', precision: 3, requiredTier: 'PRO' },
  'CHF/JPY': { name: 'Swiss Yen', precision: 3, requiredTier: 'VIP' },
  'EUR/JPY': { name: 'Euro Yen', precision: 3, requiredTier: 'BASIC' },
  'GBP/CAD': { name: 'Pound Loonie', precision: 5, requiredTier: 'VIP' },
  'AUD/JPY': { name: 'Aussie Yen', precision: 3, requiredTier: 'PRO' },
  // Commodities/Crypto
  'XAU/USD': { name: 'Gold Spot', precision: 2, requiredTier: 'BASIC' },
  'BTC/USD': { name: 'Bitcoin', precision: 2, requiredTier: 'BASIC' },
  'ETH/USD': { name: 'Ethereum', precision: 2, requiredTier: 'PRO' },
};

export const STRATEGIES = [
  { id: 'BASIC_RSI', name: 'Neural RSI Momentum', description: 'Uses relative strength with neural filtering to find overextended trends.', winRate: 65, tier: 'BASIC', features: ['RSI Tracking', 'Trend Alignment'] },
  { id: 'PRO_SENTINEL', name: 'Sentinel Delta Scanner', description: 'Volume-weighted delta divergence detection for institutional entry points.', winRate: 78, tier: 'PRO', features: ['Order Flow', 'Delta Volume', 'Gap Analysis'] },
  { id: 'VIP_LIQUIDITY', name: 'Void Finder AI', description: 'Scans for Fair Value Gaps and Liquidity Voids in the order book.', winRate: 88, tier: 'VIP', features: ['FVG Detection', 'Liquidity Grabs', 'HTF Confluence'] },
  { id: 'HFT_SNIPER', name: 'HFT Sniper Logic', description: 'Ultra-fast tick analysis for capturing micro-moves in volatile sessions.', winRate: 94, tier: 'VIP', features: ['Tick Analysis', 'L2 Data Feed', 'Slippage Guard'] }
];

export const BROKER_ASSET_MAP: Record<string, string[]> = {
  'Pocket Option': Object.keys(PAIR_CONFIGS),
  'Deriv (Institutional)': Object.keys(PAIR_CONFIGS),
  'ExpertOption': Object.keys(PAIR_CONFIGS),
  'Quotex Global': Object.keys(PAIR_CONFIGS),
  'MT5 Institutional': Object.keys(PAIR_CONFIGS),
  'Exness Institutional': Object.keys(PAIR_CONFIGS),
  'Binance Cloud': Object.keys(PAIR_CONFIGS),
};

export const BINARY_BROKERS = ['Pocket Option', 'Deriv (Institutional)', 'ExpertOption', 'Quotex Global', 'Spectre.ai', 'Olymp Trade', 'IQ Option', 'Binomo'];
export const INSTITUTIONAL_BROKERS = ['MT5 Institutional', 'Exness Institutional', 'IC Markets Global', 'Pepperstone Institutional'];
export const CRYPTO_BROKERS = ['Binance Cloud', 'Coinbase Prime', 'Kraken Institutional', 'Bybit Institutional'];
