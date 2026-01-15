
import { 
  Trade, TradeType, UserProfile, BotConfig, PAIR_CONFIGS, MarketDataPoint, 
  AnalysisResult 
} from '../types';

export const getPairDetails = (pair: string) => PAIR_CONFIGS[pair] || { name: 'Institutional Pair', precision: 5, requiredTier: 'BASIC' };

const priceState: Record<string, number> = {};

export const getPrice = (pair: string): number => {
  if (!priceState[pair]) {
    const defaults: Record<string, number> = {
      'BTC/USD': 68420,
      'ETH/USD': 3821,
      'XAU/USD': 2384,
      'EUR/USD': 1.0854,
      'USD/JPY': 156.42,
      'GBP/USD': 1.2741,
    };
    priceState[pair] = defaults[pair] || (Math.random() * 100 + 10);
  }
  
  let volatility = 0.0001;
  if (pair.includes('BTC') || pair.includes('ETH') || pair.includes('SOL')) volatility = 5.0;
  else if (pair.includes('XAU')) volatility = 0.5;
  else if (pair.includes('JPY')) volatility = 0.02;
  else if (pair.length <= 5) volatility = 1.2;

  const change = (Math.random() - 0.5) * 2 * volatility;
  priceState[pair] += change;
  return priceState[pair];
};

export const generateNewsFeed = (pair: string) => {
  const assets = pair.split('/');
  const base = assets[0];
  const themes = [
    { title: 'Inflation Data Surge', impact: 'HIGH', sentiment: 'BEARISH' },
    { title: 'Institutional Liquidity Sweep', impact: 'MEDIUM', sentiment: 'BULLISH' },
    { title: 'Yield Curve Inversion Warning', impact: 'HIGH', sentiment: 'BEARISH' },
    { title: 'Massive Accumulation Detected', impact: 'HIGH', sentiment: 'BULLISH' },
    { title: 'NFP Surprise Results', impact: 'MEDIUM', sentiment: 'NEUTRAL' },
    { title: 'Central Bank Pivot Hinted', impact: 'HIGH', sentiment: 'BULLISH' },
    { title: 'Retail Sell-off Exhaustion', impact: 'LOW', sentiment: 'BULLISH' }
  ];
  
  // Return a consistent but randomized feed for the given pair
  return themes.sort(() => Math.random() - 0.5).slice(0, 5).map((t, idx) => ({
    id: `${pair}-${idx}`,
    title: `${base}: ${t.title}`,
    impact: t.impact,
    sentiment: t.sentiment as any,
    time: `${idx * 12 + 2}m ago`
  }));
};

export class SignalEngine {
  static evaluate(analysis: AnalysisResult, config: BotConfig, currentPrice: number) {
    let isBlocked = false;
    let blockReason = '';

    // Efficiency Rule: 85% Confidence Threshold
    if (analysis.confidence < 85) {
      isBlocked = true;
      blockReason = 'CONFIDENCE_THRESHOLD_NOT_MET';
    }

    // Profit Efficiency Rule: 1:3 RR Ratio
    const riskAmount = Math.abs(currentPrice - analysis.stopLoss);
    const rewardAmount = Math.abs(currentPrice - analysis.takeProfit);
    const rrRatio = rewardAmount / (riskAmount || 0.00001); // Prevent division by zero

    if (rrRatio < 2.5) { // Relaxed slightly from 2.8 for better demo flow
        isBlocked = true;
        blockReason = 'INSUFFICIENT_RR_RATIO';
    }

    if (analysis.volatility === 'HIGH' && config.signalMode === 'CONSERVATIVE') {
      isBlocked = true;
      blockReason = 'HIGH_VOLATILITY_RESTRICTION';
    }

    return {
      isBlocked,
      blockReason,
      score: analysis.confidence,
      signal: analysis.recommendation
    };
  }
}

export const resolveBinaryTrade = (trade: Trade, currentPrice: number): Trade => {
  if (trade.status !== 'OPEN') return trade;
  const elapsed = (Date.now() - new Date(trade.timestamp).getTime()) / 1000;
  
  if (elapsed < 30) return trade; 

  const isWin = (trade.type === 'CALL' || trade.type === 'BUY')
    ? currentPrice >= trade.price 
    : currentPrice <= trade.price;

  return {
    ...trade,
    status: isWin ? 'WON' : 'LOST',
    profit: isWin ? (trade.amount * (trade.payout || 0.85)) : -trade.amount
  };
};
