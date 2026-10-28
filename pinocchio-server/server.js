// ECW Chatbot Backend -- local development server
// Runs on http://localhost:3001
// Proxies questions to Gemini API (or returns mock responses if no key set)

"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");

// ── Load .env from project root ──────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach(line => {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m) process.env[m[1]] = m[2];
    });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL   = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const PORT           = parseInt(process.env.PORT || "3001", 10);
const ALLOWED_ORIGIN = process.env.ASSISTANT_ORIGIN || "http://127.0.0.1:8765";
const requestTimes = new Map();

// ── Load knowledge and rules files ───────────────────────────────────────────
const knowledgePath = path.join(__dirname, "..", "knowledge", "organization-knowledge.md");
const rulesPath     = path.join(__dirname, "..", "knowledge", "assistant-rules.md");

const orgKnowledge = fs.existsSync(knowledgePath)
  ? fs.readFileSync(knowledgePath, "utf8")
  : "(No organization knowledge file found -- answers will be general only.)";

const assistantRules = fs.existsSync(rulesPath)
  ? fs.readFileSync(rulesPath, "utf8")
  : "";

const SYSTEM_PROMPT = `${assistantRules}

--- APPROVED ORGANIZATION INFORMATION ---
${orgKnowledge}
--- END APPROVED INFORMATION ---`;

// ── Mock responses (used when no API key is set) ──────────────────────────────
const MOCK_RESPONSES = [
  "ECW Chatbot is in local mock mode. For immediate help, call Child Welfare SA Edenvale on 011 452 5940 or 011 452 5941.",
  "The live assistant is unavailable, but you can find public contact details and services on this website. For urgent danger, call SAPS on 10111.",
  "For current service availability, donations or programme applications, please contact the Edenvale office on 011 452 5940.",
];
let mockIndex = 0;

// ── Gemini API call ───────────────────────────────────────────────────────────
async function callGemini(userMessage) {
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${GEMINI_API_KEY}`;

  return new Promise((resolve, reject) => {
    const req = require("https").request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, res => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) resolve(text);
          else reject(new Error("No text in Gemini response: " + data));
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin === ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    let bytes = 0;
    req.on("data", chunk => { bytes += chunk.length; if (bytes <= 12000) body += chunk; });
    req.on("end", async () => {
      try {
        if (bytes > 12000) { res.writeHead(413, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Request too large" })); return; }
        const { message } = JSON.parse(body);

        // Basic input validation
        if (!message || typeof message !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "message field required" }));
          return;
        }
        if (message.length > 1000) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Message too long (max 1000 characters)" }));
          return;
        }

        const ip = req.socket.remoteAddress || "local";
        const now = Date.now();
        const recent = (requestTimes.get(ip) || []).filter(time => now - time < 60000);
        if (recent.length >= 20) { res.writeHead(429, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Please wait a moment before trying again" })); return; }
        recent.push(now); requestTimes.set(ip, recent);

        let reply;
        if (GEMINI_API_KEY) {
          try {
            reply = await callGemini(message);
          } catch (err) {
            // Keep the local prototype usable if the key is invalid, expired,
            // rate-limited, or the machine is offline. Never expose upstream
            // API details to the browser.
            console.error("Gemini unavailable; using local mock fallback");
            reply = "ECW Chatbot is temporarily unavailable. Please call 011 452 5940 or 011 452 5941 for Child Welfare SA Edenvale, or call SAPS on 10111 if a child is in immediate danger.";
          }
        } else {
          reply = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
          mockIndex++;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        console.error("ECW Chatbot request failed");
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply: "I'm having trouble right now. Please call 011 452 5940 for help." }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ECW Chatbot backend running at http://127.0.0.1:${PORT}`);
  console.log(GEMINI_API_KEY ? `Gemini API configured (${GEMINI_MODEL})` : "Gemini API: not configured (mock mode)");
});
