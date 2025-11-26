import { MarketDataPoint } from '../types';

// Configuration for different pairs
const PAIR_CONFIGS: Record<string, { price: number, volatility: number, decimals: number }> = {
  // Majors
  'EUR/USD': { price: 1.0850, volatility: 0.00015, decimals: 5 },
  'GBP/USD': { price: 1.2750, volatility: 0.0002, decimals: 5 },
  'USD/JPY': { price: 155.50, volatility: 0.04, decimals: 3 },
  'AUD/USD': { price: 0.6650, volatility: 0.0002, decimals: 5 },
  'NZD/USD': { price: 0.6100, volatility: 0.0002, decimals: 5 },
  'USD/CAD': { price: 1.3700, volatility: 0.0002, decimals: 5 },
  'USD/CHF': { price: 0.9100, volatility: 0.0002, decimals: 5 },
  
  // Commodities
  'XAU/USD': { price: 2350, volatility: 1.5, decimals: 2 }, // Gold
  'WTI/USD': { price: 78.50, volatility: 0.4, decimals: 2 }, // Oil
  'BRENT/USD': { price: 82.30, volatility: 0.4, decimals: 2 }, // Oil

  // Crypto
  'BTC/USD': { price: 65000, volatility: 35, decimals: 2 },
  'ETH/USD': { price: 3450, volatility: 8, decimals: 2 },
  'SOL/USD': { price: 145, volatility: 0.5, decimals: 2 },

  // Minors / Crosses
  'GBP/JPY': { price: 198.20, volatility: 0.06, decimals: 3 },
  'EUR/JPY': { price: 168.50, volatility: 0.05, decimals: 3 },
  'EUR/GBP': { price: 0.8500, volatility: 0.00015, decimals: 5 },
  'GBP/CAD': { price: 1.7450, volatility: 0.0002, decimals: 5 },
  'CAD/JPY': { price: 113.50, volatility: 0.04, decimals: 3 },
  'AUD/JPY': { price: 103.20, volatility: 0.04, decimals: 3 },
  'NZD/JPY': { price: 95.10, volatility: 0.04, decimals: 3 },
  'EUR/CHF': { price: 0.9750, volatility: 0.00015, decimals: 5 },
  'GBP/CHF': { price: 1.1550, volatility: 0.0002, decimals: 5 },
  'CAD/CHF': { price: 0.6620, volatility: 0.0002, decimals: 5 },
  'AUD/CAD': { price: 0.9100, volatility: 0.0002, decimals: 5 },
  'AUD/NZD': { price: 1.0900, volatility: 0.0002, decimals: 5 },
  'NZD/CAD': { price: 0.8350, volatility: 0.0002, decimals: 5 },
  'CHF/JPY': { price: 170.10, volatility: 0.05, decimals: 3 },
  'EUR/CAD': { price: 1.4850, volatility: 0.0002, decimals: 5 },
  'EUR/AUD': { price: 1.6300, volatility: 0.0002, decimals: 5 },
  'EUR/NZD': { price: 1.7750, volatility: 0.0002, decimals: 5 },
  'EUR/SEK': { price: 11.2500, volatility: 0.002, decimals: 4 },
  'EUR/SGD': { price: 1.4650, volatility: 0.0002, decimals: 5 },
  'GBP/SEK': { price: 13.2000, volatility: 0.002, decimals: 4 },
  'GBP/NZD': { price: 2.0850, volatility: 0.0003, decimals: 5 },
  'AUD/SGD': { price: 0.8950, volatility: 0.0002, decimals: 5 },
  'AUD/CHF': { price: 0.6050, volatility: 0.0002, decimals: 5 },
  'NZD/CHF': { price: 0.5550, volatility: 0.0002, decimals: 5 },
  'SGD/JPY': { price: 115.20, volatility: 0.04, decimals: 3 },
  
  // Exotics
  'USD/NOK': { price: 10.6500, volatility: 0.002, decimals: 4 },
  'USD/SEK': { price: 10.5500, volatility: 0.002, decimals: 4 },
  'USD/ZAR': { price: 18.2500, volatility: 0.005, decimals: 4 },
  'USD/HKD': { price: 7.8100, volatility: 0.0005, decimals: 4 },
  'USD/TRY': { price: 32.2000, volatility: 0.01, decimals: 4 },
  'USD/MXN': { price: 16.8500, volatility: 0.005, decimals: 4 },
  'USD/SGD': { price: 1.3450, volatility: 0.0002, decimals: 5 },
  'USD/PLN': { price: 3.9500, volatility: 0.001, decimals: 4 },
  'USD/HUF': { price: 358.50, volatility: 0.1, decimals: 2 },
  'HKD/JPY': { price: 19.85, volatility: 0.01, decimals: 3 },
  'NOK/JPY': { price: 14.50, volatility: 0.01, decimals: 3 },
  'SEK/JPY': { price: 14.65, volatility: 0.01, decimals: 3 },
};

// Store current price state for all pairs
const currentPrices: Record<string, number> = { 
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: PAIR_CONFIGS[key].price}), {}) 
};

// Store trend momentum for more realistic movements
const priceMomentum: Record<string, number> = {
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: 0}), {})
};

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

// Exponential Moving Average
const calculateEMA = (data: MarketDataPoint[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let ema = data[0].price;
  
  // Initialize with SMA
  for(let i=0; i<period && i<data.length; i++) {
     ema += data[i].price;
  }
  ema = ema / period;
  emaArray.push(ema);

  for (let i = period; i < data.length; i++) {
    ema = (data[i].price * k) + (ema * (1 - k));
    emaArray.push(ema);
  }
  return emaArray;
};

export const calculateMACD = (data: MarketDataPoint[]) => {
  if (data.length < 26) return null;
  
  // Simplified calculation for latest point
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  // Signal line is usually 9-period EMA of MACD line, approximating here for speed
  const signalLine = macdLine * 0.9; 
  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
};

export const calculateBollingerBands = (data: MarketDataPoint[], period: number = 20, stdDevMultiplier: number = 2) => {
  const sma = calculateSMA(data, period);
  if (!sma) return null;

  const slice = data.slice(-period);
  const squaredDiffs = slice.map(d => Math.pow(d.price - sma, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    upper: sma + (stdDev * stdDevMultiplier),
    lower: sma - (stdDev * stdDevMultiplier),
    middle: sma
  };
};

export const calculateATR = (data: MarketDataPoint[], period: number = 14): number | null => {
  if (data.length < period + 1) return null;
  // Simplified ATR: Average of high-low range (using just volatility simulation here as we have close prices)
  // In a real candle system we'd use High-Low. Here we use Math.abs(price - prevPrice) smoothed.
  let trSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
     trSum += Math.abs(data[i].price - data[i-1].price);
  }
  return trSum / period;
};

// --- Market Generation ---

export const generateMarketData = (pair: string = 'BTC/USD'): MarketDataPoint => {
  const now = new Date();
  
  // Update ALL pairs to ensure background trades trigger SL/TP even if not viewing the chart
  Object.keys(PAIR_CONFIGS).forEach(key => {
    const config = PAIR_CONFIGS[key];
    
    // Add momentum to creating trending behavior
    const trend = (Math.random() - 0.5) * config.volatility * 0.5;
    priceMomentum[key] = (priceMomentum[key] * 0.9) + trend; // Smoothing
    
    const noise = (Math.random() - 0.5) * config.volatility * 0.5;
    const move = priceMomentum[key] + noise;
    
    currentPrices[key] += move;
    
    // Safety check to prevent negative prices
    if (currentPrices[key] < 0.00001) currentPrices[key] = config.price;
  });

  // Return data for the specifically requested pair
  return {
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: currentPrices[pair],
    volume: Math.floor(Math.random() * 100 + 50)
  };
};

export const generateInitialHistory = (points: number, pair: string = 'BTC/USD'): MarketDataPoint[] => {
  const history: MarketDataPoint[] = [];
  let price = currentPrices[pair];
  const now = new Date();
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USD'];

  // Generate backwards to ensure continuity with current price
  for (let i = 0; i < points; i++) {
    const time = new Date(now.getTime() - i * 1500); // 1.5s intervals
    history.unshift({
        time: time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: price,
        volume: Math.floor(Math.random() * 100 + 50)
    });
    
    // Inverse move to go back in time
    const change = (Math.random() - 0.5) * config.volatility;
    price -= change;
  }
  
  return history;
};
