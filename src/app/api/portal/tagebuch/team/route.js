import { NextResponse } from "next/server";
import { herkunftFalsch, json } from "@/lib/raumzwilling/api";
import { anmelden, teamLoginAktiv } from "@/lib/portal/tagebuch/konten";
import { TEAM_COOKIE, teamCookieOptionen, teamCookieWert } from "@/lib/portal/tagebuch/teamSitzung";
import { clientIp, redirectTo } from "@/lib/portal/http";

// POST   /api/portal/tagebuch/team   persönliche Team-Anmeldung (Formular: benutzer, passwort, next)
// DELETE /api/portal/tagebuch/team   Abmelden
// Konten und Rollen: src/lib/portal/tagebuch/konten.js (TAGEBUCH_TEAM_KONTEN; im
// Dev Demo-Konten). Cookie ph_tagebuch_team, 8 h. Produktion ohne Konten: 404.
// Sperre nach Fehlversuchen je Adresse UND je Kennung (10 / 15 min): ein
// gefälschter x-forwarded-for-Eintrag umgeht die Sperre eines Kontos nicht
// (QA Technik Service). Gezählt werden nur Fehlversuche; solange eine Sperre
// läuft, wird auch das richtige Passwort nicht geprüft.

const ZIEL = "/de/portal/tagebuch/team";
const FENSTER = 15 * 60 * 1000;
const MAX_FEHLER = 10;
const fehler = globalThis.__phTagebuchLogin || (globalThis.__phTagebuchLogin = new Map());
const aktuelle = (key, now) => (fehler.get(key) || []).filter((t) => now - t < FENSTER);
function gesperrt(keys, now = Date.now()) {
  return keys.some((k) => aktuelle(k, now).length >= MAX_FEHLER);
}
function fehlversuch(keys, now = Date.now()) {
  for (const k of keys) fehler.set(k, [...aktuelle(k, now), now]);
  if (fehler.size > 5000) for (const [k, v] of fehler) if (!v.length || now - v[v.length - 1] > FENSTER) fehler.delete(k);
}
const sichererPfad = (p) => (typeof p === "string" && /^\/de\/portal\/(tagebuch\/team(\/freigabe\/fg-[a-z0-9]{10})?|projekte\/[A-Z]{2,5}-[0-9]{4}-[0-9]{2,6}\/tagebuch)$/.test(p) ? p : ZIEL);

export async function POST(request) {
  if (!teamLoginAktiv()) return json({ error: "Nicht gefunden" }, 404);
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const form = await request.formData().catch(() => null);
  const benutzer = String(form?.get("benutzer") || "").trim().toLowerCase().slice(0, 32);
  const passwort = String(form?.get("passwort") || "").slice(0, 256);
  const next = sichererPfad(String(form?.get("next") || ""));
  const keys = [`ip:${clientIp(request)}`, `konto:${benutzer || "-"}`];
  if (gesperrt(keys)) return redirectTo(request, `${ZIEL}?fehler=zu-viele`);
  const konto = anmelden(benutzer, passwort);
  if (!konto) {
    fehlversuch(keys);
    return redirectTo(request, `${ZIEL}?fehler=anmeldung`);
  }
  console.info(`[tagebuch] Team-Anmeldung ${konto.id} (${konto.rolle})`);
  const res = redirectTo(request, next);
  res.cookies.set(TEAM_COOKIE, teamCookieWert(konto), teamCookieOptionen);
  return res;
}

export async function DELETE(request) {
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(TEAM_COOKIE, "", { ...teamCookieOptionen, maxAge: 0 });
  return res;
}
