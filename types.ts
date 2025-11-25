export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD'
}

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  price: number;
  amount: number;
  timestamp: Date;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  closePrice?: number;
  closeTime?: Date;
  status: 'OPEN' | 'CLOSED';
}

export interface AnalysisResult {
  recommendation: TradeType;
  confidence: number; // 0-100
  reasoning: string;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
}

export interface BotConfig {
  isActive: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pair: string;
  balance: number;
  broker?: string;
  isPro: boolean; // Added isPro flag
}