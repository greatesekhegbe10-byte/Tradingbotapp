import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataPoint, AnalysisResult, TradeType, BotConfig } from "../types";

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

  // Prepare the prompt context
  const recentData = dataHistory.slice(-20); // Send last 20 points
  const currentPrice = recentData[recentData.length - 1].price;
  
  const prompt = `
    You are an expert AI trading bot analyzing ${pair}.
    Current Date: ${getCurrentTimestamp()}
    Current Balance: $${currentBalance}
    Risk Profile: ${riskLevel}
    Current Price: ${currentPrice}
    
    Market Data (Last 20 ticks for ${pair}):
    ${JSON.stringify(recentData)}

    Analyze the price trend for ${pair}.
    Determine if I should BUY, SELL, or HOLD.
    Calculate a dynamic Stop Loss and Take Profit based on the ${riskLevel} risk profile and the specific volatility of ${pair}.
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

export const chatWithAssistant = async (message: string, marketContext: string, userConfig: BotConfig) => {
  const ai = getAIClient();
  if (!ai) return "I cannot reply without an API Key.";

  // STRICT ACCESS CONTROL LOGIC INJECTION
  const systemInstructions = `
    You are the access-control and logic engine for the NexusTrade application.
    
    USER STATUS:
    - Pro Active: ${userConfig.isPro}
    - Payment Status: ${userConfig.paymentStatus}
    - Current Risk Level: ${userConfig.riskLevel}
    
    SYSTEM RULES (DO NOT IGNORE):
    1. The app has Free Features and Pro Features.
    2. Users CANNOT access Pro features (like 'HIGH' risk, Gold/XAU pairs, or unlimited trades) until bank payment verification is confirmed.
    3. Payment Flow: User pays -> Bank API confirms -> Status becomes 'VERIFIED' -> Pro unlocks.
    4. If user asks for Pro features and isPro is false:
       - Check paymentStatus.
       - If 'PENDING': Tell them "Payment is currently being verified by the bank API."
       - If 'UNPAID': Tell them "Access Denied. Please complete the bank transfer to upgrade."
    
    OUTPUT FORMAT:
    If the user asks about their account status, access, or pro features, you MUST use this format:
    [Access Status] → [Payment Status] → [Instruction to User]

    Example: [Denied] → [Pending Verification] → Please wait while Kuda Bank confirms your transaction.
    
    Otherwise, if the user asks about the market, answer normally as a trading assistant using this context:
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
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the market servers right now.";
  }
};