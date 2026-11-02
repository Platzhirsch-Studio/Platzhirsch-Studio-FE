// src/lib/raumzwilling/team.js — Team-Rolle für das Platzierungswerkzeug.
// Das Portal kennt nur Kunden. Das Team meldet sich für das Werkzeug mit
// einem Team-Schlüssel an (RAUM_TEAM_TOKEN, mind. 24 Zeichen, nur im Studio
// bekannt) und bekommt ein signiertes Cookie für 8 Stunden.
// Entwicklung ohne Variable: Schlüssel „dev-team-raum“ (Hinweis auf der Seite).
// Produktion ohne Variable: Team-Werkzeug aus (404), kein Fallback.
import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { IS_PRODUCTION } from "@/lib/portal/config";
import { sign, verify } from "@/lib/portal/crypto";
import { RAUM_CONFIG } from "./config.js";

export const TEAM_COOKIE = "ph_raum_team";
const PURPOSE = "raum-team";
export const DEV_TEAM_TOKEN = "dev-team-raum";

export function teamToken() {
  const t = process.env.RAUM_TEAM_TOKEN;
  if (t && t.length >= 24) return t;
  return IS_PRODUCTION ? null : DEV_TEAM_TOKEN;
}

export const teamAktiv = () => Boolean(teamToken());
export const teamDevModus = () => !IS_PRODUCTION && !(process.env.RAUM_TEAM_TOKEN?.length >= 24);

const digest = (v) => createHash("sha256").update(String(v)).digest();

export function pruefeTeamToken(eingabe) {
  const soll = teamToken();
  if (!soll || typeof eingabe !== "string" || !eingabe) return false;
  return timingSafeEqual(digest(eingabe), digest(soll));
}

export function teamCookieWert(name) {
  const now = Math.floor(Date.now() / 1000);
  return sign(PURPOSE, { v: 1, rolle: "team", name: String(name || "Team").slice(0, 60), sid: randomUUID(), exp: now + RAUM_CONFIG.team.sessionHours * 3600 });
}

export function leseTeam(wert) {
  if (!teamAktiv() || !wert) return null;
  const p = verify(PURPOSE, wert);
  return p && p.v === 1 && p.rolle === "team" ? { rolle: "team", name: p.name } : null;
}

export const teamCookieOptionen = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict",
  path: "/",
  maxAge: RAUM_CONFIG.team.sessionHours * 3600,
};
