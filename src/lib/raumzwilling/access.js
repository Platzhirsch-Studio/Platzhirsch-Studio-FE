// src/lib/raumzwilling/access.js — Zugriffsschutz für Seiten und API (server-only).
// Baut auf der Portal-DAL auf (Session-Cookie, Kunde muss existieren,
// Projekt muss dem Kunden gehören) und ergänzt Team-Cookie und Raum-Link.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/portal/adapters";
import { PORTAL_LOGIN_PATH, SESSION_COOKIE } from "@/lib/portal/config";
import { readSessionValue } from "@/lib/portal/session";
import { noStore } from "@/lib/portal/http";
import { leseRaum, PROJEKT_ID } from "./store.js";
import { TEAM_COOKIE, leseTeam } from "./team.js";
import { LINK_COOKIE, leseLinkCookie } from "./teilen.js";
import { entscheideZugriff } from "./zugriff.js";
import { stelleDemoBereit } from "./seed.js";

async function ermittle(jar, projektId) {
  if (!PROJEKT_ID.test(String(projektId))) return { zugriff: { rolle: null, status: 404 } };
  const team = leseTeam(jar.get(TEAM_COOKIE)?.value);
  const session = readSessionValue(jar.get(SESSION_COOKIE)?.value);
  const adapter = getAdapter();
  const kunde = session ? await adapter.getCustomer(session.customerId) : null;
  const projekt = kunde ? await adapter.getProject(kunde.id, projektId) : null;
  if (kunde && projekt) await stelleDemoBereit(kunde.id, projektId, projekt);
  const raum = await leseRaum(projektId);
  const link = leseLinkCookie(jar.get(LINK_COOKIE)?.value);
  const zugriff = entscheideZugriff({ team, kundeId: kunde?.id || null, projektDesKunden: Boolean(projekt), link, projektId, raum });
  return { zugriff, team, kunde, projekt, raum };
}

/** Für Route Handler: { zugriff, raum, … } oder { antwort: 401/403/404 }. */
export async function raumApi(request, projektId, recht = "ansehen") {
  const e = await ermittle(request.cookies, projektId);
  if (!e.zugriff.rolle) {
    const status = e.zugriff.status || 401;
    return { antwort: NextResponse.json({ error: status === 401 ? "Nicht angemeldet" : "Nicht gefunden" }, { status, headers: noStore }) };
  }
  if (!e.zugriff.rechte.includes(recht)) {
    return { antwort: NextResponse.json({ error: "Keine Berechtigung" }, { status: 403, headers: noStore }) };
  }
  return e;
}

/** Für Seiten: leitet ohne Berechtigung zum Login weiter (bzw. 404). */
export async function raumSeite(projektId, returnTo, recht = "ansehen") {
  const jar = await cookies();
  const e = await ermittle(jar, projektId);
  if (!e.zugriff.rolle) {
    if (e.zugriff.status === 404) return { nichtGefunden: true };
    redirect(`${PORTAL_LOGIN_PATH}?next=${encodeURIComponent(returnTo)}`);
  }
  if (!e.zugriff.rechte.includes(recht)) return { keinRecht: true, ...e };
  return e;
}

/** Team-Cookie für Seiten (Werkzeug). */
export async function teamAusCookie() {
  const jar = await cookies();
  return leseTeam(jar.get(TEAM_COOKIE)?.value);
}
