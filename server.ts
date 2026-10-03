import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Process-level guards against unexpected crashes causing "This page isn't available"
process.on("uncaughtException", (err) => {
  console.error("Uncaught server exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled server rejection:", reason);
});

const app = express();
const PORT = 3000;

// Enable CORS and preflight handling for all API requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Allow JSON payloads up to 25MB for image attachments
app.use(express.json({ limit: "25mb" }));

// -----------------------------------------------------------------
// Shared Study Groups & Academic Hub Persistence (Multi-Account Sync)
// -----------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const GROUPS_FILE = path.join(DATA_DIR, "shared_groups.json");
const MATERIALS_FILE = path.join(DATA_DIR, "shared_materials.json");
const DELETED_MATERIALS_FILE = path.join(DATA_DIR, "deleted_materials.json");
const SOLUTIONS_FILE = path.join(DATA_DIR, "shared_solutions.json");
const USERS_FILE = path.join(DATA_DIR, "shared_users.json");
const MESSAGES_FILE = path.join(DATA_DIR, "group_messages.json");

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

// GET /api/groups/lookup - Lookup private study group by secret code, invite token, or ID
app.get("/api/groups/lookup", (req, res) => {
  try {
    const rawCode = ((req.query.code as string) || "").trim().toUpperCase();
    const rawToken = ((req.query.token as string) || "").trim();
    const rawGroupId = ((req.query.groupId as string) || "").trim();

    if (!rawCode && !rawToken && !rawGroupId) {
      return res.status(400).json({ error: "Missing code, token, or groupId" });
    }

    const cleanInputCode = rawCode.replace(/[^A-Z0-9]/g, "");
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);

    const match = groups.find((g) => {
      const gCode = (g.secretCode || "").trim().toUpperCase();
      const cleanGCode = gCode.replace(/[^A-Z0-9]/g, "");

      // 1. Direct or normalized match on secretCode (e.g. "ACCT-1234" or "acct1234")
      if (rawCode && gCode && (gCode === rawCode || cleanGCode === cleanInputCode)) {
        return true;
      }
      // 2. Direct match on inviteToken
      if (rawToken && g.inviteToken && g.inviteToken.trim() === rawToken) {
        return true;
      }
      // 3. Match on groupId + optional code
      if (rawGroupId && g.id === rawGroupId) {
        if (!gCode || !rawCode || gCode === rawCode || cleanGCode === cleanInputCode) {
          return true;
        }
      }
      return false;
    });

    if (!match) {
      return res.status(404).json({ error: "No matching study group found" });
    }

    res.json({ success: true, group: match });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to lookup group" });
  }
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
      const existing = groups[existingIndex];
      // Merge memberUids so members from one user are never wiped out by updates from another!
      const mergedMemberUids = Array.from(new Set([
        ...(existing.memberUids || []),
        ...(group.memberUids || [])
      ]));
      groups[existingIndex] = {
        ...existing,
        ...group,
        memberUids: mergedMemberUids,
        memberCount: Math.max(existing.memberCount || 1, group.memberCount || 1, mergedMemberUids.length)
      };
    } else {
      groups.unshift(group);
    }
    writeJsonFile(GROUPS_FILE, groups);
    res.json({ success: true, group: groups[existingIndex >= 0 ? existingIndex : 0] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to save group" });
  }
});

// DELETE /api/groups/:id - Delete a study group (creator-only)
app.delete("/api/groups/:id", (req, res) => {
  try {
    const { id } = req.params;
    const requesterUid = (req.headers["x-user-id"] as string) || (req.query.userId as string) || req.body?.userId;
    let groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const targetGroup = groups.find((g) => g.id === id);
    if (targetGroup && targetGroup.createdByUid) {
      if (requesterUid && requesterUid !== targetGroup.createdByUid) {
        return res.status(403).json({ error: "Only the creator of this group can delete it" });
      }
    }
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
    const { userId, userIds, isJoining } = req.body;
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const targetGroup = groups.find((g) => g.id === id);
    if (!targetGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    const currentMembers: string[] = targetGroup.memberUids || [];
    let updatedMembers = [...currentMembers];
    const incomingIds: string[] = Array.from(new Set([
      ...(userId ? [userId] : []),
      ...(Array.isArray(userIds) ? userIds : [])
    ])).filter((u) => Boolean(u) && u !== 'guest');

    if (isJoining) {
      incomingIds.forEach((uid) => {
        if (!updatedMembers.includes(uid)) {
          updatedMembers.push(uid);
        }
      });
    } else {
      updatedMembers = updatedMembers.filter((u) => !incomingIds.includes(u));
    }
    targetGroup.memberUids = updatedMembers;
    targetGroup.memberCount = Math.max(1, updatedMembers.length);
    writeJsonFile(GROUPS_FILE, groups);
    res.json({ success: true, group: targetGroup });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to join group" });
  }
});

// GET /api/groups/:id/messages - Get chat messages for a specific study circle
app.get("/api/groups/:id/messages", (req, res) => {
  try {
    const { id } = req.params;
    const allMessages = readJsonFile<any[]>(MESSAGES_FILE, []);
    const groupMessages = allMessages.filter((m) => m.groupId === id);
    res.json({ messages: groupMessages });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch messages" });
  }
});

// POST /api/groups/:id/messages - Send a new chat message to the circle
app.post("/api/groups/:id/messages", (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || (!message.text && !message.attachment)) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const newMessage = {
      ...message,
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      groupId: id,
      createdAtMs: message.createdAtMs || Date.now(),
      timestamp: message.timestamp || "Just now",
    };

    const allMessages = readJsonFile<any[]>(MESSAGES_FILE, []);
    allMessages.push(newMessage);
    // Keep last 300 messages per circle to stay speedy
    writeJsonFile(MESSAGES_FILE, allMessages.slice(-500));

    res.json({ success: true, message: newMessage });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to post message" });
  }
});

// GET /api/groups/:id/members - Get member profiles for a specific study circle
app.get("/api/groups/:id/members", (req, res) => {
  try {
    const { id } = req.params;
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const group = groups.find((g) => g.id === id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const users = readJsonFile<any[]>(USERS_FILE, []);
    const memberUids: string[] = group.memberUids || [];

    const memberProfiles = memberUids.map((uid) => {
      const u = users.find((p) => p.id === uid || p.authUid === uid || (p.email && p.email.toLowerCase() === uid.toLowerCase()));
      const isHost = uid === group.createdByUid;
      return {
        uid,
        name: u?.name || (isHost ? group.leaderName : `Student (${uid.slice(0, 6)})`),
        avatar: u?.avatar || '',
        role: isHost ? 'host' : 'member',
        gradeLevel: u?.gradeLevel || 'Commerce Student',
        joinedAt: 'Active member',
      };
    });

    res.json({ members: memberProfiles, hostUid: group.createdByUid, leaderName: group.leaderName });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch members" });
  }
});

// DELETE /api/groups/:id/members/:memberUid - Remove member from group (Host authority)
app.delete("/api/groups/:id/members/:memberUid", (req, res) => {
  try {
    const { id, memberUid } = req.params;
    const groups = readJsonFile<any[]>(GROUPS_FILE, []);
    const groupIndex = groups.findIndex((g) => g.id === id);
    if (groupIndex === -1) {
      return res.status(404).json({ error: "Group not found" });
    }
    const group = groups[groupIndex];
    // Cannot remove circle host
    if (memberUid === group.createdByUid) {
      return res.status(400).json({ error: "Cannot remove circle host" });
    }
    const currentMembers: string[] = group.memberUids || [];
    group.memberUids = currentMembers.filter((u) => u !== memberUid);
    if (group.members && Array.isArray(group.members)) {
      group.members = group.members.filter((m: any) => m.uid !== memberUid);
    }
    group.memberCount = Math.max(1, group.memberUids.length);
    groups[groupIndex] = group;
    writeJsonFile(GROUPS_FILE, groups);

    // Also remove groupId from this user's joinedGroupIds if stored in USERS_FILE
    try {
      const users = readJsonFile<any[]>(USERS_FILE, []);
      let userUpdated = false;
      users.forEach((u) => {
        if (u.id === memberUid || u.authUid === memberUid) {
          if (Array.isArray(u.joinedGroupIds)) {
            u.joinedGroupIds = u.joinedGroupIds.filter((gid: string) => gid !== id);
            userUpdated = true;
          }
        }
      });
      if (userUpdated) {
        writeJsonFile(USERS_FILE, users);
      }
    } catch {}

    res.json({ success: true, group });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to remove member" });
  }
});

// GET /api/users/:uid - Get stored user profile & joined groups
app.get("/api/users/:uid", (req, res) => {
  try {
    const { uid } = req.params;
    const users = readJsonFile<any[]>(USERS_FILE, []);
    const user = users.find((u) => u.id === uid || u.authUid === uid || (u.email && u.email.toLowerCase() === uid.toLowerCase()));
    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json({ success: true, profile: user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch user" });
  }
});

// POST /api/users - Save or update user profile with joined group IDs
app.post("/api/users", (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile || (!profile.id && !profile.authUid)) {
      return res.status(400).json({ error: "Missing required user profile fields" });
    }
    const targetUid = profile.authUid || profile.id;
    const users = readJsonFile<any[]>(USERS_FILE, []);
    const existingIndex = users.findIndex((u) => u.id === targetUid || u.authUid === targetUid);
    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      const mergedJoinedGroups = Array.from(new Set([
        ...(existing.joinedGroupIds || []),
        ...(profile.joinedGroupIds || [])
      ]));
      users[existingIndex] = {
        ...existing,
        ...profile,
        joinedGroupIds: mergedJoinedGroups
      };
    } else {
      users.unshift(profile);
    }
    writeJsonFile(USERS_FILE, users);
    res.json({ success: true, profile: users[existingIndex >= 0 ? existingIndex : 0] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to save user profile" });
  }
});

// GET /api/materials
app.get("/api/materials", (_req, res) => {
  const deletedIds = new Set(readJsonFile<string[]>(DELETED_MATERIALS_FILE, []));
  let materials = readJsonFile<any[]>(MATERIALS_FILE, []);
  if (deletedIds.size > 0) {
    materials = materials.filter((m) => !deletedIds.has(m.id));
  }
  res.json({ materials });
});

// POST /api/materials
app.post("/api/materials", (req, res) => {
  try {
    const { material } = req.body;
    if (!material || !material.id) {
      return res.status(400).json({ error: "Missing required material fields" });
    }
    // Remove from deleted tracking if re-added
    let deletedIds = readJsonFile<string[]>(DELETED_MATERIALS_FILE, []);
    if (deletedIds.includes(material.id)) {
      deletedIds = deletedIds.filter((d) => d !== material.id);
      writeJsonFile(DELETED_MATERIALS_FILE, deletedIds);
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
    const matToDelete = materials.find((m) => m.id === id);
    materials = materials.filter((m) => m.id !== id);
    writeJsonFile(MATERIALS_FILE, materials);

    // Also remove associated solutions
    let solutions = readJsonFile<any[]>(SOLUTIONS_FILE, []);
    solutions = solutions.filter((s) => s.materialId !== id);
    writeJsonFile(SOLUTIONS_FILE, solutions);

    // If belongs to group, decrement group's materialsCount
    if (matToDelete?.groupId) {
      const groups = readJsonFile<any[]>(GROUPS_FILE, []);
      const grp = groups.find((g) => g.id === matToDelete.groupId);
      if (grp) {
        grp.materialsCount = Math.max(0, (grp.materialsCount || 1) - 1);
        writeJsonFile(GROUPS_FILE, groups);
      }
    }

    // Record in deleted materials list to prevent accidental resurrection from race conditions
    let deletedIds = readJsonFile<string[]>(DELETED_MATERIALS_FILE, []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      writeJsonFile(DELETED_MATERIALS_FILE, deletedIds);
    }

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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Vite middleware & Static Production Serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: {
          ignored: ["**/data/**", "**/dist/**", "**/.git/**", "**/*.json"],
        },
      },
      appType: "spa",
    });

    // Cleanly disable Vite client WebSocket connection since HMR is disabled in this environment
    app.get("/@vite/client", async (_req, res, next) => {
      try {
        const mod = await vite.transformRequest("/@vite/client");
        if (mod && mod.code) {
          let cleanCode = mod.code
            .replaceAll('console.debug("[vite] connecting...");', '/* [vite] connection disabled */')
            .replaceAll('console.debug(`[vite] connecting...`);', '/* [vite] connection disabled */')
            .replace("transport.connect(createHMRHandler(handleMessage));", "/* HMR WebSocket disabled in environment */")
            .replace(/console\.error\(`\[vite\] failed to connect to websocket[^`]*`\);?/g, '/* silenced */')
            .replace(/console\.debug\(`\[vite\][^`]*`\);?/g, '/* silenced */');
          res.setHeader("Content-Type", "application/javascript");
          return res.send(cleanCode);
        }
      } catch {
        // fallback
      }
      next();
    });

    app.get("/favicon.ico", (_req, res) => res.status(204).end());

    app.use(vite.middlewares);

    // Guaranteed SPA reload & direct-route fallback for development
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        const cleanPath = req.baseUrl || req.path || "/";
        try {
          template = await vite.transformIndexHtml(cleanPath, template);
        } catch {
          // Fallback transform against "/"
          template = await vite.transformIndexHtml("/", template);
        }
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(template);
      } catch (e: any) {
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        console.warn("Vite reload fallback to raw index.html:", e?.message);
        try {
          const rawHtml = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(rawHtml);
        } catch (finalErr) {
          next(finalErr);
        }
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Page not found");
      }
    });
  }

  // Global Express error handler to prevent connection drops causing "This page isn't available"
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server error caught:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudySolve full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
