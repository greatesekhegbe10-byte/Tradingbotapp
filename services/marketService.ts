import { MarketDataPoint } from '../types';

// Configuration for different pairs
const PAIR_CONFIGS: Record<string, { price: number, volatility: number, decimals: number }> = {
  'BTC/USD': { price: 65000, volatility: 35, decimals: 2 },
  'ETH/USD': { price: 3450, volatility: 8, decimals: 2 },
  'SOL/USD': { price: 145, volatility: 0.5, decimals: 2 },
  'XAU/USD': { price: 2350, volatility: 1.5, decimals: 2 }, // Gold
  'EUR/USD': { price: 1.0850, volatility: 0.00015, decimals: 5 }, // Forex
  'GBP/USD': { price: 1.2750, volatility: 0.0002, decimals: 5 }, // Forex
  'USD/JPY': { price: 155.50, volatility: 0.04, decimals: 3 }, // Forex (JPY)
  'AUD/USD': { price: 0.6650, volatility: 0.0002, decimals: 5 }, // Forex
  'USD/CAD': { price: 1.3700, volatility: 0.0002, decimals: 5 }, // Forex
  'USD/CHF': { price: 0.9100, volatility: 0.0002, decimals: 5 }, // Forex
  'NZD/USD': { price: 0.6100, volatility: 0.0002, decimals: 5 }, // Forex
  'EUR/GBP': { price: 0.8500, volatility: 0.00015, decimals: 5 }, // Forex
  'EUR/JPY': { price: 168.50, volatility: 0.05, decimals: 3 }    // Forex
};

// Store current price state for all pairs
const currentPrices: Record<string, number> = { 
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: PAIR_CONFIGS[key].price}), {}) 
};

// Store trend momentum for more realistic movements
const priceMomentum: Record<string, number> = {
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: 0}), {})
};

let timeStep = 0;

export const getPairDetails = (pair: string) => {
  return PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USD'];
};

export const getPrice = (pair: string): number => {
  return currentPrices[pair] || PAIR_CONFIGS['BTC/USD'].price;
};

// --- Technical Analysis Helpers ---

export const calculateSMA = (data: MarketDataPoint[], period: number): number | null => {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val.price, 0);
  return sum / period;
};

export const calculateRSI = (data: MarketDataPoint[], period: number = 14): number | null => {
  if (data.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].price - data[i - 1].price;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// --- Market Generation ---

export const generateMarketData = (pair: string = 'BTC/USD'): MarketDataPoint => {
  const now = new Date();
  
  // Update ALL pairs to ensure background trades trigger SL/TP
  Object.keys(currentPrices).forEach(p => {
    const config = PAIR_CONFIGS[p];
    const volatility = config.volatility;
    
    // Improved "Cleaner" Trend Logic
    // Reduce the random noise, increase the persistence of the momentum
    
    // 2% chance to reverse trend strongly (Pivot point)
    if (Math.random() > 0.98) {
      priceMomentum[p] = (Math.random() - 0.5) * (volatility * 2);
    } 
    // 10% chance to adjust momentum slightly (Drift)
    else if (Math.random() > 0.90) {
      priceMomentum[p] += (Math.random() - 0.5) * (volatility * 0.5);
    }

    // Dampen momentum slightly to prevent runaway prices
    priceMomentum[p] *= 0.99;

    const noise = (Math.random() - 0.5) * (volatility * 0.2); // Reduced noise
    const trendComponent = priceMomentum[p];
    
    currentPrices[p] += trendComponent + noise;
    
    // Safety floor
    if (currentPrices[p] < config.volatility) currentPrices[p] = config.price;
  });

  timeStep++;

  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USD'];
  
  return {
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: parseFloat(currentPrices[pair].toFixed(config.decimals)),
    volume: Math.floor(Math.random() * 100) + 10
  };
};

export const generateInitialHistory = (count: number, pair: string = 'BTC/USD'): MarketDataPoint[] => {
  const history: MarketDataPoint[] = [];
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USD'];
  
  // Initialize if missing
  if (!currentPrices[pair]) currentPrices[pair] = config.price;

  let simPrice = currentPrices[pair];
  let simMomentum = 0;

  for (let i = count; i > 0; i--) {
    const volatility = config.volatility;
    
    // Same smoother logic for history
    if (Math.random() > 0.98) simMomentum = (Math.random() - 0.5) * (volatility * 2);
    else if (Math.random() > 0.90) simMomentum += (Math.random() - 0.5) * (volatility * 0.5);
    simMomentum *= 0.99;

    const noise = (Math.random() - 0.5) * (volatility * 0.2);
    simPrice -= (simMomentum + noise); // Reverse walk
    
    const time = new Date(Date.now() - i * 1500); 

    history.push({
      time: time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(simPrice.toFixed(config.decimals)),
      volume: Math.floor(Math.random() * 100) + 10
    });
  }
  
  return history;
};