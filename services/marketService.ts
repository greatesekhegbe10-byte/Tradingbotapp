
import { MarketDataPoint } from '../types';

// Updated Fallback Configurations (Approximate Real Market Values as of Late 2024/Early 2025)
const PAIR_CONFIGS: Record<string, { price: number, volatility: number, decimals: number }> = {
  // Majors
  'EUR/USD': { price: 1.0820, volatility: 0.00015, decimals: 5 },
  'GBP/USD': { price: 1.2950, volatility: 0.0002, decimals: 5 },
  'USD/JPY': { price: 153.40, volatility: 0.04, decimals: 3 }, // Updated from 155.50
  'AUD/USD': { price: 0.6580, volatility: 0.0002, decimals: 5 },
  'NZD/USD': { price: 0.5980, volatility: 0.0002, decimals: 5 },
  'USD/CAD': { price: 1.3910, volatility: 0.0002, decimals: 5 },
  'USD/CHF': { price: 0.8650, volatility: 0.0002, decimals: 5 },
  
  // Commodities
  'XAU/USD': { price: 2745.50, volatility: 1.5, decimals: 2 }, // Gold updated
  'WTI/USD': { price: 71.50, volatility: 0.4, decimals: 2 }, 
  'BRENT/USD': { price: 75.20, volatility: 0.4, decimals: 2 },

  // Crypto
  'BTC/USD': { price: 72150.00, volatility: 35, decimals: 2 }, // BTC updated
  'ETH/USD': { price: 2650.00, volatility: 8, decimals: 2 },
  'SOL/USD': { price: 175.50, volatility: 0.5, decimals: 2 },

  // Minors / Crosses
  'GBP/JPY': { price: 198.80, volatility: 0.06, decimals: 3 },
  'EUR/JPY': { price: 166.10, volatility: 0.05, decimals: 3 },
  'EUR/GBP': { price: 0.8350, volatility: 0.00015, decimals: 5 },
  'GBP/CAD': { price: 1.8010, volatility: 0.0002, decimals: 5 },
  'CAD/JPY': { price: 110.20, volatility: 0.04, decimals: 3 },
  'AUD/JPY': { price: 100.90, volatility: 0.04, decimals: 3 },
  'NZD/JPY': { price: 91.70, volatility: 0.04, decimals: 3 },
  'EUR/CHF': { price: 0.9360, volatility: 0.00015, decimals: 5 },
  'GBP/CHF': { price: 1.1210, volatility: 0.0002, decimals: 5 },
  'CAD/CHF': { price: 0.6220, volatility: 0.0002, decimals: 5 },
  'AUD/CAD': { price: 0.9150, volatility: 0.0002, decimals: 5 },
  'AUD/NZD': { price: 1.1000, volatility: 0.0002, decimals: 5 },
  'NZD/CAD': { price: 0.8320, volatility: 0.0002, decimals: 5 },
  'CHF/JPY': { price: 177.30, volatility: 0.05, decimals: 3 },
  'EUR/CAD': { price: 1.5050, volatility: 0.0002, decimals: 5 },
  'EUR/AUD': { price: 1.6440, volatility: 0.0002, decimals: 5 },
  'EUR/NZD': { price: 1.8090, volatility: 0.0002, decimals: 5 },
  'EUR/SEK': { price: 11.5800, volatility: 0.002, decimals: 4 },
  'EUR/SGD': { price: 1.4320, volatility: 0.0002, decimals: 5 },
  'GBP/SEK': { price: 13.8500, volatility: 0.002, decimals: 4 },
  'GBP/NZD': { price: 2.1650, volatility: 0.0003, decimals: 5 },
  'AUD/SGD': { price: 0.8710, volatility: 0.0002, decimals: 5 },
  'AUD/CHF': { price: 0.5690, volatility: 0.0002, decimals: 5 },
  'NZD/CHF': { price: 0.5170, volatility: 0.0002, decimals: 5 },
  'SGD/JPY': { price: 115.80, volatility: 0.04, decimals: 3 },
  'HKD/JPY': { price: 19.72, volatility: 0.01, decimals: 3 },
  'NOK/JPY': { price: 13.95, volatility: 0.01, decimals: 3 },
  'SEK/JPY': { price: 14.33, volatility: 0.01, decimals: 3 },
  
  // Exotics
  'USD/NOK': { price: 10.9500, volatility: 0.002, decimals: 4 },
  'USD/SEK': { price: 10.6500, volatility: 0.002, decimals: 4 },
  'USD/ZAR': { price: 17.6500, volatility: 0.005, decimals: 4 },
  'USD/HKD': { price: 7.7700, volatility: 0.0005, decimals: 4 },
  'USD/TRY': { price: 34.2500, volatility: 0.01, decimals: 4 },
  'USD/MXN': { price: 20.1500, volatility: 0.005, decimals: 4 },
  'USD/SGD': { price: 1.3230, volatility: 0.0002, decimals: 5 },
  'USD/PLN': { price: 4.0100, volatility: 0.001, decimals: 4 },
  'USD/HUF': { price: 375.50, volatility: 0.1, decimals: 2 },
};

// Store current price state for all pairs
const currentPrices: Record<string, number> = { 
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: PAIR_CONFIGS[key].price}), {}) 
};

// Store trend momentum for more realistic movements
const priceMomentum: Record<string, number> = {
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: 0}), {})
};

// Function to fetch REAL market prices from public APIs
export const fetchLivePrices = async () => {
  try {
    // 1. Fetch Forex Rates (Base USD)
    const forexResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const forexData = await forexResponse.json();

    if (forexData && forexData.rates) {
      if (forexData.rates.JPY) currentPrices['USD/JPY'] = forexData.rates.JPY;
      if (forexData.rates.CAD) currentPrices['USD/CAD'] = forexData.rates.CAD;
      if (forexData.rates.CHF) currentPrices['USD/CHF'] = forexData.rates.CHF;
      if (forexData.rates.SGD) currentPrices['USD/SGD'] = forexData.rates.SGD;
      if (forexData.rates.ZAR) currentPrices['USD/ZAR'] = forexData.rates.ZAR;
      if (forexData.rates.SEK) currentPrices['USD/SEK'] = forexData.rates.SEK;
      if (forexData.rates.NOK) currentPrices['USD/NOK'] = forexData.rates.NOK;
      if (forexData.rates.MXN) currentPrices['USD/MXN'] = forexData.rates.MXN;
      
      if (forexData.rates.EUR) currentPrices['EUR/USD'] = 1 / forexData.rates.EUR;
      if (forexData.rates.GBP) currentPrices['GBP/USD'] = 1 / forexData.rates.GBP;
      if (forexData.rates.AUD) currentPrices['AUD/USD'] = 1 / forexData.rates.AUD;
      if (forexData.rates.NZD) currentPrices['NZD/USD'] = 1 / forexData.rates.NZD;

      if (forexData.rates.EUR && forexData.rates.JPY) currentPrices['EUR/JPY'] = forexData.rates.JPY / forexData.rates.EUR;
      if (forexData.rates.GBP && forexData.rates.JPY) currentPrices['GBP/JPY'] = forexData.rates.JPY / forexData.rates.GBP;
      if (forexData.rates.EUR && forexData.rates.GBP) currentPrices['EUR/GBP'] = forexData.rates.GBP / forexData.rates.EUR;
    }

    // 2. Fetch Crypto Prices
    const cryptoResponse = await fetch('https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,solana');
    const cryptoData = await cryptoResponse.json();

    if (cryptoData && cryptoData.data) {
       cryptoData.data.forEach((asset: any) => {
          const price = parseFloat(asset.priceUsd);
          if (asset.id === 'bitcoin') currentPrices['BTC/USD'] = price;
          if (asset.id === 'ethereum') currentPrices['ETH/USD'] = price;
          if (asset.id === 'solana') currentPrices['SOL/USD'] = price;
       });
    }

    console.log("Live prices synced successfully.");
  } catch (error) {
    console.warn("Failed to fetch live prices, using updated fallbacks:", error);
  }
};

export const getPairDetails = (pair: string) => {
  return PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USD'];
};

export const getPrice = (pair: string): number => {
  return currentPrices[pair] || PAIR_CONFIGS[pair]?.price || PAIR_CONFIGS['BTC/USD'].price;
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

const calculateEMA = (data: MarketDataPoint[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let ema = data[0].price;
  
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
  
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
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
  let trSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
     trSum += Math.abs(data[i].price - data[i-1].price);
  }
  return trSum / period;
};

// Stochastic RSI
export const calculateStochasticRSI = (data: MarketDataPoint[], period: number = 14, smoothK: number = 3, smoothD: number = 3) => {
  const rsiValues: number[] = [];
  // Calculate RSI for a sufficient window
  const requiredData = period + smoothK + smoothD + 20; // buffer
  if (data.length < requiredData) return null;

  // We need a series of RSI values
  for (let i = data.length - 20; i < data.length; i++) {
      const slice = data.slice(0, i+1);
      const r = calculateRSI(slice, period);
      if (r !== null) rsiValues.push(r);
  }

  if (rsiValues.length < period) return null;

  const currentRSI = rsiValues[rsiValues.length - 1];
  const windowRSI = rsiValues.slice(-period);
  const minRSI = Math.min(...windowRSI);
  const maxRSI = Math.max(...windowRSI);

  if (maxRSI === minRSI) return { k: 50, d: 50 }; // flat

  const stoch = ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
  // Simple smoothing approximation for this context
  return { k: stoch, d: stoch }; 
};

// Ichimoku Cloud (Approximation using Close prices as High/Low proxy for simplicity in this tick-based system)
export const calculateIchimokuCloud = (data: MarketDataPoint[]) => {
  if (data.length < 52) return null;

  const getHighLowAvg = (period: number) => {
      const slice = data.slice(-period);
      const prices = slice.map(d => d.price);
      return (Math.max(...prices) + Math.min(...prices)) / 2;
  };

  const tenkanSen = getHighLowAvg(9);
  const kijunSen = getHighLowAvg(26);
  const senkouSpanA = (tenkanSen + kijunSen) / 2;
  const senkouSpanB = getHighLowAvg(52);
  
  // Current Close relative to cloud (Cloud is usually shifted forward 26 periods)
  // Here we return the values calculated on *current* data to see where price sits
  return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      isAboveCloud: data[data.length - 1].price > Math.max(senkouSpanA, senkouSpanB),
      isBelowCloud: data[data.length - 1].price < Math.min(senkouSpanA, senkouSpanB)
  };
};

// --- Market Generation ---

export const generateMarketData = (pair: string = 'BTC/USD'): MarketDataPoint => {
  const now = new Date();
  
  // Update ALL pairs to ensure background trades trigger SL/TP even if not viewing the chart
  Object.keys(PAIR_CONFIGS).forEach(key => {
    const config = PAIR_CONFIGS[key];
    if (!config) return; 

    const trend = (Math.random() - 0.5) * config.volatility * 0.5;
    priceMomentum[key] = (priceMomentum[key] * 0.9) + trend; 
    
    const noise = (Math.random() - 0.5) * config.volatility * 0.5;
    const move = priceMomentum[key] + noise;
    
    currentPrices[key] += move;
    
    if (currentPrices[key] < 0.00001) currentPrices[key] = config.price;
  });

  const safePair = PAIR_CONFIGS[pair] ? pair : 'BTC/USD';
  return {
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: currentPrices[safePair],
    volume: Math.floor(Math.random() * 100 + 50)
  };
};

export const generateInitialHistory = (points: number, pair: string = 'BTC/USD'): MarketDataPoint[] => {
  const history: MarketDataPoint[] = [];
  const safePair = PAIR_CONFIGS[pair] ? pair : 'BTC/USD';
  let price = currentPrices[safePair] || PAIR_CONFIGS[safePair]?.price || 0;
  const now = new Date();
  const config = PAIR_CONFIGS[safePair] || PAIR_CONFIGS['BTC/USD'];

  for (let i = 0; i < points; i++) {
    const time = new Date(now.getTime() - i * 1500);
    history.unshift({
        time: time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: price,
        volume: Math.floor(Math.random() * 100 + 50)
    });
    
    const change = (Math.random() - 0.5) * config.volatility;
    price -= change;
  }
  
  return history;
};
