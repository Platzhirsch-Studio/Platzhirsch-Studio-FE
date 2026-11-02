// src/lib/pinterest/url.js — der „Merken auf Pinterest“-Link.
//
// Nur ein Link auf https://www.pinterest.com/pin/create/button/ mit url,
// media und description. KEIN Pinterest-Skript (pinit.js): vor dem Klick lädt
// nichts von Pinterest, es wird nichts gesetzt oder übertragen, darum braucht
// es keine zusätzliche Einwilligung. Erst der Klick öffnet Pinterest in einem
// neuen Tab (rel="noopener noreferrer", Datenschutzhinweis im Text).
//
// Rein, ohne "@/..."-Importe (node --test).
import { pinRights } from "./rights.js";

export const PIN_BASE = "https://www.pinterest.com/pin/create/button/";
export const SITE_URL = "https://platzhirsch.studio";
export const DESCRIPTION_MAX = 480; // Pinterest erlaubt 500 Zeichen
export const SIGNATURE = "Platzhirsch Lochau";
// Quellen, die keinen „Bild: …“-Zusatz brauchen (eigenes Material)
const OWN_SOURCES = new Set(["Platzhirsch Home Living", "Platzhirsch Stil-Finder", "Harald Menghin, Platzhirsch"]);

/** Interner Pfad oder eigene URL → absolute https-URL; fremde Ziele → null. */
export function absoluteUrl(pathOrUrl, base = SITE_URL) {
  if (typeof pathOrUrl !== "string" || !pathOrUrl) return null;
  if (pathOrUrl.startsWith("/") && !pathOrUrl.startsWith("//")) return `${base}${pathOrUrl}`;
  try {
    const u = new URL(pathOrUrl);
    const host = u.hostname.replace(/^www\./, "");
    if (u.protocol === "https:" && host === new URL(base).hostname) return u.toString();
  } catch {
    /* kein gültiger Link */
  }
  return null;
}

const clean = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();

/**
 * Beschreibung: „Titel · Marke · Raum – Platzhirsch Lochau“ (+ „Bild: Ezarri“).
 * Doppelte Teile (Marke schon im Titel) fallen weg.
 */
export function pinDescription({ title, brand, room, quelle } = {}) {
  const parts = [];
  for (const raw of [title, brand, room]) {
    const v = clean(raw);
    if (v && !parts.some((p) => p.toLowerCase().includes(v.toLowerCase()))) parts.push(v);
  }
  let text = `${parts.join(" · ")}${parts.length ? " – " : ""}${SIGNATURE}`;
  // Fremde Bildquelle (Ezarri) IMMER als „Bild: …“ am Ende, auch wenn die
  // Marke schon im Titel steht – sonst liest sich ein Ezarri-Anwendungsbild
  // wie ein Platzhirsch-Projekt (QA Technik P1-2). Eigene Quellen ohne Zusatz.
  const q = clean(quelle);
  const credit = q && !OWN_SOURCES.has(q) ? ` · Bild: ${q}` : "";
  if (text.length + credit.length > DESCRIPTION_MAX) text = `${text.slice(0, DESCRIPTION_MAX - credit.length - 1).trimEnd()}…`;
  return text + credit;
}

/**
 * Baut den Merken-Link. Gibt null zurück, wenn das Bild nicht auf Pinterest
 * darf (rights.js) oder Seite/Bild nicht auf unserer Domain liegen.
 * @param {{url: string, media: string, title?: string, brand?: string, room?: string, kiStufe?: string, base?: string}} o
 */
export function pinterestHref({ url, media, title, brand, room, kiStufe, base = SITE_URL } = {}) {
  const rights = pinRights(media, { kiStufe });
  if (!rights.ok) return null;
  const pageUrl = absoluteUrl(url, base);
  const mediaUrl = absoluteUrl(media, base);
  if (!pageUrl || !mediaUrl) return null;
  const q = new URLSearchParams({
    url: pageUrl,
    media: mediaUrl,
    description: pinDescription({ title, brand, room, quelle: rights.quelle }),
  });
  return `${PIN_BASE}?${q.toString()}`;
}
