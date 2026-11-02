// POST /api/einblicke/tagesabschluss – Tagesabschluss der Besucher-Einblicke
// (Konzept §4.2): aggregiert Vortag + offene Tage, löscht Rohdaten > 14 Tage,
// überträgt an Frappe (nur mit EINBLICKE_FRAPPE_*; sonst Dry-Run in
// .data/einblicke/outbox/). Geschützt: Authorization: Bearer $EINBLICKE_CRON_SECRET
// (mind. 24 Zeichen). Ohne gesetztes Secret: 404. Falsches Secret: 401.
// Optional ?datum=YYYY-MM-DD (einzelner Tag, z. B. Nachlauf).
import { timingSafeEqual } from "node:crypto";
import { runTagesabschluss } from "@/lib/einblicke/abschluss.server";

export const runtime = "nodejs";
export const maxDuration = 300;

const NO_STORE = { "Cache-Control": "no-store" };

function authorized(request, secret) {
  const header = request.headers.get("authorization") || "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7).trim() : "");
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function POST(request) {
  const secret = String(process.env.EINBLICKE_CRON_SECRET || "");
  if (secret.length < 24) return new Response(null, { status: 404, headers: NO_STORE });
  if (!authorized(request, secret)) return new Response(null, { status: 401, headers: NO_STORE });
  const datum = new URL(request.url).searchParams.get("datum");
  const days = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) ? [datum] : undefined;
  try {
    const result = await runTagesabschluss({ days });
    return Response.json(result, { headers: NO_STORE });
  } catch (err) {
    console.error(JSON.stringify({ src: "einblicke", level: "error", msg: "tagesabschluss", err: String(err?.message || err).slice(0, 200) }));
    return Response.json({ error: "tagesabschluss fehlgeschlagen" }, { status: 500, headers: NO_STORE });
  }
}
