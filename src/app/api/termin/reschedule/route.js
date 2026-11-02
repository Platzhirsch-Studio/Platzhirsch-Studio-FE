// POST /api/termin/reschedule { token, start } – Termin verschieben.
// Atomar im Adapter (neuer Slot frei? → Zeit ändern). Danach gilt nur noch
// der neue Verwaltungslink (Version + 1); der alte antwortet 403.
import { bookingAdapter } from "@/lib/booking/adapters";
import { fail, isSameOrigin, json, limited, publicOrigin, readJsonBody } from "@/lib/booking/http";
import { rescheduleSchema } from "@/lib/booking/schema";
import { PUBLIC_ERRORS, reschedule } from "@/lib/booking/service";

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  const retry = limited(request, "change");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);
  const parsed = rescheduleSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return fail("bad_request", 400);
  const r = await reschedule({ adapter, token: parsed.data.token, start: parsed.data.start, origin: publicOrigin(request) });
  if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
  return json({ ok: true, booking: r.booking, manageUrl: r.manageUrl });
}
