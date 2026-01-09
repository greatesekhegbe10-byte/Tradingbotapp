
import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, TradeType, BotConfig } from "../types";
import { calculateRSI, calculateSMA, calculateMACD, calculateBollingerBands, calculateATR, calculateStochasticRSI, calculateIchimokuCloud } from "./marketService";

// MODULE-LEVEL STATE FOR RATE LIMITING
let apiCooldownUntil = 0;

const getAIClient = () => {
  try {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey.length > 10 && !apiKey.includes("YOUR_API_KEY")) {
      return new GoogleGenAI({ apiKey });
    }
    console.warn("NexusTrade: API Key missing or invalid.");
    return null;
  } catch (e) {
    console.error("NexusTrade: Critical Error accessing API context:", e);
    return null;
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  currentBalance: number,
  riskLevel: string,
  pair: string,
  sensitivity: string = 'MEDIUM'
): Promise<AnalysisResult> => {
  
  const safePrice = dataHistory[dataHistory.length - 1]?.price || 0;

  if (Date.now() < apiCooldownUntil) {
    const remaining = Math.ceil((apiCooldownUntil - Date.now()) / 1000);
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: `API Rate Limit Active. Cooling down for ${remaining}s. Analysis paused.`,
      stopLoss: safePrice,
      takeProfit: safePrice,
      timestamp: new Date(),
      patterns: [],
      marketStructure: "RATE_LIMIT"
    };
  }

  const ai = getAIClient();
  if (!ai) {
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "SYSTEM ALERT: API Key is missing. Bot halted for safety.",
      stopLoss: safePrice,
      takeProfit: safePrice,
      timestamp: new Date(),
      patterns: [],
      marketStructure: "AUTH_ERR"
    };
  }

  const recentData = dataHistory.slice(-50); 
  const currentPrice = recentData[recentData.length - 1].price;
  
  const rsi = calculateRSI(recentData, 14);
  const smaShort = calculateSMA(recentData, 7); 
  const smaLong = calculateSMA(recentData, 20); 
  const macd = calculateMACD(recentData);
  const bands = calculateBollingerBands(recentData);
  const atr = calculateATR(recentData);
  const stochRsi = calculateStochasticRSI(recentData);
  const ichimoku = calculateIchimokuCloud(recentData);

  const technicals = `
    Pair: ${pair} | Price: ${currentPrice}
    RSI: ${rsi?.toFixed(2) || 'N/A'} | StochRSI K: ${stochRsi?.k.toFixed(2) || 'N/A'}
    SMA7: ${smaShort?.toFixed(2) || 'N/A'} | SMA20: ${smaLong?.toFixed(2) || 'N/A'}
    MACD Hist: ${macd?.histogram.toFixed(4) || 'N/A'}
    Bollinger Upper: ${bands?.upper.toFixed(2) || 'N/A'} | Lower: ${bands?.lower.toFixed(2) || 'N/A'}
    Ichimoku Above Cloud: ${ichimoku?.isAboveCloud}
  `;
  
  const prompt = `
    Analyze ${pair} with these parameters:
    Balance: $${currentBalance} | Risk: ${riskLevel} | Sensitivity: ${sensitivity}
    
    Data:
    ${technicals}
    Recent History: ${JSON.stringify(recentData.slice(-10).map(d => d.price))}
  `;

  const systemInstruction = `You are the Nexus EEA (Expert Electronic Assistant) trading engine. 
  Your goal is to provide high-precision trade signals (BUY, SELL, HOLD). 
  Analyze candlestick patterns, market structure (Bullish, Bearish, Ranging), and indicator divergences. 
  Rules: 
  - Confidence > 85% required for BUY/SELL. 
  - Calculate SL/TP based on ATR and recent volatility. 
  - Output ONLY valid JSON.`;

  const attemptAnalysis = async (retries = 1): Promise<any> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          systemInstruction,
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
      if (!resultText) throw new Error("EMPTY_RESPONSE");
      return JSON.parse(resultText);
    } catch (error: any) {
      const errMsg = error.message || "";
      if (errMsg.includes('429') || errMsg.includes('quota')) throw new Error("QUOTA_EXCEEDED");
      if (errMsg.includes('401') || errMsg.includes('403')) throw new Error("AUTH_FAILED");
      if (retries > 0) {
        await wait(1000);
        return attemptAnalysis(retries - 1);
      }
      throw error;
    }
  };

  try {
    const parsed = await attemptAnalysis();
    const threshold = sensitivity === 'HIGH' ? 80 : 85;

    if (parsed.confidence < threshold && parsed.recommendation !== "HOLD") {
      parsed.recommendation = "HOLD";
      parsed.reasoning = `Confidence ${parsed.confidence}% is below sensitivity threshold. ${parsed.reasoning}`;
    }

    return {
      recommendation: parsed.recommendation as TradeType,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      timestamp: new Date(),
      patterns: parsed.patterns || [],
      marketStructure: parsed.marketStructure || 'Neutral'
    };
  } catch (error: any) {
    console.error("Gemini Analysis Failure:", error);
    let structure = "ERR";
    let reasoning = "Analysis engine offline.";
    
    if (error.message === "QUOTA_EXCEEDED") {
      apiCooldownUntil = Date.now() + 60000;
      structure = "RATE_LIMIT";
      reasoning = "API limit reached. Syncing cooldown...";
    }

    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning,
      stopLoss: safePrice,
      takeProfit: safePrice,
      timestamp: new Date(),
      patterns: [],
      marketStructure: structure
    };
  }
};

export const chatWithAssistant = async (
  message: string,
  marketContext: string,
  config: BotConfig
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI service unavailable. Check API configuration.";
  if (Date.now() < apiCooldownUntil) return "System cooling down. Please wait.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: message,
      config: {
        systemInstruction: `You are Nexus, a helpful crypto and forex trading assistant. Context: ${marketContext}. Keep responses concise and focused on trading data.`
      }
    });
    return response.text || "No response received.";
  } catch (error: any) {
    return "I encountered a communication error. Please try again.";
  }
};
