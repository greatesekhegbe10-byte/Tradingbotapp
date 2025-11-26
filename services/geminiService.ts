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
    You are a "Sniper" High-Frequency Trading AI. Your goal is 80% WIN RATE.
    You must Analyze the user's BALANCE and ensure minimal losses by calculating the precise Lot Size.

    USER FINANCIAL CONTEXT:
    - Balance: $${currentBalance}
    - Max $ Risk Allowed per Trade: $${maxRiskAmount.toFixed(2)}
    
    STRATEGY INSTRUCTIONS (80/100 Success Rate):
    1. **Confluence is King**: Only signal BUY/SELL if at least 3 indicators agree (e.g. RSI < 30 + Price at Lower Band + MACD Cross).
    2. **Risk Management**:
       - Calculate Stop Loss (SL) based on ATR (e.g. 1.5 * ATR).
       - Calculate Take Profit (TP) to be at least 1.5x to 2x the risk distance (Risk:Reward > 1.5).
       - **CRITICAL**: Calculate 'recommendedAmount' (Lot Size) such that if price hits SL, the loss is roughly $${maxRiskAmount.toFixed(2)}.
       - Formula: Amount = Max_Risk_Dollars / ABS(Entry - SL).
       - If calculated Amount exceeds available margin (Balance), reduce it to fit.
    3. **Trend Filtering**: Do not trade against the SMA(20) unless it's a confirmed reversal pattern (Double Bottom/Top).

    CONTEXT:
    Pair: ${pair}
    Current Price: ${currentPrice}
    Technicals: ${technicals}
    Recent Prices: ${JSON.stringify(recentData.slice(-5).map(d => d.price))}

    TASK:
    Generate a highly accurate signal. If market is choppy or signals conflict, output HOLD.

    OUTPUT JSON FORMAT:
    {
      "recommendation": "BUY" | "SELL" | "HOLD",
      "confidence": number (0-100),
      "reasoning": "Concise bullet point analysis of confluence and risk.",
      "stopLoss": number,
      "takeProfit": number,
      "recommendedAmount": number,
      "patterns": ["Pattern 1"],
      "marketStructure": "Bullish" | "Bearish" | "Ranging"
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
            confidence: { type: Type.NUMBER, description: "Confidence score 0-100. Be strict." },
            reasoning: { type: Type.STRING },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.NUMBER },
            recommendedAmount: { type: Type.NUMBER, description: "Optimized lot size for balance protection" },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketStructure: { type: Type.STRING }
          },
          required: ["recommendation", "confidence", "reasoning", "stopLoss", "takeProfit", "recommendedAmount", "patterns", "marketStructure"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    let rec = TradeType.HOLD;
    if (parsed.recommendation === "BUY") rec = TradeType.BUY;
    if (parsed.recommendation === "SELL") rec = TradeType.SELL;

    return {
      recommendation: rec,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      timestamp: new Date(),
      recommendedAmount: parsed.recommendedAmount,
      patterns: parsed.patterns || [],
      marketStructure: parsed.marketStructure || 'Neutral'
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "AI Disconnected.",
      stopLoss: currentPrice,
      takeProfit: currentPrice,
      timestamp: new Date(),
      recommendedAmount: 0,
      patterns: [],
      marketStructure: "Unknown"
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