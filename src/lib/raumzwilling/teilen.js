// src/lib/raumzwilling/teilen.js — Fallback 3: einmaliger Raum-Link.
// Ist das Portal noch nicht live (oder hat der Kunde kein Konto), erzeugt
// das Team einen Link nur für diesen einen Raum. Der Link funktioniert genau
// einmal; danach trägt das Gerät ein signiertes Cookie (14 Tage) für diesen
// Raum. Gespeichert wird nur der HMAC des Tokens (wie magicLink.js).
// Versand: das Team schickt den Link selbst (kein automatischer Mailversand).
import "server-only";
import { IS_PRODUCTION } from "@/lib/portal/config";
import { randomToken, sign, tokenDigest, verify } from "@/lib/portal/crypto";
import { RAUM_CONFIG } from "./config.js";
import { aendereRaum, PROJEKT_ID } from "./store.js";

export const LINK_COOKIE = "ph_raum_link";
const PURPOSE = "raum-link";
const TTL_S = RAUM_CONFIG.shareLink.ttlDays * 86400;

export async function erzeugeRaumLink(projektId, origin, von) {
  const roh = randomToken(24);
  const token = `${projektId}.${roh}`;
  const jetzt = Date.now();
  await aendereRaum(projektId, async (raum) => {
    if (!raum) throw new Error("Raum fehlt");
    const links = (raum.links || []).filter((l) => l.ablauf > jetzt && !l.benutzt);
    links.push({ digest: tokenDigest(token), erstellt: jetzt, ablauf: jetzt + TTL_S * 1000, benutzt: null, von: String(von || "Team").slice(0, 60) });
    return { raum: { ...raum, links: links.slice(-10) }, ergebnis: null };
  });
  const url = new URL("/api/portal/raum/link", origin);
  url.searchParams.set("token", token);
  return { url: url.toString(), gueltigTage: RAUM_CONFIG.shareLink.ttlDays };
}

/** @returns {{projektId:string}|{fehler:"ungueltig"|"abgelaufen"}} */
export async function loeseRaumLinkEin(token) {
  const s = String(token || "");
  const punkt = s.indexOf(".");
  const projektId = s.slice(0, punkt);
  if (punkt < 1 || !PROJEKT_ID.test(projektId) || s.length > 200) return { fehler: "ungueltig" };
  const digest = tokenDigest(s);
  const jetzt = Date.now();
  return aendereRaum(projektId, async (raum) => {
    const eintrag = raum?.links?.find((l) => l.digest === digest);
    if (!eintrag || eintrag.benutzt) return { raum: null, ergebnis: { fehler: "ungueltig" } };
    if (eintrag.ablauf < jetzt) return { raum: null, ergebnis: { fehler: "abgelaufen" } };
    eintrag.benutzt = jetzt;
    return { raum, ergebnis: { projektId } };
  });
}

export function linkCookieWert(projektId) {
  const now = Math.floor(Date.now() / 1000);
  return sign(PURPOSE, { v: 1, p: projektId, exp: now + TTL_S });
}

export function leseLinkCookie(wert) {
  if (!wert) return null;
  const p = verify(PURPOSE, wert);
  return p && p.v === 1 && PROJEKT_ID.test(p.p) ? { projektId: p.p } : null;
}

export const linkCookieOptionen = { httpOnly: true, secure: IS_PRODUCTION, sameSite: "lax", path: "/", maxAge: TTL_S };
