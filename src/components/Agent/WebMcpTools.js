"use client";
// src/components/Agent/WebMcpTools.js – WebMCP: Lese-Werkzeuge für Browser-Agenten (N3).
//
// Meldet die Lese-Werkzeuge aus src/lib/agent/tools.js an, aber NUR, wenn der
// Browser WebMCP kennt (document.modelContext laut Chrome-Doku „Imperative
// API“, Origin-Trial 2026; navigator.modelContext laut früheren Entwürfen und
// Polyfills). Ohne API passiert nichts: kein Fehler, keine Konsole, kein
// Netzwerk. Die Anmeldung läuft erst nach requestIdleCallback (spätestens
// nach 3 s; ohne rIC per setTimeout), damit LCP und INP unberührt bleiben.
// Jeder Aufruf geht an den eigenen MCP-Server (callAgentTool) – dieselben
// Antworten wie für Claude oder ChatGPT, kein zweiter Code.
// request_appointment wird bewusst NICHT angemeldet (Personendaten,
// Bestätigung gehört in den Assistenten mit Zustimmung der Person).
//
// Einbau seitenweit (Integrationsteam, eine Zeile in client-layout.js):
//   const WebMcpTools = dynamic(() => import('@/components/Agent/WebMcpTools'), { ssr: false });
//   … {consentReady && <WebMcpTools />}
// Doppelte Anmeldung (Layout + Seite) verhindert ein Fensterschalter.
import { useEffect } from "react";
import { READ_TOOL_NAMES, TOOL_DEFS } from "@/lib/agent/tools";
import { callAgentTool, resultText } from "@/lib/agent/client";

const FLAG = "__phWebMcp";

/** Die WebMCP-Schnittstelle des Browsers oder null. */
export function modelContextOf(win = typeof window !== "undefined" ? window : undefined) {
  const ctx = win?.document?.modelContext || win?.navigator?.modelContext;
  return ctx && typeof ctx.registerTool === "function" ? ctx : null;
}

/** Werkzeug-Objekte für registerTool (ohne execute-Netz im Test austauschbar). */
export function webMcpTools(call = callAgentTool) {
  return TOOL_DEFS.filter((t) => READ_TOOL_NAMES.includes(t.name)).map((t) => ({
    name: `platzhirsch_${t.name}`,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: { readOnlyHint: true },
    execute: async (input, options) => resultText(await call(t.name, input && typeof input === "object" ? input : {}, { signal: options?.signal })),
  }));
}

export default function WebMcpTools() {
  useEffect(() => {
    const ctx = modelContextOf();
    if (!ctx || window[FLAG]) return undefined;
    window[FLAG] = true;
    const controller = new AbortController();
    const register = () => {
      for (const tool of webMcpTools()) {
        try {
          const r = ctx.registerTool(tool, { signal: controller.signal });
          if (r && typeof r.catch === "function") r.catch(() => {});
        } catch {
          // Entwurf geändert oder Name schon vergeben: still überspringen.
        }
      }
    };
    const id = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(register, { timeout: 3000 }) : window.setTimeout(register, 1200);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else window.clearTimeout(id);
      controller.abort();
      // Ältere Entwürfe ohne AbortSignal
      if (typeof ctx.unregisterTool === "function") for (const t of READ_TOOL_NAMES) try { ctx.unregisterTool(`platzhirsch_${t}`); } catch {}
      window[FLAG] = false;
    };
  }, []);
  return null;
}
