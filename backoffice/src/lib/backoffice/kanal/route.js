// Route-Handler des Kundendisplay-Kanals (Team P0-6) – fertig zum Einhängen unter
// `src/app/api/kassa/display/route.js` (Besitzer der API-Routen, MASTER R-16; reserviert in 10-konzept-kassa):
//
//   export { GET, POST } from "@/lib/backoffice/kanal/route";
//   export const dynamic = "force-dynamic";
//
// GET  ?kasse=K1          text/event-stream: „event: zustand“ mit der bereinigten Nachricht (sofort die letzte,
//                         dann jede neue), Kommentar-Puls alle 15 s, Ende nach 10 min (Browser verbindet neu).
// GET  ?kasse=K1&einmal=1 JSON { ok, nachricht } – Rückfall-Polling alle 2 s.
// POST { kasse, nachricht, anrede? }  Kassa → Kanal (Sitzung mit Kassa-Schreibrecht, Herkunft geprüft).
// Lesen dürfen: Sitzung mit Kassa-Leserecht ODER das registrierte Gerät, dem diese Kasse zugeordnet ist
// (Kundendisplay ohne Bediener-Anmeldung). Mock-Pfad: identisch (Verteiler im Prozess-Speicher).

import { getGeraet, getSession, requireApiSession } from "../auth/dal.js";
import { darf } from "../auth/rechte.js";
import { abonniere, letzte, veroeffentliche } from "./hub.js";
import { kasseGueltig } from "./protokoll.js";

const PULS_MS = 15_000;
const LAUFZEIT_MS = 10 * 60_000;
const KEIN_CACHE = { "Cache-Control": "no-store" };

async function darfLesen(kasse) {
  const session = await getSession();
  if (session && darf(session, "kassa", "read")) return true;
  const geraet = await getGeraet().catch(() => null);
  return !!geraet && geraet.kasse === kasse;
}

export async function GET(request) {
  const url = new URL(request.url);
  const kasse = url.searchParams.get("kasse") || "";
  if (!kasseGueltig(kasse)) return Response.json({ ok: false, code: "invalid", message: "Unbekannte Kasse." }, { status: 400, headers: KEIN_CACHE });
  if (!(await darfLesen(kasse))) return Response.json({ ok: false, code: "auth", message: "Nicht angemeldet." }, { status: 401, headers: KEIN_CACHE });

  if (url.searchParams.get("einmal") === "1") return Response.json({ ok: true, nachricht: letzte(kasse) }, { headers: KEIN_CACHE });

  const enc = new TextEncoder();
  let zu = false;
  let abmelden = () => {};
  let puls = null;
  let ende = null;
  const stream = new ReadableStream({
    start(controller) {
      const schliessen = () => {
        if (zu) return;
        zu = true;
        clearInterval(puls);
        clearTimeout(ende);
        abmelden();
        try {
          controller.close();
        } catch {
          // schon geschlossen
        }
      };
      const senden = (t) => {
        if (zu) return;
        try {
          controller.enqueue(enc.encode(t));
        } catch {
          schliessen();
        }
      };
      const nachricht = (n) => senden(`event: zustand\ndata: ${JSON.stringify(n)}\n\n`);
      senden("retry: 2000\n\n");
      const l = letzte(kasse);
      if (l) nachricht(l);
      else senden(": bereit\n\n");
      abmelden = abonniere(kasse, nachricht);
      puls = setInterval(() => senden(": puls\n\n"), PULS_MS);
      ende = setTimeout(schliessen, LAUFZEIT_MS);
      request.signal?.addEventListener("abort", schliessen);
    },
    cancel() {
      zu = true;
      clearInterval(puls);
      clearTimeout(ende);
      abmelden();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}

export async function POST(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  if (!darf(auth.session, "kassa", "write") && !darf(auth.session, "kassa", "create")) return Response.json({ ok: false, code: "forbidden", message: "Keine Berechtigung." }, { status: 403, headers: KEIN_CACHE });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, code: "invalid", message: "Ungültige Nachricht." }, { status: 400, headers: KEIN_CACHE });
  }
  const kasse = String(body?.kasse || "");
  if (!kasseGueltig(kasse)) return Response.json({ ok: false, code: "invalid", message: "Unbekannte Kasse." }, { status: 400, headers: KEIN_CACHE });
  const anrede = ["aus", "vorname", "name"].includes(body?.anrede) ? body.anrede : "aus";
  const n = veroeffentliche(kasse, body?.nachricht, { anrede });
  if (!n) return Response.json({ ok: false, code: "invalid", message: "Ungültige Nachricht." }, { status: 400, headers: KEIN_CACHE });
  return Response.json({ ok: true, seq: n.seq }, { headers: KEIN_CACHE });
}
