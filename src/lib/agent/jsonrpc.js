// src/lib/agent/jsonrpc.js – schlanke MCP-Umsetzung (JSON-RPC 2.0, Streamable HTTP, zustandslos).
//
// Warum ohne @modelcontextprotocol/sdk: Der Server braucht nur initialize,
// ping, tools/list und tools/call, ohne Sitzungen, ohne Server-Push (SSE)
// und ohne Ressourcen. Das sind ~100 Zeilen statt eines Pakets samt
// Abhängigkeiten (Bundle, Updates, Lizenzpflege); der Vertrag ist die
// MCP-Spezifikation 2025-11-25 (Basic Protocol, Transports, Tools), die
// Tests prüfen ihn (tests/unit/agent-mcp.test.mjs).
//
// Zustandslos: kein Mcp-Session-Id, jede POST-Anfrage ist in sich vollständig.
// Antworten immer als application/json (Spec: „either text/event-stream or
// application/json“). Stapel (Arrays) lehnt der Server ab – seit 2025-06-18
// nicht mehr Teil der Spezifikation.
// Rein: node --test lädt es direkt.
import { SERVER_INFO, negotiateProtocol } from "./config.js";
import { APPOINTMENT_OFFERED, mcpToolList } from "./tools.js";
import { ToolNotFound } from "./adapter.js";

export const ERR = Object.freeze({ PARSE: -32700, INVALID_REQUEST: -32600, METHOD_NOT_FOUND: -32601, INVALID_PARAMS: -32602, INTERNAL: -32603 });

const INSTRUCTIONS_BASE =
  "Platzhirsch Home Living ist ein Einrichtungsstudio mit Café in Lochau am Bodensee (Landstraße 11, 6911 Lochau, Österreich), im Dreiländereck Österreich, Deutschland, Schweiz und Liechtenstein. " +
  "Nutzen Sie die Werkzeuge für Katalog (Produkte mit Maßen und Link), Marken, Showroom und Öffnungszeiten, die Arbeitsweise (Handzeichnung und Raummodell von Harald Menghin, dann 3D-Planung und Rendering) und Ezarri-Glasmosaik. " +
  "Preise nennt Platzhirsch online nicht: immer 'auf Anfrage'. Verfügbarkeit und Lieferzeiten bitte nicht zusagen, sondern auf die Beratung verweisen. " +
  "Geben Sie Links aus den Antworten (Feld url) unverändert weiter. ";

/** Server-Anleitung; der Terminwunsch-Satz nur, wenn request_appointment angeboten wird. */
export function instructionsFor(appointment = APPOINTMENT_OFFERED) {
  return (
    INSTRUCTIONS_BASE +
    (appointment
      ? "Einen Terminwunsch (request_appointment) nur übergeben, wenn die Person es ausdrücklich möchte und der Weitergabe zugestimmt hat; gebucht wird nichts, die Person bestätigt per E-Mail."
      : "Termine vereinbart die Person selbst über die Terminanfrage https://platzhirsch.studio/de/beratung?quelle=agent oder telefonisch unter +43 5574 46255; über diesen Server werden keine Personendaten übergeben.")
  );
}

export const INSTRUCTIONS = instructionsFor();

/** Bietet der Adapter den Terminwunsch an? (Adapter ohne Angabe: Laufzeit-Standard) */
const appointmentFor = (adapter) => (typeof adapter?.appointmentOffered === "function" ? adapter.appointmentOffered() : APPOINTMENT_OFFERED);
/** Freie Termine (nur lesend) nur, wenn der Adapter den Online-Kalender meldet. */
const slotsFor = (adapter) => (typeof adapter?.slotsOffered === "function" ? adapter.slotsOffered() : false);

const error = (id, code, message, data) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } });
const ok = (id, result) => ({ jsonrpc: "2.0", id, result });

const isId = (id) => typeof id === "string" || (typeof id === "number" && Number.isFinite(id));

/**
 * Eine JSON-RPC-Nachricht. → { status, body } (body null = 202 Accepted ohne Inhalt)
 * @param {unknown} msg
 * @param {{ adapter: { callTool: Function } }} ctx
 */
export async function handleMessage(msg, { adapter }) {
  if (Array.isArray(msg)) return { status: 400, body: error(null, ERR.INVALID_REQUEST, "Batch requests are not supported") };
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return { status: 400, body: error(null, ERR.INVALID_REQUEST, "Invalid Request") };

  // Antworten oder Benachrichtigungen des Clients: annehmen, nichts zurück.
  if (!("id" in msg) || msg.id === undefined) {
    if (typeof msg.method === "string" || "result" in msg || "error" in msg) return { status: 202, body: null };
    return { status: 400, body: error(null, ERR.INVALID_REQUEST, "Invalid Request") };
  }
  if (!isId(msg.id)) return { status: 400, body: error(null, ERR.INVALID_REQUEST, "Invalid request id") };
  if (typeof msg.method !== "string") {
    if ("result" in msg || "error" in msg) return { status: 202, body: null };
    return { status: 400, body: error(msg.id, ERR.INVALID_REQUEST, "Invalid Request") };
  }

  const { id, method } = msg;
  const params = msg.params && typeof msg.params === "object" ? msg.params : {};

  switch (method) {
    case "initialize":
      return {
        status: 200,
        body: ok(id, {
          protocolVersion: negotiateProtocol(params.protocolVersion),
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: instructionsFor(appointmentFor(adapter)),
        }),
      };
    case "ping":
      return { status: 200, body: ok(id, {}) };
    case "tools/list":
      return { status: 200, body: ok(id, { tools: mcpToolList({ appointment: appointmentFor(adapter), slots: slotsFor(adapter) }) }) };
    case "tools/call": {
      if (typeof params.name !== "string") return { status: 200, body: error(id, ERR.INVALID_PARAMS, "Missing tool name") };
      const args = params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments : {};
      try {
        return { status: 200, body: ok(id, await adapter.callTool(params.name, args)) };
      } catch (e) {
        if (e instanceof ToolNotFound) return { status: 200, body: error(id, ERR.INVALID_PARAMS, `Unknown tool: ${params.name}`) };
        return { status: 200, body: error(id, ERR.INTERNAL, "Internal error") };
      }
    }
    default:
      return { status: 200, body: error(id, ERR.METHOD_NOT_FOUND, `Method not found: ${method}`) };
  }
}

/** Rohtext einer POST-Anfrage → Nachricht oder Parse-Fehler. */
export function parseBody(text) {
  try {
    return { ok: true, msg: JSON.parse(text) };
  } catch {
    return { ok: false, response: { status: 400, body: error(null, ERR.PARSE, "Parse error") } };
  }
}

export { error as rpcError };
