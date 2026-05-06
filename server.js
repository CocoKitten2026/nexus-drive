/**
 * Nexus Drive Server
 * Usage: bun run server.js
 * Optimized for Bun & E2EE logic.
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";

const PORT = 3000;
const __dir = dirname(fileURLToPath(import.meta.url));
const ACCOUNTS_FILE = join(__dir, "drive_accounts.json");
const STORAGE_DIR = join(__dir, "uploads");

// Ensure directories exist
await mkdir(STORAGE_DIR, { recursive: true });

// Load or Init Accounts
let accounts = {};
try {
  accounts = JSON.parse(await readFile(ACCOUNTS_FILE, "utf-8"));
} catch (e) {
  await writeFile(ACCOUNTS_FILE, JSON.stringify({}));
}

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("Nexus Drive WebSocket Server is running.");
  },
  websocket: {
    async open(ws) {
      console.log("[DRIVE] New connection");
    },
    async message(ws, message) {
      let msg;
      try {
        msg = JSON.parse(message);
      } catch (e) { return; }

      const { type, username, password } = msg;

      // 1. REGISTRATION
      if (type === "register") {
        if (accounts[username]) {
          return ws.send(JSON.stringify({ type: "auth-error", message: "User exists" }));
        }
        const hashedPassword = await Bun.password.hash(password);
        accounts[username] = { password: hashedPassword, files: [] };
        await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        ws.user = username;
        return ws.send(JSON.stringify({ type: "auth-success", username }));
      }

      // 2. LOGIN
      if (type === "login") {
        const user = accounts[username];
        if (!user || !(await Bun.password.verify(password, user.password))) {
          return ws.send(JSON.stringify({ type: "auth-error", message: "Invalid credentials" }));
        }
        ws.user = username;
        return ws.send(JSON.stringify({ type: "auth-success", username }));
      }

      // ── LOGGED IN ACTIONS ────────────────────────
      if (!ws.user) return;
      const user = accounts[ws.user];

      // 3. GET DRIVE DATA
      if (type === "get-drive") {
        return ws.send(JSON.stringify({ type: "drive-data", files: user.files }));
      }

      // 4. UPLOAD FILE (Receives Encrypted Data)
      if (type === "upload-file") {
        const { name, size, data } = msg;
        const userDir = join(STORAGE_DIR, ws.user);
        await mkdir(userDir, { recursive: true });

        const filePath = join(userDir, name);
        const buffer = Buffer.from(data, "base64");
        
        await writeFile(filePath, buffer);

        // Update database
        const fileEntry = { 
            name, 
            size, 
            timestamp: Date.now(),
            starred: false,
            trashed: false,
            encrypted: true // Metadata flag
        };
        
        // Replace existing if same name
        user.files = user.files.filter(f => f.name !== name);
        user.files.push(fileEntry);
        
        await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        return ws.send(JSON.stringify({ type: "drive-data", files: user.files }));
      }

      // 5. DOWNLOAD / OPEN FILE
      if (type === "download-file") {
        const { name } = msg;
        const filePath = join(STORAGE_DIR, ws.user, name);
        try {
            const fileBuffer = await readFile(filePath);
            const base64 = fileBuffer.toString("base64");
            ws.send(JSON.stringify({ 
                type: "file-content", 
                name, 
                data: base64 
            }));
        } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: "File not found on server" }));
        }
      }

      // 6. TOGGLE STAR
      if (type === "toggle-star") {
          const file = user.files.find(f => f.name === msg.name);
          if (file) {
              file.starred = !file.starred;
              await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
              ws.send(JSON.stringify({ type: "drive-data", files: user.files }));
          }
      }

      // 7. MOVE TO TRASH
      if (type === "trash-file") {
          const file = user.files.find(f => f.name === msg.name);
          if (file) {
              file.trashed = true;
              await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
              ws.send(JSON.stringify({ type: "drive-data", files: user.files }));
          }
      }

      // 8. DELETE PERMANENTLY
      if (type === "delete-file") {
        const { name } = msg;
        const filePath = join(STORAGE_DIR, ws.user, name);
        try { await unlink(filePath); } catch(e) {}
        user.files = user.files.filter(f => f.name !== name);
        await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        return ws.send(JSON.stringify({ type: "drive-data", files: user.files }));
      }
    },
    close(ws) {
      console.log(`[DRIVE] Disconnected: ${ws.user || 'Guest'}`);
    }
  }
});

console.log(`🚀 Nexus Drive Server running on port ${PORT}`);