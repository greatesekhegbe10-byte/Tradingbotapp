
import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, UserTier, BotConfig, STRATEGIES } from "../types";

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  pair: string,
  tier: UserTier = 'BASIC'
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const recentPrices = dataHistory.slice(-40).map(d => ({ p: d.price.toFixed(5), v: d.volume }));
  
  const systemInstructions = `NEXUS NEURAL TERMINAL v7.2 (Institutional HFT Protocol).
  MISSION: High-precision technical analysis for ${pair} using advanced Smart Money Concepts (SMC) and Liquidity Mapping.
  
  STRATEGY EFFICIENCY PROTOCOL:
  1. TARGET RR RATIO: Minimum 1:3 Profit-to-Risk ratio. Stop loss must be placed at the most recent local structure break.
  2. INSTITUTIONAL LIQUIDITY: Prioritize signals ONLY after a confirmed "Liquidity Sweep" (taking out old highs/lows) followed by a Market Structure Shift (MSS).
  3. ORDER BLOCKS & FVG: Entry must coincide with a Fair Value Gap or a high-volume Order Block.
  4. CONFIDENCE: Integer 0-100. Strictest criteria: 85+ required for 3-factor confluence.
  5. OUTPUT: Strict JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `MARKET_DATA: ${JSON.stringify(recentPrices)}\nINSTRUMENT: ${pair}\nACCESS_TIER: ${tier}`,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
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
          required: ["recommendation", "confidence", "marketDefinition", "stopLoss", "takeProfit", "suggestedLotSize"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Neural Node Analysis Failure:", e);
    throw e;
  }
};

export const chatWithAssistant = async (
  message: string,
  marketContext: string,
  config: BotConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `MARKET_STATE: ${marketContext}\nUSER_CONFIG: ${JSON.stringify(config)}\nQUERY: ${message}`,
      config: {
        systemInstruction: "You are the Nexus Institutional Terminal Assistant. Provide high-level technical insights, SMC explanations, and portfolio risk advice."
      }
    });
    return response.text || "Connection to neural cluster interrupted.";
  } catch (error) {
    return "The assistant node is currently offline.";
  }
};
