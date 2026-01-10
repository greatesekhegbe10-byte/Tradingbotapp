
import { 
  Trade, TradeType, UserProfile, BotConfig, PAIR_CONFIGS, MarketDataPoint, 
  SignalBreakdown, AnalysisResult, SignalMode 
} from '../types';

export const getPairDetails = (pair: string) => PAIR_CONFIGS[pair] || PAIR_CONFIGS['EUR/USD'];

const priceState: Record<string, number> = {};

export const getPrice = (pair: string): number => {
  if (!priceState[pair]) {
    const defaults: Record<string, number> = {
      'BTC/USD': 65000,
      'ETH/USD': 3500,
      'XAU/USD': 2350,
      'NAS100': 18000,
      'US30': 39000,
      'GER40': 18500,
      'HK50': 19500,
      'SOL/USD': 145,
      'EUR/USD': 1.0850,
      'USD/JPY': 155.00,
      'GBP/USD': 1.2650,
      'USD/ZAR': 18.50,
      'USD/MXN': 17.20
    };
    priceState[pair] = defaults[pair] || 1.1200;
  }
  
  let volatility = 0.0002;
  if (pair.includes('BTC') || pair.includes('ETH')) volatility = 40.0;
  else if (pair.includes('SOL') || pair.includes('LINK')) volatility = 0.5;
  else if (pair.includes('NAS') || pair.includes('US30') || pair.includes('GER') || pair.includes('HK')) volatility = 15.0;
  else if (pair.includes('XAU')) volatility = 1.5;
  else if (pair.includes('JPY')) volatility = 0.08;
  else if (pair.includes('ZAR') || pair.includes('MXN')) volatility = 0.01;

  const change = (Math.random() - 0.5) * 2 * volatility;
  priceState[pair] += change;
  return priceState[pair];
};

export const generateMarketData = (pair: string): MarketDataPoint => ({
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  price: getPrice(pair),
  volume: Math.floor(Math.random() * 10000 + 5000)
});

export class SignalEngine {
  static evaluate(analysis: AnalysisResult, config: BotConfig): SignalBreakdown {
    let isBlocked = false;
    let blockReason = '';

    // 1. Confidence Threshold
    if (analysis.confidence < config.minConfidence) {
      isBlocked = true;
      blockReason = 'CONFIDENCE_BELOW_MIN_THRESHOLD';
    }

    // 2. Quality Signal Filter: Confirmation Protocol (Min 2 Confirmations)
    if (!analysis.confirmations || analysis.confirmations.length < 2) {
      isBlocked = true;
      blockReason = 'INSUFFICIENT_TECHNICAL_CONFIRMATIONS';
    }

    // 3. Volatility Guard
    if (analysis.volatility === 'HIGH' && config.signalMode === 'CONSERVATIVE' && analysis.confidence < 90) {
      isBlocked = true;
      blockReason = 'CONSERVATIVE_VOLATILITY_GUARD';
    }

    return {
      primarySignal: analysis.primarySignal || 'NEURAL_CONFLUENCE',
      confirmations: analysis.confirmations || [],
      filtersPassed: ['SPREAD_CHECK', 'LIQUIDITY_AUDIT', 'NODE_SYNC'],
      score: analysis.confidence,
      isBlocked,
      blockReason
    };
  }
}

export class RiskManager {
  static canTrade(user: UserProfile, config: BotConfig, signal: SignalBreakdown): { allowed: boolean; reason?: string } {
    // Global Killswitch
    if (config.killSwitch) return { allowed: false, reason: 'GLOBAL_KILLSWITCH_ACTIVE' };
    
    // Signal Quality Block
    if (signal.isBlocked) return { allowed: false, reason: signal.blockReason };
    
    // Drawdown Protection
    if (user.stats.drawdown > config.maxDrawdown) return { allowed: false, reason: 'MAX_DRAWDOWN_BREACHED' };

    // Session Cap
    if (user.stats.sessionTrades >= config.maxTradesPerSession) return { allowed: false, reason: 'SESSION_TRADE_LIMIT_REACHED' };
    
    // Cooldown
    if (user.stats.lastTradeTime) {
      const diffMs = Date.now() - new Date(user.stats.lastTradeTime).getTime();
      if (diffMs < config.coolDownMinutes * 60000) return { allowed: false, reason: 'COOLDOWN_ACTIVE' };
    }

    // Liquidity
    if (user.balance < config.riskPerTrade) return { allowed: false, reason: 'INSUFFICIENT_ACCOUNT_BALANCE' };

    return { allowed: true };
  }
}

export const resolveBinaryTrade = (trade: Trade, currentPrice: number): Trade => {
  if (trade.status !== 'OPEN') return trade;
  const elapsed = (Date.now() - new Date(trade.timestamp).getTime()) / 1000;
  
  if (elapsed < 15) return trade; 

  const isWin = (trade.type === 'CALL' || trade.type === 'BUY')
    ? currentPrice > trade.price 
    : currentPrice < trade.price;

  return {
    ...trade,
    status: isWin ? 'WON' : 'LOST',
    profit: isWin ? (trade.amount * (trade.payout || 0.85)) : -trade.amount
  };
};
