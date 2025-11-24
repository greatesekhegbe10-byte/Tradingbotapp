import { MarketDataPoint } from '../types';

// Initial seed price
let currentPrice = 45000;
let timeStep = 0;

export const generateMarketData = (): MarketDataPoint => {
  const now = new Date();
  
  // Simulate random walk with some trend
  const volatility = 50; // Price swing magnitude
  const trend = Math.sin(timeStep / 20) * 20; // Slight sine wave trend
  const noise = (Math.random() - 0.5) * volatility;
  
  currentPrice = currentPrice + trend + noise;
  
  // Ensure price doesn't go negative or too low
  if (currentPrice < 1000) currentPrice = 1000;

  timeStep++;

  return {
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: parseFloat(currentPrice.toFixed(2)),
    volume: Math.floor(Math.random() * 100) + 10
  };
};

export const generateInitialHistory = (count: number): MarketDataPoint[] => {
  const history: MarketDataPoint[] = [];
  // Reset for consistent initial load
  currentPrice = 45000; 
  timeStep = 0;
  
  for (let i = 0; i < count; i++) {
    history.push(generateMarketData());
  }
  return history;
};