import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, TradeType } from "../types";

// Helper to get formatted date
const getCurrentTimestamp = () => new Date().toISOString();

const getAIClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeMarket = async (
  dataHistory: MarketDataPoint[],
  currentBalance: number,
  riskLevel: string
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

  // Prepare the prompt context
  const recentData = dataHistory.slice(-20); // Send last 20 points to save tokens but give context
  const currentPrice = recentData[recentData.length - 1].price;
  
  const prompt = `
    You are an expert AI crypto trading bot.
    Current Date: ${getCurrentTimestamp()}
    Current Balance: $${currentBalance}
    Risk Profile: ${riskLevel}
    
    Market Data (Last 20 ticks for BTC/USD):
    ${JSON.stringify(recentData)}

    Analyze the price trend. Calculate a simplified RSI or Moving Average mentally based on the data provided.
    Determine if I should BUY, SELL, or HOLD.
    Calculate a dynamic Stop Loss and Take Profit based on the ${riskLevel} risk profile.
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
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
            reasoning: { type: Type.STRING, description: "Short, tactical explanation of the decision (max 1 sentence)." },
            stopLoss: { type: Type.NUMBER, description: "Recommended stop loss price" },
            takeProfit: { type: Type.NUMBER, description: "Recommended take profit price" }
          },
          required: ["recommendation", "confidence", "reasoning", "stopLoss", "takeProfit"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    // Map string to enum safely
    let rec = TradeType.HOLD;
    if (parsed.recommendation === "BUY") rec = TradeType.BUY;
    if (parsed.recommendation === "SELL") rec = TradeType.SELL;

    return {
      recommendation: rec,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      timestamp: new Date()
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback safe mode
    return {
      recommendation: TradeType.HOLD,
      confidence: 0,
      reasoning: "AI Analysis unavailable due to error.",
      stopLoss: currentPrice * 0.95,
      takeProfit: currentPrice * 1.05,
      timestamp: new Date()
    };
  }
};

export const chatWithAssistant = async (message: string, marketContext: string) => {
  const ai = getAIClient();
  if (!ai) return "I cannot reply without an API Key.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        System: You are 'Nexus', a trading assistant for the NexusTrade AI terminal. 
        You help users understand the market. Keep answers concise and professional.
        
        Current Market Context:
        ${marketContext}

        User: ${message}
      `
    });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the market servers right now.";
  }
};