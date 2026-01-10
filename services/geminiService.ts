
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
  
  // Create a list of available strategies for the AI to choose from
  const strategyOptions = STRATEGIES.map(s => `${s.id}: ${s.name} (${s.description})`).join(', ');

  const systemInstructions = `NEXUS NEURAL HFT CORE v23.
  MISSION: High-precision technical analysis for ${pair}. 
  
  STRATEGY SELECTION PROTOCOL:
  You must recommend the most suitable strategy ID from this list: [${STRATEGIES.map(s => s.id).join(', ')}].
  - Use HFT_SNIPER for high volatility or rapid micro-movements.
  - Use PRO_SENTINEL for strong trending markets with volume confirmation.
  - Use BASIC_RSI for sideways/ranging markets with clear overbought/oversold levels.
  - Use VIP_LIQUIDITY for markets with fair value gaps or liquidity voids.

  CORE TASKS:
  1. DEFINE: Market state (e.g., "Aggressive Bullish Breakout").
  2. PATTERN: Identify candlestick pattern.
  3. TIMING: Provide entry directive.
  4. EXECUTION: SL, TP, and Lot Size.
  
  CONTEXT: Tier ${tier}. News: ${newsItems.join('; ')}.
  OUTPUT: JSON only. Ensure 'recommendedStrategyId' is one of the valid IDs provided.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `DATA: ${JSON.stringify(recentPrices)}\nASSET: ${pair}\nTIER: ${tier}`,
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
            recommendedStrategyId: { type: Type.STRING, description: "The ID of the strategy best suited for this condition." },
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
          required: ["recommendation", "confidence", "recommendedStrategyId", "stopLoss", "takeProfit"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Analysis Failure:", e);
    throw e;
  }
};

export const chatWithAssistant = async (
  message: string,
  marketContext: string,
  config: BotConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview', 
    config: {
      systemInstruction: `Nexus AI Assistant. Provide technical trading insights. Current config: ${JSON.stringify(config)}`,
    },
  });
  
  try {
    const response = await chat.sendMessage({ message });
    return response.text || "Connection lost.";
  } catch (error) {
    return "Error processing request.";
  }
};
