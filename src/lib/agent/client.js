// src/lib/agent/client.js – Browser-Aufruf eines Werkzeugs über den eigenen MCP-Server.
// Genutzt von der WebMCP-Registrierung und der Vorführung auf /de/ki-assistenten.
// Ein Weg für alle: Browser-Agenten bekommen exakt dieselbe Antwort wie
// Claude oder ChatGPT über https://platzhirsch.studio/api/agent/mcp.
// Rein (nur fetch): kein React, kein Paket.
import { LATEST_PROTOCOL, MCP_PATH } from "./config.js";

let seq = 0;

/** Die JSON-RPC-Anfrage, wie ein Assistent sie schickt (auch zur Anzeige). */
export function toolCallRequest(name, args = {}) {
  seq += 1;
  return { jsonrpc: "2.0", id: seq, method: "tools/call", params: { name, arguments: args } };
}

/**
 * @returns {Promise<{ ok: boolean, status: number, request: object, response: object|null, result: object|null }>}
 */
export async function callAgentTool(name, args = {}, { signal, fetchImpl = fetch, endpoint = MCP_PATH } = {}) {
  const request = toolCallRequest(name, args);
  let res;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": LATEST_PROTOCOL },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { ok: false, status: 0, request, response: null, result: null };
  }
  let response = null;
  try {
    response = await res.json();
  } catch {
    /* kein JSON */
  }
  const result = response?.result || null;
  return { ok: res.ok && Boolean(result) && !result.isError, status: res.status, request, response, result };
}

/** Text für WebMCP (execute gibt einen String zurück). */
export function resultText(out) {
  if (out.result?.content?.[0]?.text) return out.result.content[0].text;
  if (out.status === 429) return JSON.stringify({ error: "rate_limited", message: "Zu viele Anfragen. Bitte in einer Minute erneut versuchen." });
  return JSON.stringify({ error: "unavailable", message: "Platzhirsch ist gerade nicht erreichbar. Telefon +43 5574 46255." });
}
