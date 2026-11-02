// src/lib/portal/tagebuch/zugriff.js — wer darf ein Projekt-Tagebuch sehen und ändern.
//   Kunde: gültige Portal-Session UND das Projekt gehört ihm (Adapter.getProject).
//   Team:  persönliche Anmeldung je Mitarbeiter (./konten.js, Cookie
//          ph_tagebuch_team aus ./teamSitzung.js) mit Rolle "studio" oder
//          "mitarbeit". Der gemeinsame Raum-Schlüssel (RAUM_TEAM_TOKEN) öffnet
//          das Tagebuch NICHT mehr (Abnahme Service T10).
// Alle anderen: 401/404. Fotos sind privat, bis eine Freigabe veröffentlicht ist.
import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/portal/adapters";
import { SESSION_COOKIE } from "@/lib/portal/config";
import { readSessionValue } from "@/lib/portal/session";
import { noStore } from "@/lib/portal/http";
import { PROJEKT_ID } from "@/lib/raumzwilling/store";
import { TEAM_COOKIE, leseTeam } from "./teamSitzung.js";
import { darf } from "./konten.js";
import { tagebuchAdapter } from "./adapter.js";

async function ermittle(jar, projektId) {
  if (!PROJEKT_ID.test(String(projektId))) return { status: 404 };
  const team = leseTeam(jar.get(TEAM_COOKIE)?.value);
  const session = readSessionValue(jar.get(SESSION_COOKIE)?.value);
  const portal = getAdapter();
  const kunde = session ? await portal.getCustomer(session.customerId) : null;
  const projekt = kunde ? await portal.getProject(kunde.id, projektId) : null;
  if (kunde && projekt) return { rolle: "kunde", kunde, projekt, team };
  if (team && darf(team, "tagebuch_sehen")) {
    const tb = await tagebuchAdapter().leseTagebuch(projektId);
    if (!tb) return { status: 404 };
    return { rolle: "team", team, kunde: null, projekt: { id: projektId, title: tb.titel, room: tb.raum || "" } };
  }
  return { status: kunde ? 404 : 401 };
}

/** Für Seiten. */
export async function tagebuchSeitenZugriff(projektId) {
  return ermittle(await cookies(), projektId);
}

/** Für Route Handler: Zugriff oder { antwort }. */
export async function tagebuchApiZugriff(request, projektId) {
  const z = await ermittle(request.cookies, projektId);
  if (!z.rolle) {
    const status = z.status || 401;
    return { antwort: NextResponse.json({ error: status === 401 ? "Nicht angemeldet" : "Nicht gefunden" }, { status, headers: noStore }) };
  }
  return z;
}

export async function teamAusAnfrage(request) {
  return leseTeam(request.cookies.get(TEAM_COOKIE)?.value);
}

export async function teamAusCookies() {
  return leseTeam((await cookies()).get(TEAM_COOKIE)?.value);
}

/** Anzeigename des Autors (Team-Mitglied oder Vorname des Kunden). */
export function autorVon(z) {
  if (z.rolle === "team") return z.team?.name ? `${z.team.name} (Platzhirsch)` : "Platzhirsch-Team";
  return z.kunde?.firstName || z.kunde?.displayName || "Kunde";
}
