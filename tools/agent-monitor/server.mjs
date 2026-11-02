// tools/agent-monitor/server.mjs
// Local live dashboard for Claude Code workflow agents of this project.
// Reads the workflow journals and agent transcripts under ~/.claude/projects/<project>/
// and serves them as JSON plus a single HTML page. No dependencies.
//
//   node tools/agent-monitor/server.mjs      → http://localhost:4545
//
// Env: PORT (default 4545), CLAUDE_PROJECT_DIR (override the transcript root).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 4545;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..", "..");

// Claude Code stores a project's sessions under ~/.claude/projects/<slug>, where the
// slug is the absolute path with every non-alphanumeric character replaced by "-".
function defaultProjectDir() {
  const slug = PROJECT_ROOT.replace(/[^a-zA-Z0-9]/g, "-");
  const base = path.join(os.homedir(), ".claude", "projects");
  const exact = path.join(base, slug);
  if (fs.existsSync(exact)) return exact;
  // Drive-letter case differs between launches (c:\ vs C:\): match case-insensitively.
  const hit = fs.existsSync(base) && fs.readdirSync(base).find((d) => d.toLowerCase() === slug.toLowerCase());
  return hit ? path.join(base, hit) : exact;
}
const CLAUDE_DIR = process.env.CLAUDE_PROJECT_DIR || defaultProjectDir();

const RUNNING_WINDOW_MS = 10 * 60 * 1000; // no transcript activity for 10 min → "inaktiv"

function readLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function parseJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

// Short, human-readable description of a tool call.
function describeTool(name, input = {}) {
  const pick =
    input.description || input.command || input.url || input.file_path || input.pattern || input.query || input.prompt || "";
  const text = String(pick).replace(/\s+/g, " ").trim();
  return `${name}${text ? ": " + text.slice(0, 160) : ""}`;
}

// Per-agent transcript summary, cached by size + mtime (transcripts only grow).
const agentCache = new Map();
function summarizeAgent(file) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return null;
  }
  const cacheKey = `${stat.size}:${stat.mtimeMs}`;
  const cached = agentCache.get(file);
  if (cached?.key === cacheKey) return cached.value;

  let start = null;
  let last = null;
  let tools = 0;
  let subagents = 0;
  let webCalls = 0;
  let outputTokens = 0;
  let lastAction = null;
  let lastText = null;
  for (const line of readLines(file)) {
    const row = parseJson(line);
    if (!row) continue;
    if (row.timestamp) {
      const t = Date.parse(row.timestamp);
      if (!Number.isNaN(t)) {
        if (start === null || t < start) start = t;
        if (last === null || t > last) last = t;
      }
    }
    if (row.type !== "assistant" || !row.message) continue;
    outputTokens += row.message.usage?.output_tokens || 0;
    for (const block of row.message.content || []) {
      if (block.type === "tool_use") {
        tools += 1;
        if (block.name === "Agent") subagents += 1;
        if (block.name === "WebFetch" || block.name === "WebSearch") webCalls += 1;
        lastAction = describeTool(block.name, block.input);
      } else if (block.type === "text" && block.text?.trim()) {
        lastText = block.text.replace(/\s+/g, " ").trim().slice(0, 240);
      }
    }
  }
  const value = { start, last, tools, subagents, webCalls, outputTokens, lastAction, lastText };
  agentCache.set(file, { key: cacheKey, value });
  return value;
}

// name / description / phases from the script's `export const meta = {...}` literal.
function readScriptMeta(sessionDir, wfId) {
  const dir = path.join(sessionDir, "workflows", "scripts");
  let file;
  try {
    file = fs.readdirSync(dir).find((f) => f.endsWith(`${wfId}.js`));
  } catch {
    return {};
  }
  if (!file) return {};
  const src = fs.readFileSync(path.join(dir, file), "utf8");
  const str = (key) => src.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] || src.match(new RegExp(`${key}:\\s*"([^"]*)"`))?.[1];
  const phases = [...src.matchAll(/\{\s*title:\s*'([^']*)'(?:,\s*detail:\s*'([^']*)')?/g)].map((m) => ({
    title: m[1],
    detail: m[2] || "",
  }));
  return { name: str("name"), description: str("description"), phases };
}

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function collectState() {
  const now = Date.now();
  const workflows = [];
  let sessions = [];
  try {
    sessions = fs.readdirSync(CLAUDE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    /* no sessions yet */
  }

  for (const session of sessions) {
    const sessionDir = path.join(CLAUDE_DIR, session.name);
    const wfRoot = path.join(sessionDir, "subagents", "workflows");
    if (!fs.existsSync(wfRoot)) continue;
    for (const wfId of fs.readdirSync(wfRoot)) {
      const wfDir = path.join(wfRoot, wfId);
      const journal = readLines(path.join(wfDir, "journal.jsonl")).map(parseJson).filter(Boolean);
      if (!journal.length) continue;

      const started = new Map();
      const results = new Set();
      for (const e of journal) {
        if (e.type === "started" && e.agentId) started.set(e.agentId, e);
        if (e.type === "result" && e.agentId) results.add(e.agentId);
      }

      const agents = [];
      for (const [agentId, e] of started) {
        const s = summarizeAgent(path.join(wfDir, `agent-${agentId}.jsonl`)) || {};
        const done = results.has(agentId);
        const status = done ? "fertig" : s.last && now - s.last < RUNNING_WINDOW_MS ? "läuft" : "inaktiv";
        agents.push({
          id: agentId,
          label: e.label || agentId,
          phase: e.phase || "",
          status,
          start: s.start,
          end: done ? s.last : null,
          lastActivity: s.last,
          durationMs: s.start ? (done ? s.last : now) - s.start : 0,
          tools: s.tools || 0,
          subagents: s.subagents || 0,
          webCalls: s.webCalls || 0,
          outputTokens: s.outputTokens || 0,
          lastAction: s.lastAction,
          lastText: s.lastText,
        });
      }

      // Estimated remaining time: median duration of finished agents in the same
      // phase (else the same workflow). An estimate, not a plan — agents have none.
      const doneDur = (pred) => agents.filter((a) => a.status === "fertig" && pred(a)).map((a) => a.durationMs);
      for (const a of agents) {
        if (a.status === "fertig") continue;
        const ref = median(doneDur((b) => b.phase === a.phase)) ?? median(doneDur(() => true));
        a.expectedMs = ref;
        a.remainingMs = ref ? Math.max(0, ref - a.durationMs) : null;
      }

      const meta = readScriptMeta(sessionDir, wfId);
      const activePhases = new Set(agents.map((a) => a.phase));
      const phases = (meta.phases || []).map((p) => ({
        ...p,
        state: !activePhases.has(p.title)
          ? "geplant"
          : agents.some((a) => a.phase === p.title && a.status !== "fertig")
            ? "läuft"
            : "fertig",
      }));
      const lastActivity = Math.max(0, ...agents.map((a) => a.lastActivity || 0));
      const running = agents.filter((a) => a.status === "läuft").length;
      const allPhasesDone = phases.length ? phases.every((p) => p.state === "fertig") : running === 0;
      const status = running > 0 ? "läuft" : allPhasesDone ? "fertig" : now - lastActivity < RUNNING_WINDOW_MS ? "läuft" : "inaktiv";

      workflows.push({
        id: wfId,
        name: meta.name || wfId,
        description: meta.description || "",
        status,
        phases,
        agents: agents.sort((a, b) => (a.start || 0) - (b.start || 0)),
        start: Math.min(...agents.map((a) => a.start || Infinity)),
        lastActivity,
      });
    }
  }
  workflows.sort((a, b) => b.start - a.start);
  return { now, claudeDir: CLAUDE_DIR, workflows };
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/state")) {
    let body;
    try {
      body = JSON.stringify(collectState());
    } catch (err) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: String(err) }));
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(body);
  }
  if (req.url === "/" || req.url.startsWith("/index.html")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(HERE, "index.html")));
  }
  res.writeHead(404);
  res.end("not found");
});

// Bound to localhost only: the transcripts contain the full agent conversations.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Agent-Monitor: http://localhost:${PORT}  (Quelle: ${CLAUDE_DIR})`);
});
