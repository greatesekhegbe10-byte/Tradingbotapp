
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
    password?: string;
    eaName: string;
    eaStatus: 'IDLE' | 'EXECUTING' | 'ERROR';
    isActive: boolean;
  };
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
  brokerConfig: BrokerCredentials;
  staking: {
    plan: StakingPlan;
    multiplier: number;
    currentStep: number;
  };
  stats: UserStats;
  history: any[];
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
  profit?: number;
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
  maxLossPercent: number; // New next-gen setting
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

const generatePairs = () => {
  const configs: Record<string, any> = {};
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'ZAR', 'MXN', 'TRY', 'BRL', 'INR', 'CNH', 'SGD'];
  
  currencies.forEach(c1 => {
    currencies.forEach(c2 => {
      if (c1 !== c2) {
        const pair = `${c1}/${c2}`;
        configs[pair] = { 
          name: `${c1}${c2} Institutional`, 
          precision: c2 === 'JPY' ? 3 : 5, 
          requiredTier: ['TRY', 'BRL', 'ZAR'].includes(c1) || ['TRY', 'BRL', 'ZAR'].includes(c2) ? 'PRO' : 'BASIC' 
        };
      }
    });
  });

  ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'LINK', 'DOGE', 'SHIB', 'MATIC', 'LTC', 'BCH', 'UNI'].forEach(coin => {
    configs[`${coin}/USD`] = { name: `${coin} / US Dollar`, precision: 2, requiredTier: 'BASIC' };
    configs[`${coin}/BTC`] = { name: `${coin} / Bitcoin`, precision: 8, requiredTier: 'PRO' };
  });

  ['TSLA', 'AAPL', 'NVDA', 'AMZN', 'GOOGL', 'MSFT', 'META', 'NFLX', 'AMD', 'INTC', 'PYPL', 'SHOP'].forEach(stock => {
    configs[stock] = { name: `${stock} Equity`, precision: 2, requiredTier: 'PRO' };
  });

  ['XAU/USD', 'XAG/USD', 'WTI/USD', 'BRENT/USD', 'NATGAS/USD', 'COPPER/USD'].forEach(com => {
    configs[com] = { name: com.split('/')[0] + ' Spot', precision: 2, requiredTier: 'PRO' };
  });

  return configs;
};

export const PAIR_CONFIGS = generatePairs();

export const STRATEGIES = [
  { id: 'BASIC_RSI', name: 'Neural RSI Momentum', description: 'Basic relative strength filtering for trending markets.', winRate: 65, tier: 'BASIC' },
  { id: 'PRO_SENTINEL', name: 'Sentinel Delta Scanner', description: 'Volume-weighted delta divergence for institutional entries.', winRate: 78, tier: 'PRO' },
  { id: 'VIP_LIQUIDITY', name: 'Void Finder AI', description: 'SMC fair value gap and liquidity sweep detection.', winRate: 88, tier: 'VIP' },
  { id: 'HFT_SNIPER', name: 'HFT Sniper Logic', description: 'Ultra-low latency tick analysis for micro-reversals.', winRate: 94, tier: 'VIP' }
];

// Exact 50 Binary Options Brokers
export const BINARY_BROKERS = [
  'Pocket Option', 'Deriv (Institutional)', 'Quotex', 'IQ Option', 'Olymp Trade', 
  'Binomo', 'ExpertOption', 'Spectre.ai', 'Nadex', 'Binary.com',
  'RaceOption', 'VideForex', 'BinaryCent', 'Pocket Option Pro', 'IQCent', 
  'CloseOption', 'Focus Option', 'Intrade.bar', 'Binarium', 'Finmax',
  'Ayrex', 'Dukascopy Binary', 'ETX Capital', 'Hirose Financial', 'IG Binary', 
  'CMC Markets Binary', 'Saxo Bank Binary', 'Swissquote Binary', 'AvaTrade Binary', 'HotForex Binary',
  'XM Binary', 'FBS Binary', 'OctaFX Binary', 'Exness Binary', 'RoboForex Binary', 
  'Tickmill Binary', 'Pepperstone Binary', 'IC Markets Binary', 'Vantage Binary', 'FP Markets Binary',
  'Admiral Markets Binary', 'Alpari Binary', 'FXTM Binary', 'IronFX Binary', 'HFM Binary', 
  'BDSwiss Binary', 'Axi Binary', 'ThinkMarkets Binary', 'BlackBull Binary', 'Eightcap Binary'
];

// Exact 50 Institutional (MT4/MT5) Brokers
export const INSTITUTIONAL_BROKERS = [
  'IC Markets Global', 'Exness Institutional', 'Pepperstone', 'Interactive Brokers', 'MT5 Institutional', 
  'Saxo Bank', 'Dukascopy', 'Swissquote', 'LMAX Global', 'CMC Markets',
  'IG Markets', 'City Index', 'FOREX.com', 'OANDA', 'XM Group', 
  'HotForex (HFM)', 'FXCM', 'Admiral Markets', 'Alpari', 'AvaTrade',
  'Axi', 'BDSwiss', 'BlackBull Markets', 'Capital.com', 'Eightcap', 
  'FP Markets', 'FXPro', 'FXTM', 'HYCM', 'IronFX',
  'Markets.com', 'Moneta Markets', 'OctaFX', 'Orbex', 'PrimeXBT', 
  'PU Prime', 'RoboForex', 'ThinkMarkets', 'Tickmill', 'TMGM',
  'Vantage Markets', 'VT Markets', 'Windzor Global', 'XTB', 'Zenfinex', 
  'Z.com', 'Key To Markets', 'JFD Bank', 'Global Prime', 'Axiory'
];

export const CRYPTO_BROKERS = [
  'Binance Cloud', 'Coinbase Institutional', 'Kraken Pro', 'Bybit Institutional', 
  'OKX Global', 'Bitget Pro', 'Gate.io Institutional', 'KuCoin Pro'
];

export const BROKER_ASSET_MAP: Record<string, string[]> = {
  ...Object.fromEntries([...BINARY_BROKERS, ...INSTITUTIONAL_BROKERS, ...CRYPTO_BROKERS].map(b => [b, Object.keys(PAIR_CONFIGS)]))
};

export interface GatewayConfig {
  name: PaymentGateway;
  publicKey: string;
  secretKey: string;
  isActive: boolean;
  webhookUrl: string;
  secretHash?: string;
}

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
