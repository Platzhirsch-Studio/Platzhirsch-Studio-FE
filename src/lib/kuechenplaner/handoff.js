// Übergabe Küchenplaner → Beratungsanfrage (Fix-Runde 1, F2, P0 „Sackgasse“).
// Solange der Planer im Produktions-Build nicht selbst senden darf
// (NEXT_PUBLIC_LABS_PLANER_SENDEN fehlt), endet er nicht mehr in einem
// „Testphase“-Hinweis, sondern übergibt die Planung an /<locale>/beratung –
// wie der Sofaplaner. Rein, ohne Pakete, mit node --test prüfbar.
//
// Query: ?produkt=<Kurzbeschreibung>&planer=kuechenplaner (BeratungClient liest
// ?produkt= und füllt damit das Vorhaben vor). Die ausführliche Zusammenfassung
// (alle Zeilen + Link zur Planung) liegt zusätzlich in sessionStorage unter
// HANDOFF_KEY, damit die Beratungsseite sie übernehmen kann.
//
// Rat 9,5 A4/B2 (T2): Der Plan-Link geht jetzt mit – als ?plan=<Teilen-Link>
// (Vertrag in ./planTermin.js) und, wenn er kurz genug ist, zusätzlich als
// „· Plan: <url>“ in ?produkt= (wie beim Sofaplaner; cleanText kürzt auf 200,
// ein abgeschnittener Link wäre kaputt). Dazu ?thema=kueche. Lesen auf der
// Beratungsseite (T1): readHandoff() – nur ≤ 30 min alt, passender Planer,
// der Schlüssel wird beim Lesen immer gelöscht.
import { planLink, planTerminHref } from "./planTermin.js";

export const HANDOFF_KEY = "ph-planer-uebergabe";
export const HANDOFF_PLANER = "kuechenplaner";
/** Höchstalter der Übergabe in sessionStorage (UX5: ≤ 30 min). */
export const HANDOFF_MAX_AGE_MS = 30 * 60 * 1000;
/** Planer, die über HANDOFF_KEY übergeben (Küchen- und Sofaplaner). */
export const HANDOFF_PLANERS = Object.freeze(["kuechenplaner", "sofaplaner"]);
const PRODUKT_MAX = 190;
// Sprachen (01.11.2026): optional t = Übersetzer aus ./i18n.js (createKpT). Die
// Zeilen kommen deutsch herein; ohne t bleibt alles deutsch wie bisher.
const ID = (s, vars) => (vars ? String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "") : String(s));

/** Kurztext für ?produkt= (höchstens 160 Zeichen, ohne persönliche Daten). */
export function handoffProdukt(lines = [], shareUrl = "", t = ID) {
  const first = String(lines[0] || "").replace(/\s*·\s*Raster.*$/, "").replace(/^Grundform:\s*/, "");
  let text = `${t("3D-Küchenplaner")}${first ? `: ${t(first)}` : ""}`;
  if (text.length > 160) text = `${text.slice(0, 157)}…`;
  const link = planLink(shareUrl);
  if (link && text.length + link.length + 9 <= PRODUKT_MAX) text = `${text} · Plan: ${link}`;
  return text;
}

/**
 * Ziel-URL der Übergabe: Beratung (Standard) bzw. /termin bei aktivem
 * Kalender (`calendar`, vom Server hereingereicht), immer mit Plan-Link.
 */
export function handoffHref({ locale = "de", lines = [], shareUrl = "", calendar = false, t = ID } = {}) {
  return planTerminHref({ locale, calendar, planer: HANDOFF_PLANER, produkt: handoffProdukt(lines, shareUrl, t), plan: shareUrl });
}

/** Ausführlicher Text für sessionStorage und „Plantext kopieren“. */
export function handoffSummary({ lines = [], shareUrl = "", t = ID } = {}) {
  return [t("Küchenplanung aus dem 3D-Küchenplaner"), ...lines.map((l) => t(l)), shareUrl ? t("Planung öffnen: {v}", { v: shareUrl }) : ""].filter(Boolean).join("\n");
}

/** Legt die Zusammenfassung für die Beratungsseite ab (Speicher kann gesperrt sein). */
export function storeHandoff(storage, { lines = [], shareUrl = "", t = ID } = {}) {
  try {
    storage?.setItem(HANDOFF_KEY, JSON.stringify({ planer: HANDOFF_PLANER, text: handoffSummary({ lines, shareUrl, t }), url: shareUrl, at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Für die Beratungs-/Terminseite (T1): Übergabe lesen und SOFORT löschen.
 * readHandoff(sessionStorage, { planer: "kuechenplaner" }) → { planer, text, url } | null
 *   planer  erwarteter Planer (aus ?planer=); fehlt er, zählt jeder bekannte
 *   now     Zeitpunkt (Tests); maxAge Höchstalter in ms (Standard 30 min)
 * Abgelaufene, fremde oder kaputte Einträge → null (und ebenfalls gelöscht).
 */
export function readHandoff(storage, { planer = "", now = Date.now(), maxAge = HANDOFF_MAX_AGE_MS, origin } = {}) {
  let raw = null;
  try {
    raw = storage?.getItem(HANDOFF_KEY) ?? null;
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    storage.removeItem(HANDOFF_KEY);
  } catch {
    /* gesperrt */
  }
  let v;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== "object" || !HANDOFF_PLANERS.includes(v.planer)) return null;
  const want = String(planer || "").trim().toLowerCase();
  if (want && want !== v.planer) return null;
  const at = Number(v.at);
  if (!Number.isFinite(at) || now - at > maxAge || at - now > 60_000) return null;
  const text = typeof v.text === "string" ? v.text.replace(/\r/g, "").slice(0, 4000).trim() : "";
  if (!text) return null;
  return { planer: v.planer, text, url: planLink(v.url, origin ? { origin } : undefined) || "" };
}
