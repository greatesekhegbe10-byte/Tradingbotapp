
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
  // Trailing Stop Fields
  highestPrice?: number; // For tracking max price reached in a BUY
  lowestPrice?: number;  // For tracking min price reached in a SELL
  isTrailing?: boolean;  // If the SL has started trailing
}

export interface AnalysisResult {
  recommendation: TradeType;
  confidence: number; // 0-100
  reasoning: string;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
  // New Fields for visual feedback
  patterns?: string[];
  marketStructure?: string;
}

export interface BotConfig {
  isActive: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  pair: string;
  balance: number;
  isPro: boolean;
  paymentStatus: 'UNPAID' | 'PENDING' | 'VERIFIED';
}
