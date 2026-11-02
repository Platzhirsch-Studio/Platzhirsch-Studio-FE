// POST /api/termin/cancel { token } – Termin absagen (bis Terminbeginn).
// Signierter, ablaufender Link (src/lib/booking/token.js), Herkunftsprüfung
// mit Sec-Fetch-Site bei Origin "null" (Seite mit no-referrer).
import { bookingAdapter } from "@/lib/booking/adapters";
import { fail, isSameOrigin, json, limited, publicOrigin, readJsonBody } from "@/lib/booking/http";
import { manageSchema } from "@/lib/booking/schema";
import { PUBLIC_ERRORS, cancel } from "@/lib/booking/service";

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  const retry = limited(request, "change");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);
  const parsed = manageSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return fail("invalid_token", 403);
  const r = await cancel({ adapter, token: parsed.data.token, origin: publicOrigin(request) });
  if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
  return json({ ok: true, booking: r.booking });
}
