// src/app/.well-known/mcp.json/route.js – Server-Beschreibung für KI-Clients (N3).
//
// [Format geprüft 28.10.2026] Es gibt noch KEINEN festen Standard: Die
// „MCP Server Card“ (SEP-1649, weitergeführt in PR #2127 der MCP-Spezifikation)
// ist offen; diskutiert werden /.well-known/mcp.json, /.well-known/mcp und
// /.well-known/mcp/server-card.json. Darum enthält diese Datei die Felder,
// die alle Entwürfe gemeinsam haben (Name, Version, Beschreibung, Endpunkt
// mit Transport, Protokollversionen, Fähigkeiten, Doku) und listet die
// Werkzeuge zusätzlich (tools/list bleibt die verbindliche Quelle).
// Ändert sich der Entwurf, ändert sich nur diese Datei.
import { CARD_PATH, MCP_URL, PAGE_PATH, PROTOCOL_VERSIONS, SERVER_INFO, SITE_ORIGIN } from "@/lib/agent/config";
import { mcpToolList } from "@/lib/agent/tools";
import { agentRuntime } from "@/lib/agent/deps";
import { cardDescription } from "@/lib/agent/card";
import { INSTRUCTIONS } from "@/lib/agent/jsonrpc";

export const dynamic = "force-static";

export function GET() {
  // Dieselbe Liste wie tools/list (inkl. free_appointment_slots bei aktivem
  // Online-Kalender), damit Karte und Endpunkt nie auseinanderlaufen.
  const { adapter } = agentRuntime();
  const tools = mcpToolList({ appointment: adapter.appointmentOffered(), slots: adapter.slotsOffered() });
  const card = {
    version: "1.0",
    protocolVersion: PROTOCOL_VERSIONS[0],
    protocolVersions: PROTOCOL_VERSIONS,
    serverInfo: SERVER_INFO,
    name: SERVER_INFO.name,
    title: SERVER_INFO.title,
    description: cardDescription(),
    instructions: INSTRUCTIONS,
    documentationUrl: `${SITE_ORIGIN}${PAGE_PATH}`,
    websiteUrl: SITE_ORIGIN,
    endpoint: MCP_URL,
    transport: { type: "streamable-http", url: MCP_URL },
    remotes: [{ type: "streamable-http", url: MCP_URL }],
    authentication: { required: false, schemes: [] },
    capabilities: { tools: { listChanged: false } },
    tools: tools.map((t) => ({ name: t.name, title: t.title, description: t.description, readOnly: t.annotations.readOnlyHint })),
    languages: ["de", "en", "fr", "it"],
    contact: { email: "info@platzhirsch.studio", url: `${SITE_ORIGIN}/de/kontakt` },
    privacyPolicyUrl: `${SITE_ORIGIN}/de/datenschutz`,
    self: `${SITE_ORIGIN}${CARD_PATH}`,
  };
  return Response.json(card, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
