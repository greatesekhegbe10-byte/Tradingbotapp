import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, TradeType, BotConfig } from "../types";
import { calculateRSI, calculateSMA, calculateMACD, calculateBollingerBands, calculateATR, calculateStochasticRSI, calculateIchimokuCloud } from "./marketService";

// Helper to get formatted date
const getCurrentTimestamp = () => new Date().toISOString();

const getAIClient = () => {
  try {
    // Robust check for environment variable
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      const key = process.env.API_KEY;
      // Basic format check (Google Keys usually start with AIza)
      if (key.length > 10 && !key.includes("YOUR_API_KEY")) {
         return new GoogleGenAI({ apiKey: key });
      }
    }
    console.warn("API Key missing or invalid format in process.env");
    return null;
  } catch (e) {
    console.error("Critical Error accessing API key context:", e);
    return null;
  }
}

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  currentBalance: number,
  riskLevel: string,
  pair: string,
  sensitivity: string = 'MEDIUM'
): Promise<AnalysisResult> => {
  
  const ai = getAIClient();
  const safePrice = dataHistory[dataHistory.length - 1]?.price || 0;
  
  // FAIL FAST: If AI client is null, return immediate system alert
  if (!ai) {
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "SYSTEM ALERT: API Key is missing or invalid. Bot halted for safety. Please check settings.",
      stopLoss: safePrice,
      takeProfit: safePrice,
      timestamp: new Date(),
      patterns: [],
      marketStructure: "OFFLINE"
    };
  }

  // Calculate Technical Indicators
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

  // Format indicators for prompt
  const technicals = `
    Price: ${currentPrice}
    RSI (14): ${rsi ? rsi.toFixed(2) : 'N/A'}
    Stochastic RSI: ${stochRsi ? `K: ${stochRsi.k.toFixed(2)}, D: ${stochRsi.d.toFixed(2)}` : 'N/A'}
    SMA (7): ${smaShort ? smaShort.toFixed(2) : 'N/A'}
    SMA (20): ${smaLong ? smaLong.toFixed(2) : 'N/A'}
    MACD: ${macd ? `Hist: ${macd.histogram.toFixed(4)}, Line: ${macd.macdLine.toFixed(4)}, Signal: ${macd.signalLine.toFixed(4)}` : 'N/A'}
    Bollinger: ${bands ? `Upper: ${bands.upper.toFixed(2)}, Lower: ${bands.lower.toFixed(2)}` : 'N/A'}
    Ichimoku: ${ichimoku ? `Above Cloud: ${ichimoku.isAboveCloud}, Below Cloud: ${ichimoku.isBelowCloud}` : 'N/A'}
    ATR: ${atr ? atr.toFixed(4) : 'N/A'}
  `;
  
  const prompt = `
    You are an Expert Crypto & Forex Trading AI (EEA Engine).
    Analyze the following market data for ${pair}.
    
    User Settings:
    - Balance: ${currentBalance}
    - Risk Level: ${riskLevel}
    - Signal Sensitivity: ${sensitivity}
    
    Current Price: ${currentPrice}
    
    Technical Indicators:
    ${technicals}
    
    Recent Price History (Last 10 candles): ${JSON.stringify(recentData.slice(-10).map(d => d.price))}
    
    Task:
    1. Identify Candlestick Patterns.
    2. Determine Market Structure.
    3. Analyze Indicator Divergences.
    4. Provide a Trade Recommendation (BUY, SELL, HOLD).
    5. Calculate precise Stop Loss (SL) and Take Profit (TP).
    
    Strict Rules:
    - Confidence must be > 85% for signals.
    - If data is ambiguous, return HOLD.
    
    Output strictly in JSON format matching this schema:
    {
      "recommendation": "BUY" | "SELL" | "HOLD",
      "confidence": number (0-100),
      "reasoning": "string",
      "stopLoss": number,
      "takeProfit": number,
      "patterns": ["string"],
      "marketStructure": "string"
    }
  `;

  const attemptAnalysis = async (retries = 2): Promise<any> => {
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
      if (!resultText) throw new Error("EMPTY_RESPONSE");
      return JSON.parse(resultText);

    } catch (error: any) {
      // 1. CATCH AUTH ERRORS specifically
      const errMsg = error.message || error.toString();
      if (
          errMsg.includes('401') || 
          errMsg.includes('403') || 
          errMsg.includes('API key') ||
          errMsg.includes('permission')
      ) {
         throw new Error("AUTH_FAILED");
      }

      // 2. Retry on Server Errors
      if (retries > 0 && (error.status === 500 || error.status === 503 || errMsg.includes('500') || errMsg.includes('fetch'))) {
        await wait(1500);
        return attemptAnalysis(retries - 1);
      }
      throw error;
    }
  };

  try {
    const parsed = await attemptAnalysis();
    
    const threshold = sensitivity === 'HIGH' ? 80 : 85;

    // Safety Filter
    if (parsed.confidence <= threshold && parsed.recommendation !== "HOLD") {
        parsed.recommendation = "HOLD";
        parsed.reasoning = `Confidence (${parsed.confidence}%) low. Defaulting to HOLD. ${parsed.reasoning}`;
    }

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

  } catch (error: any) {
    console.error("Gemini Analysis Final Fail:", error);
    
    let reasoning = "Market analysis temporarily unavailable.";
    let structure = "Unknown";
    
    if (error.message === "AUTH_FAILED") {
        reasoning = "CRITICAL: API Key Authentication Failed. Check your API Key configuration.";
        structure = "AUTH_ERR";
    } else if (error.message === "EMPTY_RESPONSE") {
        reasoning = "AI returned empty response. Retrying next cycle.";
    }

    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: reasoning,
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
  if (!ai) return "I cannot access the AI service. Please verify your API Key configuration.";

  const prompt = `
    You are Nexus, an Expert Trading Assistant.
    Context: ${marketContext}
    User: "${message}"
    Provide a concise trading insight or platform help.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I encountered an error. Please check your connection or API key.";
  }
};