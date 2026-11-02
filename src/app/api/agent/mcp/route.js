// src/app/api/agent/mcp/route.js – MCP-Server „Platzhirsch für KI-Assistenten“ (N3).
// Streamable HTTP, zustandslos, JSON-RPC 2.0: initialize, ping, tools/list, tools/call.
// Werkzeuge: src/lib/agent/tools.js · Logik: src/lib/agent/adapter.js (Concierge-Katalog)
// HTTP-Schicht: src/lib/agent/http.js · Doku: Marktresearch/digital/features/neuland.md §4.
// Verbinden: https://platzhirsch.studio/api/agent/mcp (Seite /de/ki-assistenten).
import { createMcpPost, methodNotAllowed, optionsResponse } from "@/lib/agent/http";
import { agentRuntime } from "@/lib/agent/deps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { adapter, limiter, log } = agentRuntime();
  return createMcpPost({ adapter, limiter, log })(request);
}

// Kein SSE-Strom, keine Sitzungen (Spec: GET/DELETE → 405).
export function GET() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function OPTIONS() {
  return optionsResponse();
}
