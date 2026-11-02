// GET /api/termin/slots?art=studio&modus=studio&von=YYYY-MM-DD&bis=YYYY-MM-DD
// Freie Zeiten (Europe/Vienna) für den Kalender auf /[locale]/termin.
// Nur lesend, daher ohne Herkunftsprüfung; Rate-Limit 60/min je IP.
// Keine Tokens in der Adresse: Beim Umbuchen zählt der eigene Termin hier als
// belegt; die Umbuchung selbst (POST /api/termin/reschedule) nimmt ihn aus.
import { bookingAdapter } from "@/lib/booking/adapters";
import { TIME_ZONE } from "@/lib/booking/config";
import { fail, json, limited } from "@/lib/booking/http";
import { slotsSchema } from "@/lib/booking/schema";
import { getSlots } from "@/lib/booking/service";

export async function GET(request) {
  const retry = limited(request, "slots");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = slotsSchema.safeParse(params);
  if (!parsed.success) return fail("bad_request", 400);
  const r = await getSlots({ adapter, ...parsed.data });
  if (!r.ok) return fail(r.code, r.code === "bad_request" ? 400 : 503);
  return json({ ok: true, timeZone: TIME_ZONE, test: adapter.test, days: r.days });
}
