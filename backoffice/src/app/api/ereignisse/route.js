// GET /api/ereignisse – Ereignisstrom der Shell (G-15, Server-Sent Events).
//   text/event-stream: „event: glocke“ mit { anzahl, stand } beim Start und bei jeder Änderung;
//   der Server fragt gebündelt je Sitzung alle 30 s (mehrere Tabs teilen sich einen Abruf, 20 s Puffer)
//   und schließt den Strom nach 5 min – der Browser verbindet sich selbst neu (retry 60 s).
//   ?einmal=1 → JSON (Rückfall-Polling alle 60 s, wenn EventSource scheitert).
// Nur mit Sitzung (401 sonst). Keine Inhalte im Strom, nur Zähler und Stand – die Liste holt die
// Glocke über eine Server Action, wenn sich der Stand ändert oder sie geöffnet wird.
import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { ladeGlocke } from "@/lib/backoffice/benachrichtigungen";
import { ladeFreigaben } from "@/lib/backoffice/freigaben/index";

export const dynamic = "force-dynamic";

const TAKT_MS = 30_000;
const PUFFER_MS = 20_000;
const LAUFZEIT_MS = 5 * 60_000;
const G = globalThis;

function puffer() {
  if (!G.__phBoEreignisPuffer) G.__phBoEreignisPuffer = new Map();
  return G.__phBoEreignisPuffer;
}

/** Zähler + Stand einer Sitzung, gebündelt (ein Abruf je Sitzung und 20 s). */
async function zustand(session) {
  const p = puffer();
  const jetzt = Date.now();
  const alt = p.get(session.sid);
  if (alt && jetzt - alt.zeit < PUFFER_MS) return alt.wert;
  const wert = (async () => {
    const client = backoffice(session);
    const freigaben = await ladeFreigaben(session, client);
    const g = await ladeGlocke(client, session, { freigaben });
    return { anzahl: g.anzahl, stand: g.stand };
  })();
  p.set(session.sid, { zeit: jetzt, wert });
  if (p.size > 500) for (const [k, v] of p) if (jetzt - v.zeit > PUFFER_MS) p.delete(k);
  try {
    return await wert;
  } catch (err) {
    p.delete(session.sid);
    throw err;
  }
}

export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { session } = auth;
  const url = new URL(request.url);

  if (url.searchParams.get("einmal") === "1") {
    try {
      return Response.json({ ok: true, ...(await zustand(session)) }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ ok: false, code: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }

  const enc = new TextEncoder();
  let timer = null;
  let ende = null;
  let zu = false;
  const stream = new ReadableStream({
    async start(controller) {
      const senden = (text) => {
        if (zu) return;
        try {
          controller.enqueue(enc.encode(text));
        } catch {
          zu = true;
        }
      };
      const schliessen = () => {
        if (zu) return;
        zu = true;
        clearInterval(timer);
        clearTimeout(ende);
        try {
          controller.close();
        } catch {
          // schon geschlossen
        }
      };
      let letzter = "";
      const runde = async () => {
        if (session.expiresAt && Date.now() > session.expiresAt * 1000) {
          senden(`event: sitzung\ndata: {"abgelaufen":true}\n\n`);
          return schliessen();
        }
        try {
          const z = await zustand(session);
          if (z.stand !== letzter) {
            letzter = z.stand;
            senden(`event: glocke\ndata: ${JSON.stringify(z)}\n\n`);
          } else {
            senden(`: ruhe\n\n`);
          }
        } catch {
          senden(`: nicht erreichbar\n\n`);
        }
      };
      senden(`retry: 60000\n\n`);
      await runde();
      timer = setInterval(runde, TAKT_MS);
      ende = setTimeout(schliessen, LAUFZEIT_MS);
      request.signal?.addEventListener("abort", schliessen);
    },
    cancel() {
      zu = true;
      clearInterval(timer);
      clearTimeout(ende);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
