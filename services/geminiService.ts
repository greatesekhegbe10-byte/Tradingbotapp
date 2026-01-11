
import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, UserTier, BotConfig, STRATEGIES } from "../types";

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  pair: string,
  tier: UserTier = 'BASIC',
  newsItems: string[] = []
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const recentPrices = dataHistory.slice(-20).map(d => ({ p: d.price.toFixed(5), v: d.volume }));
  
  const systemInstructions = `NEXUS NEURAL HFT CORE v24.
  MISSION: High-precision institutional technical analysis for ${pair}. 
  
  CORE TASKS:
  1. MARKET SITUATION: Define the current market phase (e.g., "Impulsive Bullish Breakout after Accumulation").
  2. CANDLESTICK PATTERN: Identify specific price action patterns (e.g., "Bullish Engulfing", "Morning Star").
  3. RECOMMENDATION: Explicit "BUY", "SELL", or "HOLD".
  4. EXECUTION PARAMETERS: Provide Stop Loss (SL), Take Profit (TP), and suggested Lot Size (e.g., "0.50").
  5. TIMING: Provide precise entry directive.
  
  OUTPUT: Strict JSON only. All numeric values must be relative to current price.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `DATA_FEED: ${JSON.stringify(recentPrices)}\nTARGET_ASSET: ${pair}\nTIER_ACCESS: ${tier}`,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
            confidence: { type: Type.NUMBER },
            marketDefinition: { type: Type.STRING },
            candlestickPattern: { type: Type.STRING },
            entryTiming: { type: Type.STRING },
            recommendedStrategyId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            primarySignal: { type: Type.STRING },
            confirmations: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
            volatility: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            suggestedLotSize: { type: Type.STRING },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.NUMBER },
            newsContext: { type: Type.STRING }
          },
          required: ["recommendation", "confidence", "marketDefinition", "candlestickPattern", "stopLoss", "takeProfit", "suggestedLotSize"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Neural Analysis Failure:", e);
    throw e;
  }
};

/**
 * Added chatWithAssistant function to handle AI chat messages with market context.
 */
export const chatWithAssistant = async (
  message: string,
  marketContext: string,
  config: BotConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `MARKET_DATA: ${marketContext}\nBOT_CONFIG: ${JSON.stringify(config)}\nUSER_QUERY: ${message}`,
      config: {
        systemInstruction: "You are the Nexus Neural Assistant, an expert AI specialized in high-frequency trading and institutional market analysis. Provide technical, professional, and data-driven responses. If requested, analyze trends or explain market concepts concisely."
      }
    });
    return response.text || "I am unable to provide a response at this time.";
  } catch (error) {
    console.error("Assistant Chat Failure:", error);
    return "The neural node encountered an error processing your request.";
  }
};
