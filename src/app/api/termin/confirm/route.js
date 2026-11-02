// POST /api/termin/confirm { link } – E-Mail-Adresse bestätigen (Double-Opt-in).
// Der Link "<referenz>.<zufall>" kommt aus dem URL-Fragment der Seite
// /[locale]/termin/bestaetigen (nie in einer Adresse, also in keinem Log).
// Erst danach ist der Termin fest; Bestätigung, .ics und Verwaltungslink gehen
// per Mail hinaus (Mock: Dev-Postausgang). Herkunftsprüfung wie bei den
// übrigen POST-Routen (Seite mit no-referrer → Origin "null" + Sec-Fetch-Site).
import { bookingAdapter } from "@/lib/booking/adapters";
import { fail, isSameOrigin, json, limited, publicOrigin, readJsonBody } from "@/lib/booking/http";
import { confirmSchema } from "@/lib/booking/schema";
import { PUBLIC_ERRORS, confirm } from "@/lib/booking/service";

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  const retry = limited(request, "confirm");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);
  const parsed = confirmSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return fail("invalid_token", 403);
  try {
    const r = await confirm({ adapter, link: parsed.data.link, origin: publicOrigin(request) });
    if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
    return json({ ok: true, already: r.already, booking: r.booking, manageUrl: r.manageUrl });
  } catch (err) {
    console.error(`[termin] Bestätigung fehlgeschlagen: ${err?.code || err?.name || "Fehler"}`);
    return fail("unavailable", 503);
  }
}
