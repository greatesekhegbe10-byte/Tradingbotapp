import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, TradeType, BotConfig } from "../types";
import { calculateRSI, calculateSMA, calculateMACD, calculateBollingerBands, calculateATR } from "./marketService";

// Helper to get formatted date
const getCurrentTimestamp = () => new Date().toISOString();

const getAIClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  currentBalance: number,
  riskLevel: string,
  pair: string
): Promise<AnalysisResult> => {
  
  const ai = getAIClient();
  if (!ai) {
    console.error("API Key not found");
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "API Key missing. Cannot perform analysis.",
      stopLoss: 0,
      takeProfit: 0,
      timestamp: new Date()
    };
  }

  // Calculate Technical Indicators
  const recentData = dataHistory.slice(-50); // Need more data for accurate SMA
  const currentPrice = recentData[recentData.length - 1].price;
  
  const rsi = calculateRSI(recentData, 14);
  const smaShort = calculateSMA(recentData, 7); // Fast MA
  const smaLong = calculateSMA(recentData, 20); // Slow MA
  const macd = calculateMACD(recentData);
  const bands = calculateBollingerBands(recentData);
  const atr = calculateATR(recentData);

  // Format indicators for prompt
  const technicals = `
    Price: ${currentPrice}
    RSI (14): ${rsi ? rsi.toFixed(2) : 'N/A'}
    SMA (7): ${smaShort ? smaShort.toFixed(5) : 'N/A'}
    SMA (20): ${smaLong ? smaLong.toFixed(5) : 'N/A'}
    MACD: ${macd ? `Hist: ${macd.histogram.toFixed(5)}` : 'N/A'}
    Bollinger: ${bands ? `Upper: ${bands.upper.toFixed(5)}, Lower: ${bands.lower.toFixed(5)}` : 'N/A'}
    ATR: ${atr ? atr.toFixed(5) : 'N/A'}
  `;
  
  // Define risk dollars based on level and balance
  const riskPct = riskLevel === 'HIGH' ? 0.05 : riskLevel === 'MEDIUM' ? 0.02 : 0.01; // 1%, 2%, 5% of balance risk per trade
  const maxRiskAmount = currentBalance * riskPct;

  const prompt = `
    You are an ADAPTIVE Institutional Trading AI. 
    Your Core Directive: ADAPT to the current Market Phase to generate "Sure Signals" with >85% accuracy.

    USER CONTEXT:
    - Balance: $${currentBalance}
    - Risk Cap: $${maxRiskAmount.toFixed(2)}
    
    STEP 1: IDENTIFY MARKET PHASE
    Analyze the recent price action and technicals to determine the phase:
    - **Accumulation**: Price ranging at lows, RSI rising.
    - **Uptrend**: Price > SMA20 > SMA50, Higher Highs.
    - **Distribution**: Price ranging at highs, MACD divergence.
    - **Downtrend**: Price < SMA20 < SMA50, Lower Lows.
    - **Choppy**: No clear direction, narrow Bollinger Bands.

    STEP 2: ADAPTIVE STRATEGY (The "Sure Signal" Logic)
    - **If Uptrend**: ONLY signal BUY on pullbacks to SMA/EMA or Breakouts. Ignore Sell signals.
    - **If Downtrend**: ONLY signal SELL on rallies to SMA/EMA or Breakdowns. Ignore Buy signals.
    - **If Accumulation/Distribution**: Trade the Range Boundaries (Buy Support / Sell Resistance).
    - **If Choppy**: OUTPUT HOLD. Do not trade.

    STEP 3: CALCULATE ENTRY & RISK
    - **Confidence > 85% Requirement**: Pattern MUST match Market Phase (e.g. Bull Flag in Uptrend).
    - Stop Loss (SL): Set strictly using ATR (e.g. Price - 1.5*ATR for Buy).
    - Take Profit (TP): Must offer > 1.5x Reward relative to Risk.
    - Recommended Amount: Calculate lot size to risk exactly $${maxRiskAmount.toFixed(2)} if SL is hit.

    CONTEXT:
    Pair: ${pair}
    Current Price: ${currentPrice}
    Technicals: ${technicals}
    Recent Trend Data: ${JSON.stringify(recentData.slice(-10).map(d => d.price))}

    OUTPUT JSON FORMAT:
    {
      "recommendation": "BUY" | "SELL" | "HOLD",
      "confidence": number (0-100),
      "marketPhase": "Accumulation" | "Uptrend" | "Distribution" | "Downtrend" | "Choppy",
      "reasoning": "Explain strategy adaption (e.g., 'Uptrend detected, buying the pullback to SMA20').",
      "stopLoss": number,
      "takeProfit": number,
      "recommendedAmount": number,
      "patterns": ["Found Pattern"],
      "marketStructure": "Bullish" | "Bearish" | "Neutral"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
            confidence: { type: Type.NUMBER, description: "Confidence score. Must be > 85 for action." },
            marketPhase: { type: Type.STRING, enum: ["Accumulation", "Uptrend", "Distribution", "Downtrend", "Choppy"] },
            reasoning: { type: Type.STRING },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.NUMBER },
            recommendedAmount: { type: Type.NUMBER },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketStructure: { type: Type.STRING }
          },
          required: ["recommendation", "confidence", "marketPhase", "reasoning", "stopLoss", "takeProfit", "recommendedAmount", "patterns", "marketStructure"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    let rec = TradeType.HOLD;
    
    // STRICT CLIENT-SIDE FILTER FOR "SURE SIGNALS"
    if (parsed.confidence > 85 && parsed.marketPhase !== 'Choppy') {
      if (parsed.recommendation === "BUY") rec = TradeType.BUY;
      if (parsed.recommendation === "SELL") rec = TradeType.SELL;
    } else {
      rec = TradeType.HOLD; // Default to HOLD if confidence is low or market is choppy
    }

    return {
      recommendation: rec,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      timestamp: new Date(),
      recommendedAmount: parsed.recommendedAmount,
      patterns: parsed.patterns || [],
      marketStructure: parsed.marketStructure || 'Neutral',
      marketPhase: parsed.marketPhase || 'Choppy'
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    const safePrice = dataHistory[dataHistory.length - 1]?.price || 0;
    
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "Market analysis temporarily unavailable.",
      stopLoss: safePrice,
      takeProfit: safePrice,
      timestamp: new Date(),
      recommendedAmount: 0,
      patterns: [],
      marketStructure: "Unknown",
      marketPhase: "Choppy"
    };
  }
};

export const chatWithAssistant = async (message: string, marketContext: string, userConfig: BotConfig) => {
  const ai = getAIClient();
  if (!ai) return "I cannot reply without an API Key.";

  const systemInstructions = `
    You are the NexusTrade Strategy Guardian.
    
    USER FINANCIALS:
    - Balance: $${userConfig.balance}
    - Risk Level: ${userConfig.riskLevel}
    - Pro Status: ${userConfig.isPro ? 'Active' : 'Inactive'}
    
    GOAL: Help the user trade safely and maximize profits.
    
    RULES:
    1. If the user has a low balance (<$100), strictly advise them to use LOW risk and micro-lots.
    2. Explain your signals based on Confluence (RSI + MACD + Structure).
    3. If asked about Pro features, check 'isPro'. If false, check 'paymentStatus'. 
       Format: [Access Status] → [Payment Status] → [Instruction]
    
    CONTEXT:
    ${marketContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        ${systemInstructions}
        User Message: ${message}
      `
    });
    return response.text;
  } catch (error) {
    return "Connection error.";
  }
};