// POST /api/termin/manage { token } – Termin zum Verwaltungslink ansehen.
// Der Token kommt aus dem URL-Fragment der Seite /[locale]/termin/verwalten
// (nie in der Adresse des Requests, also in keinem Log).
import { bookingAdapter } from "@/lib/booking/adapters";
import { fail, isSameOrigin, json, limited, publicOrigin, readJsonBody } from "@/lib/booking/http";
import { manageSchema } from "@/lib/booking/schema";
import { PUBLIC_ERRORS, view } from "@/lib/booking/service";

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  const retry = limited(request, "manage");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);
  const parsed = manageSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return fail("invalid_token", 403);
  const r = await view({ adapter, token: parsed.data.token, origin: publicOrigin(request) });
  if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
  return json({ ok: true, booking: r.booking });
}
