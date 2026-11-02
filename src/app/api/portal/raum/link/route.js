import { LINK_COOKIE, linkCookieOptionen, linkCookieWert, loeseRaumLinkEin } from "@/lib/raumzwilling/teilen";
import { redirectTo } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";
import { clientIp } from "@/lib/portal/http";

// GET /api/portal/raum/link?token=…  Einmaliger Raum-Link einlösen (Fallback 3).
// Setzt ein Cookie nur für diesen Raum und leitet in die Raum-Ansicht.
// Ein zweiter Aufruf desselben Links → Hinweisseite.

export async function GET(request) {
  const limit = rateLimit(`raum-link:${clientIp(request)}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) return redirectTo(request, "/de/portal/raum/link?fehler=zu-viele");
  const token = new URL(request.url).searchParams.get("token") || "";
  const r = await loeseRaumLinkEin(token);
  if (r.fehler) return redirectTo(request, `/de/portal/raum/link?fehler=${r.fehler}`);
  const res = redirectTo(request, `/de/portal/raum/${r.projektId}`);
  res.cookies.set(LINK_COOKIE, linkCookieWert(r.projektId), linkCookieOptionen);
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
