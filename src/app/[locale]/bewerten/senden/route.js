// POST /de/bewerten/senden – Absende-Ziel des Bewertungsformulars auf /de/bewerten.
// Prüfungen wie /<locale>/service/senden: Herkunft (origin.js), Rate-Limit je IP,
// Größe, Honeypot und Zeitfalle (guardForm), Feldprüfung mit demselben Schema wie
// im Browser (src/lib/bewertungen/schema.js). Versand: src/lib/bewertungen/backend.js
// (ph: ph_marketing.api.create_bewertung; alt: kein Weg → 404 not_available,
// das Formular wird dann auch nicht gezeigt). no-store, noindex.
import { randomUUID } from "node:crypto";
import { bewertungSchema } from "@/lib/bewertungen/schema";
import { sendBewertung } from "@/lib/bewertungen/backend";
import { guardForm } from "@/lib/forms/guard";
import { forbiddenResponse, originCheck } from "@/lib/forms/origin";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const json = (body, status = 200) => Response.json(body, { status, headers: HEADERS });
const STATUS = { invalid: 400, not_available: 404, rate_limited: 429, not_configured: 503, unavailable: 503 };
const fail = (code, extra = {}) => json({ success: false, code, ...extra }, STATUS[code] || 503);

const LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export async function POST(request) {
  try {
    const outerHeaders = await originalRequestHeaders().catch(() => null);
    if (!originCheck(request, outerHeaders).ok) return forbiddenResponse();
    const g = await guardForm(request, bewertungSchema, { route: "bewertung", outerHeaders, maxBytes: 12 * 1024, limit: LIMIT });
    if (!g.ok) return g.response;
    const r = await sendBewertung(g.data, { leadRef: `BEW-R-${randomUUID().slice(0, 8).toUpperCase()}` });
    if (!r.ok) {
      if (r.code !== "invalid" && r.code !== "not_available") console.error(`[bewertung] (${r.generation}): ${r.code}`);
      return fail(r.code);
    }
    return json({ success: true, referenz: r.referenz, veroeffentlichung: Boolean(g.data.einwilligung) });
  } catch (err) {
    console.error(`[bewertung] ${err?.name || "Fehler"}`);
    return fail("unavailable");
  }
}

export function GET() {
  return json({ success: false, code: "method_not_allowed" }, 405);
}
