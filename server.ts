import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow JSON payloads up to 25MB for image attachments
app.use(express.json({ limit: "25mb" }));

// -----------------------------------------------------------------
// Shared Study Groups & Academic Hub Persistence (Multi-Account Sync)
// -----------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const GROUPS_FILE = path.join(DATA_DIR, "shared_groups.json");
const MATERIALS_FILE = path.join(DATA_DIR, "shared_materials.json");
const SOLUTIONS_FILE = path.join(DATA_DIR, "shared_solutions.json");

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
      return fallback;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.warn(`Notice reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn(`Notice writing ${filePath}:`, err);
  }
}

// GET all shared study groups
app.get("/api/groups", (_req, res) => {
  const groups = readJsonFile<any[]>(GROUPS_FILE, []);
  res.json({ groups });
});

// POST /api/groups - Add or update a study group (immediately shared across all accounts)
app.post("/api/groups", (req, res) => {
  try {
    const { group } = req.body;
    if (!group || !group.id || !group.name) {
      return res.status(400).json({ error: "Missing required group fields" });
    }
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const existingIndex = groups.findIndex((g) => g.id === group.id);
    if (existingIndex >= 0) {
      groups[existingIndex] = { ...groups[existingIndex], ...group };
    } else {
      groups.unshift(group);
    }
    writeJsonFile(GROUPS_FILE, groups);
    res.json({ success: true, group });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to save group" });
  }
});

// DELETE /api/groups/:id - Delete a study group
app.delete("/api/groups/:id", (req, res) => {
  try {
    const { id } = req.params;
    let groups = readJsonFile<any[]>(GROUPS_FILE, []);
    groups = groups.filter((g) => g.id !== id);
    writeJsonFile(GROUPS_FILE, groups);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to delete group" });
  }
});

// POST /api/groups/:id/join - Join or leave group
app.post("/api/groups/:id/join", (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isJoining } = req.body;
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const targetGroup = groups.find((g) => g.id === id);
    if (!targetGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    const currentMembers: string[] = targetGroup.memberUids || [];
    let updatedMembers = [...currentMembers];
    if (isJoining) {
      if (userId && !updatedMembers.includes(userId)) {
        updatedMembers.push(userId);
      }
    } else {
      if (userId) {
        updatedMembers = updatedMembers.filter((u) => u !== userId);
      }
    }
    targetGroup.memberUids = updatedMembers;
    targetGroup.memberCount = Math.max(1, updatedMembers.length);
    writeJsonFile(GROUPS_FILE, groups);
    res.json({ success: true, group: targetGroup });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to join group" });
  }
});

// GET /api/materials
app.get("/api/materials", (_req, res) => {
  const materials = readJsonFile<any[]>(MATERIALS_FILE, []);
  res.json({ materials });
});

// POST /api/materials
app.post("/api/materials", (req, res) => {
  try {
    const { material } = req.body;
    if (!material || !material.id) {
      return res.status(400).json({ error: "Missing required material fields" });
    }
    const materials = readJsonFile<any[]>(MATERIALS_FILE, []);
    const existingIdx = materials.findIndex((m) => m.id === material.id);
    if (existingIdx >= 0) {
      materials[existingIdx] = { ...materials[existingIdx], ...material };
    } else {
      materials.unshift(material);
    }
    writeJsonFile(MATERIALS_FILE, materials);

    // If belongs to group, update group's materialsCount
    if (material.groupId) {
      const groups = readJsonFile<any[]>(GROUPS_FILE, []);
      const grp = groups.find((g) => g.id === material.groupId);
      if (grp) {
        grp.materialsCount = (grp.materialsCount || 0) + (existingIdx >= 0 ? 0 : 1);
        writeJsonFile(GROUPS_FILE, groups);
      }
    }
    res.json({ success: true, material });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to save material" });
  }
});

// DELETE /api/materials/:id
app.delete("/api/materials/:id", (req, res) => {
  try {
    const { id } = req.params;
    let materials = readJsonFile<any[]>(MATERIALS_FILE, []);
    materials = materials.filter((m) => m.id !== id);
    writeJsonFile(MATERIALS_FILE, materials);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to delete material" });
  }
});

// GET /api/solutions
app.get("/api/solutions", (_req, res) => {
  const solutions = readJsonFile<any[]>(SOLUTIONS_FILE, []);
  res.json({ solutions });
});

// POST /api/solutions
app.post("/api/solutions", (req, res) => {
  try {
    const { solution } = req.body;
    if (!solution || !solution.id) {
      return res.status(400).json({ error: "Missing required solution fields" });
    }
    const solutions = readJsonFile<any[]>(SOLUTIONS_FILE, []);
    const existingIdx = solutions.findIndex((s) => s.id === solution.id);
    if (existingIdx >= 0) {
      solutions[existingIdx] = { ...solutions[existingIdx], ...solution };
    } else {
      solutions.unshift(solution);
    }
    writeJsonFile(SOLUTIONS_FILE, solutions);

    // Also update material solutionsCount & isSolved
    if (solution.materialId) {
      const materials = readJsonFile<any[]>(MATERIALS_FILE, []);
      const mat = materials.find((m) => m.id === solution.materialId);
      if (mat) {
        mat.isSolved = true;
        mat.solutionsCount = (mat.solutionsCount || 0) + (existingIdx >= 0 ? 0 : 1);
        writeJsonFile(MATERIALS_FILE, materials);
      }
    }
    res.json({ success: true, solution });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to save solution" });
  }
});

// DELETE /api/solutions/:id
app.delete("/api/solutions/:id", (req, res) => {
  try {
    const { id } = req.params;
    let solutions = readJsonFile<any[]>(SOLUTIONS_FILE, []);
    solutions = solutions.filter((s) => s.id !== id);
    writeJsonFile(SOLUTIONS_FILE, solutions);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to delete solution" });
  }
});

// Lazy initialization for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Candidate models in priority order for highest availability, lowest latency, and minimal demand spikes
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

// AI Study Assistant Chat endpoint (supports text + image analysis)
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { prompt, imageBase64, imageMimeType, history } = req.body;

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

    let replyText: string | null = null;
    let lastError: any = null;

    // Resilient fallback across supported models to handle spikes in demand (503/429)
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        if (response && response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;

        // Check for 503 (high demand) or 429 (rate limit) to try fallback model
        const isTemporary =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.code === 503 ||
          err?.code === 429 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("UNAVAILABLE") ||
          err?.message?.includes("RESOURCE_EXHAUSTED");

        if (isTemporary) {
          // Brief pause before switching to the next candidate model
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        // For other errors, continue to the next model in the fallback chain
        continue;
      }
    }

    if (replyText) {
      return res.json({ reply: replyText });
    }

    // If all models failed, formulate a clean, human-readable error response
    let cleanMessage = "The AI Tutor is currently experiencing high demand. Please try again in a few moments.";
    if (lastError?.message) {
      try {
        const parsed = JSON.parse(lastError.message);
        if (parsed?.error?.message) {
          cleanMessage = parsed.error.message;
        }
      } catch {
        cleanMessage = lastError.message;
      }
    }

    console.error("All AI Tutor candidate models exhausted:", lastError);
    return res.status(503).json({
      error: cleanMessage,
      fallback: "AI Tutor is currently busy. Please click Retry or try again in a few moments.",
    });
  } catch (error: any) {
    console.error("AI Chat Assistant error:", error);
    return res.status(500).json({
      error: error?.message || "An unexpected error occurred while communicating with the AI Tutor.",
      fallback: "AI Tutor is currently busy. Please check your network or try again in a few moments."
    });
  }
});

// Vite middleware & Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: "spa",
    });

    // Cleanly disable Vite client WebSocket connection since HMR is disabled in this environment
    app.get("/@vite/client", async (_req, res, next) => {
      try {
        const mod = await vite.transformRequest("/@vite/client");
        if (mod && mod.code) {
          const cleanCode = mod.code
            .replace("transport.connect(createHMRHandler(handleMessage));", "/* HMR WebSocket disabled in environment */")
            .replace("console.error(`[vite] failed to connect to websocket", "console.debug(`[vite] HMR notice");
          res.setHeader("Content-Type", "application/javascript");
          return res.send(cleanCode);
        }
      } catch {
        // fallback
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudySolve full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
