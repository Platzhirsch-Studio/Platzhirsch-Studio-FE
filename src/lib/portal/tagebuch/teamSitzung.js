// src/lib/portal/tagebuch/teamSitzung.js — signiertes Cookie der persönlichen
// Team-Anmeldung im Projekt-Tagebuch (Konten: ./konten.js).
// Eigenes Cookie (nicht das gemeinsame ph_raum_team des Raum-Werkzeugs): Der
// gemeinsame Team-Schlüssel öffnet das Tagebuch nicht mehr. Das Cookie trägt
// nur die Kennung; Name und Rolle werden bei jedem Aufruf aus der aktuellen
// Kontenliste gelesen, ein entferntes Konto ist sofort abgemeldet.
import "server-only";
import { randomUUID } from "node:crypto";
import { IS_PRODUCTION } from "@/lib/portal/config";
import { sign, verify } from "@/lib/portal/crypto";
import { kontoVon } from "./konten.js";

export const TEAM_COOKIE = "ph_tagebuch_team";
const PURPOSE = "tagebuch-team";
const STUNDEN = 8;

export function teamCookieWert(konto) {
  const now = Math.floor(Date.now() / 1000);
  return sign(PURPOSE, { v: 2, id: konto.id, sid: randomUUID(), exp: now + STUNDEN * 3600 });
}

/** { rolle: "team", id, name, teamRolle } oder null. */
export function leseTeam(wert) {
  if (!wert) return null;
  const p = verify(PURPOSE, wert);
  if (!p || p.v !== 2 || typeof p.id !== "string") return null;
  const k = kontoVon(p.id);
  return k ? { rolle: "team", id: k.id, name: k.name, teamRolle: k.rolle } : null;
}

export const teamCookieOptionen = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict",
  path: "/",
  maxAge: STUNDEN * 3600,
};
