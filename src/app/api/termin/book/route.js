// POST /api/termin/book – Termin buchen (Online-Kalender, /[locale]/termin).
// Reihenfolge: Herkunft → Rate-Limit (IP) → Body (≤ 8 KB, JSON) → Honeypot/
// Zeitfalle → zod → Rate-Limit (E-Mail-Hash) → Adapter (Doppelbuchungsschutz,
// 409 slot_taken; Termin "unbestaetigt", Uhrzeit 30 Minuten gehalten) →
// Mail mit Bestätigungslink (Double-Opt-in; Mock: Dev-Postausgang) → Antwort
// ohne Verwaltungslink und .ics (die kommen erst nach der Bestätigung,
// POST /api/termin/confirm), im Testbetrieb mit dem Bestätigungslink.
// Logs ohne personenbezogene Daten (nur Referenz, Art, Status).
import { bookingAdapter } from "@/lib/booking/adapters";
import { fail, hashOf, isSameOrigin, isTrapped, json, limited, limitedKey, publicOrigin, readJsonBody } from "@/lib/booking/http";
import { bookSchema, fieldErrors } from "@/lib/booking/schema";
import { PUBLIC_ERRORS, book } from "@/lib/booking/service";
import { uploadsAccepting } from "@/lib/upload/config";
import { signTicket } from "@/lib/upload/token";

function uploadTicket(booking, email) {
  try {
    if (!uploadsAccepting()) return null;
    return { ticket: signTicket({ kind: "beratung", leadRef: booking.ref, email }) };
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  const retry = limited(request, "book");
  if (retry) return fail("rate_limited", 429, { retryAfter: retry });
  const adapter = bookingAdapter();
  if (!adapter) return fail("not_configured", 503);

  const body = await readJsonBody(request);
  if (!body || typeof body !== "object") return fail("bad_request", 400);
  if (isTrapped(body)) {
    console.warn("[termin] Buchung verworfen (Honeypot/Zeitfalle)");
    return fail("generic", 400);
  }
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) return fail("invalid", 400, { fields: fieldErrors(parsed.error) });
  const input = parsed.data;
  const retryMail = limitedKey(hashOf(input.email), "bookEmail");
  if (retryMail) return fail("rate_limited", 429, { retryAfter: retryMail });

  try {
    const r = await book({ adapter, input, origin: publicOrigin(request) });
    if (!r.ok) return fail(r.code, PUBLIC_ERRORS[r.code] || 503);
    return json({
      ok: true,
      pending: r.pending,
      booking: r.booking,
      ...(r.manageUrl ? { manageUrl: r.manageUrl } : {}),
      ...(r.reservedUntil ? { reservedUntil: r.reservedUntil } : {}),
      ...(r.devConfirmUrl ? { devConfirmUrl: r.devConfirmUrl } : {}),
      upload: uploadTicket(r.booking, input.email),
    });
  } catch (err) {
    console.error(`[termin] Buchung fehlgeschlagen: ${err?.code || err?.name || "Fehler"}`);
    return fail("unavailable", 503);
  }
}
