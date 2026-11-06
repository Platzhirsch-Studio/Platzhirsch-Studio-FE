// POST /api/kundenkarte/apply – Antrag auf die Kundenkarte (/[locale]/kundenkarte).
// Reihenfolge: Herkunft (origin.js) → guardForm (Rate-Limit je IP, Body ≤ 8 KB,
// Honeypot `website`/Zeitfalle `_t` → Schein-Erfolg, zod-Allowlist) → Adapter
// (Mock: .data/kundenkarte, Frappe: ph_kundenkarte.api.create_card_application)
// → Bestätigungsmail (Double-Opt-in). Antworten nur mit eigenen Codes:
// invalid 400, conflict 409, rate_limited 429, not_configured/unavailable 503.
// Logs ohne personenbezogene Daten (nur Antragsnummer).
import { kundenkarteAdapter } from "@/lib/kundenkarte/adapters";
import { MAX_BODY_BYTES } from "@/lib/kundenkarte/config";
import { applicationSchema } from "@/lib/kundenkarte/schema";
import { PUBLIC_ERRORS, apply } from "@/lib/kundenkarte/service";
import { guardForm } from "@/lib/forms/guard";
import { forbiddenResponse, originCheck } from "@/lib/forms/origin";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { publicOrigin } from "@/lib/portal/config";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (code, status) => Response.json({ success: false, code }, { status, headers: NO_STORE });

export async function POST(request) {
  const outerHeaders = await originalRequestHeaders().catch(() => null);
  const origin = originCheck(request, outerHeaders);
  if (!origin.ok) {
    console.warn(`[kundenkarte] apply: ${origin.reason} -> 403`);
    return forbiddenResponse();
  }
  const guard = await guardForm(request, applicationSchema, {
    route: "kundenkarte_apply",
    outerHeaders,
    maxBytes: MAX_BODY_BYTES,
    invalidCode: "invalid",
    fakeSuccess: () => ({ success: true, pending: true }),
  });
  if (!guard.ok) return guard.response;

  const adapter = kundenkarteAdapter();
  if (!adapter) return fail("not_configured", 503);
  try {
    const r = await apply({ adapter, input: guard.data, origin: publicOrigin(request) });
    if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
    return Response.json({ success: true, pending: r.pending, application: r.application, test: adapter.test === true, ...(r.devConfirmUrl ? { devConfirmUrl: r.devConfirmUrl } : {}) }, { headers: NO_STORE });
  } catch (err) {
    console.error(`[kundenkarte] apply fehlgeschlagen: ${err?.code || err?.name || "Fehler"}`);
    return fail("unavailable", 503);
  }
}
