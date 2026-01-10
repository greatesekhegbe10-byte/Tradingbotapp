
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

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
}

export interface ConfidenceFactor {
  label: string;
  score: number;
  weight: string;
}

export interface NewsItem {
  id: string;
  time: string;
  headline: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  aiInterpretation?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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
  confidenceFactors: ConfidenceFactor[];
  reasoning: string;
  primarySignal: string;
  confirmations: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sniperScore: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  strategyExplanation: string;
  suggestedLotSize: string;
  suggestedMode: SignalMode;
  stopLoss: number;
  takeProfit: number;
  newsContext: string;
  policyImpact: string;
  candlestickPattern?: string;
  marketDefinition?: string;
  entryTiming?: string;
  activeStrategyName?: string;
  recommendedStrategyId?: string;
}

export interface SignalBreakdown {
  primarySignal: string;
  confirmations: string[];
  filtersPassed: string[];
  score: number;
  isBlocked: boolean;
  blockReason: string;
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
  'EUR/USD': { name: 'Euro Dollar', precision: 5, requiredTier: 'BASIC' },
  'GBP/USD': { name: 'Pound Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/JPY': { name: 'Dollar Yen', precision: 3, requiredTier: 'BASIC' },
  'AUD/USD': { name: 'Aussie Dollar', precision: 5, requiredTier: 'BASIC' },
  'USD/CAD': { name: 'Dollar Loonie', precision: 5, requiredTier: 'BASIC' },
  'BTC/USD': { name: 'Bitcoin', precision: 2, requiredTier: 'BASIC' },
  'ETH/USD': { name: 'Ethereum', precision: 2, requiredTier: 'BASIC' },
  'XAU/USD': { name: 'Gold', precision: 2, requiredTier: 'BASIC' },
  'GBP/JPY': { name: 'Pound Yen', precision: 3, requiredTier: 'BASIC' },
  'EUR/JPY': { name: 'Euro Yen', precision: 3, requiredTier: 'BASIC' },
};

const currencies = ['EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF', 'JPY', 'ZAR', 'MXN', 'TRY', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'HUF', 'ILS', 'THB'];
const cryptos = ['SOL', 'ADA', 'DOT', 'LINK', 'MATIC', 'XRP', 'AVAX', 'LTC', 'BCH', 'UNI', 'ALGO', 'NEAR', 'ATOM', 'FIL', 'ICP', 'VET', 'GRT', 'LDO', 'HBAR'];
const indices = ['NAS100', 'US30', 'US500', 'GER40', 'HK50', 'UK100', 'FRA40', 'JPN225', 'AUS200', 'ESP35'];

currencies.slice(0, 8).forEach((base) => {
  currencies.slice(0, 8).forEach((quote) => {
    const pair = `${base}/${quote}`;
    if (base !== quote && !PAIR_CONFIGS[pair]) {
      PAIR_CONFIGS[pair] = { name: `${base}${quote} Cross`, precision: 5, requiredTier: 'PRO' };
    }
  });
});

currencies.forEach((base) => {
  currencies.slice(8).forEach((quote) => {
    const pair = `${base}/${quote}`;
    if (base !== quote && !PAIR_CONFIGS[pair]) {
      PAIR_CONFIGS[pair] = { name: `${base}${quote} Exotic`, precision: 4, requiredTier: 'VIP' };
    }
  });
});

cryptos.forEach((c) => {
  const pair = `${c}/USD`;
  if (!PAIR_CONFIGS[pair]) {
    PAIR_CONFIGS[pair] = { name: `${c} Crypto`, precision: 4, requiredTier: 'VIP' };
  }
});

indices.forEach((idx) => {
  if (!PAIR_CONFIGS[idx]) {
    PAIR_CONFIGS[idx] = { name: idx, precision: 2, requiredTier: 'VIP' };
  }
});

export const STRATEGIES = [
  { id: 'BASIC_RSI', name: 'Neural RSI Momentum', description: 'Uses relative strength with neural filtering to find overextended trends.', winRate: 65, tier: 'BASIC', features: ['RSI Tracking', 'Trend Alignment'] },
  { id: 'PRO_SENTINEL', name: 'Sentinel Delta Scanner', description: 'Volume-weighted delta divergence detection for institutional entry points.', winRate: 78, tier: 'PRO', features: ['Order Flow', 'Delta Volume', 'Gap Analysis'] },
  { id: 'VIP_LIQUIDITY', name: 'Void Finder AI', description: 'Scans for Fair Value Gaps and Liquidity Voids in the order book.', winRate: 88, tier: 'VIP', features: ['FVG Detection', 'Liquidity Grabs', 'HTF Confluence'] },
  { id: 'HFT_SNIPER', name: 'HFT Sniper Logic', description: 'Ultra-fast tick analysis for capturing micro-moves in volatile sessions.', winRate: 94, tier: 'VIP', features: ['Tick Analysis', 'L2 Data Feed', 'Slippage Guard'] }
];

export const BROKER_ASSET_MAP: Record<string, string[]> = {
  'Pocket Option': Object.keys(PAIR_CONFIGS).filter(p => PAIR_CONFIGS[p].requiredTier === 'BASIC'),
  'MT5 Institutional': Object.keys(PAIR_CONFIGS),
  'Exness Institutional': Object.keys(PAIR_CONFIGS),
  'Binance Cloud': Object.keys(PAIR_CONFIGS).filter(p => p.includes('/') && cryptos.concat(['BTC', 'ETH']).some(c => p.startsWith(c))),
};

export const BINARY_BROKERS = ['Pocket Option', 'Quotex', 'IQ Option', 'Deriv', 'ExpertOption', 'Binomo'];
export const INSTITUTIONAL_BROKERS = ['MT5 Institutional', 'Exness Institutional', 'IC Markets Global', 'Pepperstone Pro', 'XM Premium', 'Saxo Bank'];
export const CRYPTO_BROKERS = ['Binance Cloud', 'Coinbase Prime', 'Kraken Institutional', 'Bybit Institutional', 'OKX Private'];
