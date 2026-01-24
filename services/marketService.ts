
import { 
  Trade, TradeType, UserProfile, BotConfig, PAIR_CONFIGS, MarketDataPoint, 
  AnalysisResult 
} from '../types';

export const getPairDetails = (pair: string) => PAIR_CONFIGS[pair] || { name: 'Institutional Pair', precision: 5, requiredTier: 'BASIC' };

const priceState: Record<string, number> = {};

export const getPrice = (pair: string): number => {
  if (!priceState[pair]) {
    const defaults: Record<string, number> = {
      // Forex Majors
      'EUR/USD': 1.0854,
      'GBP/USD': 1.2741,
      'USD/JPY': 156.42,
      'USD/CHF': 0.9085,
      'AUD/USD': 0.6675,
      'USD/CAD': 1.3650,
      'NZD/USD': 0.6120,
      // Forex Minors
      'EUR/GBP': 0.8520,
      'EUR/JPY': 169.85,
      'GBP/JPY': 199.30,
      'AUD/JPY': 104.45,
      'CAD/JPY': 114.60,
      'EUR/AUD': 1.6250,
      'GBP/AUD': 1.9080,
      // Crypto
      'BTC/USD': 68420,
      'ETH/USD': 3821,
      'SOL/USD': 168.45,
      'BNB/USD': 595.20,
      'XRP/USD': 0.5240,
      'ADA/USD': 0.4580,
      // Metals & Indices
      'XAU/USD': 2384,
      'XAG/USD': 30.85,
      'NAS100': 18850,
      'US30': 39850,
    };
    priceState[pair] = defaults[pair] || (Math.random() * 100 + 10);
  }
  
  let volatility = 0.0001;
  const pairLower = pair.toLowerCase();

  if (pairLower.includes('btc') || pairLower.includes('eth')) volatility = 5.0;
  else if (pairLower.includes('sol') || pairLower.includes('bnb')) volatility = 0.8;
  else if (pairLower.includes('xrp') || pairLower.includes('ada')) volatility = 0.005;
  else if (pairLower.includes('xau')) volatility = 0.5;
  else if (pairLower.includes('xag')) volatility = 0.05;
  else if (pairLower.includes('nas100') || pairLower.includes('us30')) volatility = 2.0;
  else if (pairLower.includes('jpy')) volatility = 0.02;

  const change = (Math.random() - 0.5) * 2 * volatility;
  priceState[pair] += change;
  return priceState[pair];
};

/**
 * INSTITUTIONAL RISK MONITOR
 * Monitors open positions against SL/TP/Trailing levels
 */
export class RiskMonitor {
  static evaluateTrade(trade: Trade, currentPrice: number, config: BotConfig): Trade {
    if (trade.status !== 'OPEN') return trade;

    const isBuy = trade.type === 'BUY' || trade.type === 'CALL';
    let updatedTrade = { ...trade };

    // 1. Update High-Water Mark for Trailing SL
    if (isBuy) {
        if (!updatedTrade.maxPriceObserved || currentPrice > updatedTrade.maxPriceObserved) {
            updatedTrade.maxPriceObserved = currentPrice;
            
            // If Trailing is enabled, move SL up
            if (config.useTrailingStop) {
                const distance = config.trailingDistancePips * 0.0001; // Simplistic pip conversion
                const newSl = currentPrice - distance;
                if (newSl > updatedTrade.sl) {
                    updatedTrade.sl = newSl;
                }
            }
        }
    } else {
        if (!updatedTrade.maxPriceObserved || currentPrice < updatedTrade.maxPriceObserved) {
            updatedTrade.maxPriceObserved = currentPrice;
            
            if (config.useTrailingStop) {
                const distance = config.trailingDistancePips * 0.0001;
                const newSl = currentPrice + distance;
                if (newSl < updatedTrade.sl) {
                    updatedTrade.sl = newSl;
                }
            }
        }
    }

    // 2. Evaluate Exit Conditions
    let triggered = false;
    let reason: 'SL' | 'TP' | 'TRAILING' | 'EXPIRY' | undefined;

    if (isBuy) {
        if (currentPrice <= updatedTrade.sl) {
            triggered = true;
            reason = updatedTrade.maxPriceObserved && updatedTrade.maxPriceObserved > updatedTrade.price ? 'TRAILING' : 'SL';
        } else if (currentPrice >= updatedTrade.tp) {
            triggered = true;
            reason = 'TP';
        }
    } else {
        if (currentPrice >= updatedTrade.sl) {
            triggered = true;
            reason = updatedTrade.maxPriceObserved && updatedTrade.maxPriceObserved < updatedTrade.price ? 'TRAILING' : 'SL';
        } else if (currentPrice <= updatedTrade.tp) {
            triggered = true;
            reason = 'TP';
        }
    }

    // Binary Expiry Fallback (Optional backwards compatibility)
    const elapsed = (Date.now() - new Date(trade.timestamp).getTime()) / 1000;
    if (!triggered && elapsed > 180) { // 3 min hard expiry
        triggered = true;
        reason = 'EXPIRY';
    }

    if (triggered) {
        const isWin = isBuy ? currentPrice > updatedTrade.price : currentPrice < updatedTrade.price;
        return {
            ...updatedTrade,
            status: isWin ? 'WON' : 'LOST',
            profit: isWin ? (trade.amount * 0.85) : -trade.amount,
            exitReason: reason
        };
    }

    return updatedTrade;
  }
}

export class SignalEngine {
  static evaluate(analysis: AnalysisResult, config: BotConfig, currentPrice: number) {
    if (analysis.confidence < config.minConfidence) {
      return { isBlocked: true, blockReason: 'CONFIDENCE_LOW' };
    }
    return { isBlocked: false, signal: analysis.recommendation };
  }
}
