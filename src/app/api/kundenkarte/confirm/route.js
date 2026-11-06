// POST /api/kundenkarte/confirm – E-Mail-Adresse bestätigen (Double-Opt-in).
// Body { token } aus /[locale]/kundenkarte/bestaetigen?token=… – die Seite
// schickt ihn erst nach einem Klick. Herkunft (origin.js) + Rate-Limit je IP
// (guardForm mit Schema { token }). Antwort: { success, already } oder
// invalid_token 400, expired 410, rate_limited 429, not_configured/unavailable 503.
import { z } from "zod";
import { kundenkarteAdapter } from "@/lib/kundenkarte/adapters";
import { PUBLIC_ERRORS, confirm } from "@/lib/kundenkarte/service";
import { guardForm } from "@/lib/forms/guard";
import { forbiddenResponse, originCheck } from "@/lib/forms/origin";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (code, status) => Response.json({ success: false, code }, { status, headers: NO_STORE });
const schema = z.object({ token: z.string().trim().min(1).max(80) });

export async function POST(request) {
  const outerHeaders = await originalRequestHeaders().catch(() => null);
  const origin = originCheck(request, outerHeaders);
  if (!origin.ok) return forbiddenResponse();
  const guard = await guardForm(request, schema, { route: "kundenkarte_confirm", outerHeaders, maxBytes: 2048, invalidCode: "invalid_token", limit: { max: 20, windowMs: 10 * 60 * 1000 } });
  if (!guard.ok) return guard.response;

  const adapter = kundenkarteAdapter();
  if (!adapter) return fail("not_configured", 503);
  try {
    const r = await confirm({ adapter, token: guard.data.token });
    if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
    return Response.json({ success: true, already: r.already, application: r.application }, { headers: NO_STORE });
  } catch (err) {
    console.error(`[kundenkarte] confirm fehlgeschlagen: ${err?.code || err?.name || "Fehler"}`);
    return fail("unavailable", 503);
  }
}
