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
    SMA (7): ${smaShort ? smaShort.toFixed(2) : 'N/A'}
    SMA (20): ${smaLong ? smaLong.toFixed(2) : 'N/A'}
    MACD: ${macd ? `Hist: ${macd.histogram.toFixed(4)}` : 'N/A'}
    Bollinger: ${bands ? `Upper: ${bands.upper.toFixed(2)}, Lower: ${bands.lower.toFixed(2)}` : 'N/A'}
    ATR: ${atr ? atr.toFixed(4) : 'N/A'}
  `;
  
  const prompt = `
    You are an Expert Crypto & Forex Trading AI.
    Analyze the following market data for ${pair}.
    
    Current Price: ${currentPrice}
    
    Technical Indicators:
    ${technicals}
    
    Recent Price History (Last 10 candles): ${JSON.stringify(recentData.slice(-10).map(d => d.price))}
    
    Task:
    1. Identify Candlestick Patterns (e.g., Hammer, Doji, Engulfing, Shooting Star).
    2. Determine Market Structure (Bullish, Bearish, Ranging).
    3. Provide a Trade Recommendation (BUY, SELL, HOLD).
    4. Calculate precise Stop Loss (SL) and Take Profit (TP) levels to minimize loss.
    
    Strict Rules:
    - Only recommend BUY or SELL if confidence is ABOVE 70%. Otherwise, output HOLD.
    - Stop Loss should be tight (based on ATR or recent support/resistance).
    - Take Profit should be at least 1.5x the risk.
    
    Output strictly in JSON format matching this schema:
    {
      "recommendation": "BUY" | "SELL" | "HOLD",
      "confidence": number (0-100),
      "reasoning": "string (brief explanation of patterns and indicators)",
      "stopLoss": number,
      "takeProfit": number,
      "patterns": ["string", "string"],
      "marketStructure": "string"
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
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.NUMBER },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketStructure: { type: Type.STRING }
          },
          required: ["recommendation", "confidence", "reasoning", "stopLoss", "takeProfit"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    return {
      recommendation: parsed.recommendation === "BUY" ? TradeType.BUY : parsed.recommendation === "SELL" ? TradeType.SELL : TradeType.HOLD,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      timestamp: new Date(),
      patterns: parsed.patterns || [],
      marketStructure: parsed.marketStructure || 'Neutral'
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
      patterns: [],
      marketStructure: "Unknown"
    };
  }
};

export const chatWithAssistant = async (
  message: string,
  marketContext: string,
  config: BotConfig
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "I cannot access the AI service at the moment. Please check your API key.";

  const prompt = `
    You are Nexus, an Expert Trading Assistant.
    
    Context Information:
    ${marketContext}
    
    User Configuration:
    - Pair: ${config.pair}
    - Risk Level: ${config.riskLevel}
    - Balance: $${config.balance.toFixed(2)}
    
    User Message: "${message}"
    
    Provide a concise, professional, and helpful response. Focus on trading insights, technical analysis explanation, or platform assistance.
    Do not give financial advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nexus, a professional trading AI assistant."
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I encountered an error while processing your request.";
  }
};
