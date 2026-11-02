// POST /api/einblicke – Empfänger der Besucher-Einblicke (Konzept §4.1,
// Marktresearch/digital/features/besucher-einblicke.md). Muster: csp-report.
//
// Antwort IMMER 204 (auch bei Müll, fremdem Origin, DNT/GPC, Bot, Limit) –
// außer 413 bei mehr als 16 KB. Prüfung in src/lib/einblicke/receive.server.js
// (zod-Schema, Origin/Sec-Fetch-Site, Rate-Limit je Prozess und sid, ohne IP).
// Gespeichert wird nur { sid, seq, pv, ts_min, e } nach
// .data/einblicke/roh/<tag>.ndjson – nach der Antwort per after()
// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md).
// Kein Log mit IP, User-Agent oder Body.
import { after } from "next/server";
import { createLimiter, receive } from "@/lib/einblicke/receive.server";
import { appendRaw } from "@/lib/einblicke/store.server";

export const runtime = "nodejs";

const limiter = createLimiter();
// Ohne Cron-Secret läuft kein Tagesabschluss (Route 404). Die 14-Tage-Löschung
// greift trotzdem (appendRaw löscht beim ersten Satz eines Tages), aber es gibt
// keine Aggregate – einmal je Prozess warnen (QA Recht P2-1).
let warned = false;
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request) {
  const result = await receive(request, { limiter });
  if (result.packet) {
    const packet = result.packet;
    const now = new Date();
    if (!warned && String(process.env.EINBLICKE_CRON_SECRET || "").length < 24) {
      warned = true;
      console.warn(JSON.stringify({ src: "einblicke", level: "warn", msg: "EINBLICKE_CRON_SECRET fehlt (mind. 24 Zeichen): kein Tagesabschluss, Cron einrichten (tools/einblicke/cron.sh)" }));
    }
    after(() => appendRaw(packet, { now }).catch(() => {}));
  }
  return new Response(null, { status: result.status, headers: NO_STORE });
}
