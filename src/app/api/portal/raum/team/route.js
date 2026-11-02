import { NextResponse } from "next/server";
import { herkunftFalsch, json } from "@/lib/raumzwilling/api";
import { TEAM_COOKIE, pruefeTeamToken, teamAktiv, teamCookieOptionen, teamCookieWert } from "@/lib/raumzwilling/team";
import { clientIp, redirectTo } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";

// POST   /api/portal/raum/team  Team-Anmeldung (Formular: schluessel, name, next)
// DELETE /api/portal/raum/team  Abmelden
// Produktion ohne RAUM_TEAM_TOKEN: 404.

const sichererPfad = (p) => (typeof p === "string" && /^\/de\/portal\/raum(\/[A-Za-z0-9-]+){0,2}$/.test(p) ? p : "/de/portal/raum/team");

export async function POST(request) {
  if (!teamAktiv()) return json({ error: "Nicht gefunden" }, 404);
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const limit = rateLimit(`raum-team:${clientIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) return redirectTo(request, "/de/portal/raum/team?fehler=zu-viele");
  const form = await request.formData().catch(() => null);
  const schluessel = String(form?.get("schluessel") || "");
  const name = String(form?.get("name") || "").trim().slice(0, 60);
  const next = sichererPfad(String(form?.get("next") || ""));
  if (!pruefeTeamToken(schluessel)) return redirectTo(request, `/de/portal/raum/team?fehler=schluessel&next=${encodeURIComponent(next)}`);
  const res = redirectTo(request, next === "/de/portal/raum/team" ? "/de/portal/raum/team?ok=1" : next);
  res.cookies.set(TEAM_COOKIE, teamCookieWert(name || "Team"), teamCookieOptionen);
  return res;
}

export async function DELETE(request) {
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(TEAM_COOKIE, "", { ...teamCookieOptionen, maxAge: 0 });
  return res;
}
