import { GoogleGenAI } from "@google/genai";

// Lazy initialization for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // Enable basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { prompt, imageBase64, imageMimeType, history } = req.body || {};

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: "Please provide either a question prompt or an image to analyze." });
    }

    const ai = getAIClient();

    const systemInstruction = 
      "You are 'StudySolve AI Tutor', a master academic mentor specialized in Financial Accounting, Taxation, Corporate & Business Law, Costing, Economics, and STEM problem solving. " +
      "Your objective is to guide students step-by-step through academic problems, past-exam questions, calculations, and concepts. " +
      "Guidelines: " +
      "1. If an image is provided (e.g., photo of a ledger, balance sheet, tax calculation, or handwritten math/diagram), inspect it thoroughly and identify key figures and potential errors. " +
      "2. Structure your guidance clearly: " +
      "   - **Direct Answer / Concept Overview**: State the core governing rule, accounting standard, or formula. " +
      "   - **Step-by-Step Working**: Provide clean, numbered calculation steps with units and reasoning. " +
      "   - **Key Exam/Study Tip**: Highlight common pitfalls students make on this type of problem. " +
      "3. Be encouraging, concise, and academically precise. Use clean markdown formatting with bolding and lists.";

    const currentParts: any[] = [];

    if (imageBase64) {
      currentParts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    if (prompt) {
      currentParts.push({ text: prompt });
    }

    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        if (item.role && item.text) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.text }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const replyText = response.text || "I was unable to formulate an explanation. Please try providing more context or a clearer photo.";
    return res.status(200).json({ reply: replyText });
  } catch (error: any) {
    console.error("Vercel AI Chat API error:", error);
    return res.status(500).json({
      error: error?.message || "An unexpected error occurred while communicating with the AI Tutor.",
      fallback: "AI Tutor is currently busy. Please check your network or try again in a few moments."
    });
  }
}
