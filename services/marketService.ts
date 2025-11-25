import { MarketDataPoint } from '../types';

// Configuration for different pairs
const PAIR_CONFIGS: Record<string, { price: number, volatility: number, decimals: number }> = {
  'BTC/USD': { price: 65000, volatility: 50, decimals: 2 },
  'ETH/USD': { price: 3450, volatility: 12, decimals: 2 },
  'SOL/USD': { price: 145, volatility: 0.8, decimals: 2 },
  'XAU/USD': { price: 2350, volatility: 2, decimals: 2 }, // Gold
  'EUR/USD': { price: 1.0850, volatility: 0.0002, decimals: 5 }, // Forex
  'GBP/USD': { price: 1.2750, volatility: 0.0003, decimals: 5 }, // Forex
  'USD/JPY': { price: 155.50, volatility: 0.05, decimals: 3 }, // Forex (JPY)
  'AUD/USD': { price: 0.6650, volatility: 0.0003, decimals: 5 }, // Forex
  'USD/CAD': { price: 1.3700, volatility: 0.0003, decimals: 5 }, // Forex
  'USD/CHF': { price: 0.9100, volatility: 0.0003, decimals: 5 }, // Forex
  'NZD/USD': { price: 0.6100, volatility: 0.0003, decimals: 5 }, // Forex
  'EUR/GBP': { price: 0.8500, volatility: 0.0002, decimals: 5 }, // Forex
  'EUR/JPY': { price: 168.50, volatility: 0.06, decimals: 3 }    // Forex
};

// Store current price state for all pairs
const currentPrices: Record<string, number> = { 
  ...Object.keys(PAIR_CONFIGS).reduce((acc, key) => ({...acc, [key]: PAIR_CONFIGS[key].price}), {}) 
};

let timeStep = 0;

export const getPrice = (pair: string): number => {
  return currentPrices[pair] || PAIR_CONFIGS['BTC/USD'].price;
};

export const generateMarketData = (pair: string = 'BTC/USD'): MarketDataPoint => {
  const now = new Date();
  
  // Update ALL pairs to ensure background trades trigger SL/TP
  Object.keys(currentPrices).forEach(p => {
    const config = PAIR_CONFIGS[p];
    const volatility = config.volatility;
    
    // Main trend logic
    const trend = Math.sin((timeStep + (p.length * 10)) / 20) * (volatility / 2); 
    const noise = (Math.random() - 0.5) * volatility;
    
    currentPrices[p] += trend + noise;
    
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

  // We generate history going BACKWARDS from current price to ensure continuity
  let simPrice = currentPrices[pair];

  for (let i = count; i > 0; i--) {
    const volatility = config.volatility;
    const noise = (Math.random() - 0.5) * volatility;
    simPrice -= noise; // Reverse the walk
    
    // Time offset
    const time = new Date(Date.now() - i * 1500); 

    history.push({
      time: time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(simPrice.toFixed(config.decimals)),
      volume: Math.floor(Math.random() * 100) + 10
    });
  }
  
  // Sort by time (oldest first)
  return history;
};