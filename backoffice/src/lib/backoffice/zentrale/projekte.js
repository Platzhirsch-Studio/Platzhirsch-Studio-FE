// Projekte-Kachel der Zentrale (Lounge § 7.1 „Projekte-Tabelle mit Bildern, Stufen-Pillen, Avatar-Reihen,
// Fortschritt“). Reine Ableitungen aus PH Projekt (ph_projekte) – unit-getestet. Nichts wird erfunden:
// Fortschritt = Position der Stufe im Ablauf, Wert = Auftragswert (sonst Budget), Termin = Felder des Projekts.

import { NAECHSTER_SCHRITT, PROJEKTART, STUFEN_PROJEKT } from "./texte.js";

/** Ablauf laut PH Projekt.status (ohne Abschluss/Abbruch). */
export const ABLAUF = ["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe"];
/** Laufend = alles zwischen Planung und Übergabe. */
export const LAUFEND = ["Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe"];

/** Stufe → Material der Pille (Lounge: Farbe = Material, nie Ampel). */
export const STUFE_MATERIAL = {
  Anfrage: "stein",
  Planung: "see",
  Angebot: "cognac",
  Auftrag: "nuss",
  Bestellung: "eiche",
  Lieferung: "messing",
  Montage: "salbei",
  Uebergabe: "salbei",
  Abgeschlossen: "stein",
  Abgebrochen: "stein",
};

/** Fortschritt in % = Index der Stufe im Ablauf (Anfrage 0 % … Übergabe 100 %). */
export function fortschritt(status) {
  const i = ABLAUF.indexOf(status);
  if (i < 0) return status === "Abgeschlossen" ? 100 : 0;
  return Math.round((i / (ABLAUF.length - 1)) * 100);
}

function kurz(iso) {
  if (!iso) return null;
  const s = String(iso).slice(0, 10);
  const [, m, t] = s.split("-");
  return m && t ? `${Number(t)}.${Number(m)}.` : null;
}

/** Nächster Schritt aus Stufe + Projektdaten (Liefertermin, Montage, Übergabe). */
export function naechsterSchritt(p) {
  const s = p.status;
  const f = NAECHSTER_SCHRITT[s];
  if (!f) return "";
  if (typeof f === "string") return f;
  if (s === "Bestellung" || s === "Lieferung") return f(kurz(p.liefertermin_geplant));
  if (s === "Montage") return f(kurz(p.montage_von));
  if (s === "Uebergabe") return f(kurz(p.uebergabe_am));
  return f(null);
}

/** Datum des nächsten Termins im Projekt (für Sortierung und „mit Termin diese Woche“). */
export function naechsterTermin(p, heute) {
  const kandidaten = [p.liefertermin_geplant, p.montage_von, p.uebergabe_am].map((d) => (d ? String(d).slice(0, 10) : null)).filter((d) => d && d >= heute);
  return kandidaten.sort()[0] || null;
}

/**
 * Raumbild je Projektart. Echte Projektbilder kommen aus PH Rendering.bild (freigegeben) – fehlt eins, steht ein
 * Raumbild der Projektart aus dem Sortiment (Bildbestand der Website, Lounge-Entwurf), als solches beschriftet.
 */
const RAUMBILD = {
  Kueche: "/entwurf/lounge/r-kueche-eiche.jpg",
  Bad: "/entwurf/lounge/r-bad.webp",
  Wohnung: "/entwurf/lounge/r-wohnen-sofa.jpg",
  Haus: "/entwurf/lounge/r-terrasse-see.jpg",
  Hotel: "/entwurf/lounge/r-terrasse-hotel.jpg",
  Objekt: "/entwurf/lounge/r-hero-essraum.jpg",
  Yacht: "/entwurf/lounge/r-essen-licht.jpg",
  Outdoor: "/entwurf/lounge/r-garten-lounge.jpg",
  Sonstiges: "/entwurf/lounge/r-schlafen.webp",
};

/** { src, alt, symbol } – symbol = true, wenn kein Projektbild vorliegt. */
export function projektBild(p, renderingBild) {
  const art = PROJEKTART[p.projektart] || PROJEKTART.Sonstiges;
  if (renderingBild && /^(\/|https?:)/.test(String(renderingBild))) return { src: String(renderingBild), alt: `${p.titel || art}`, symbol: false };
  return { src: RAUMBILD[p.projektart] || RAUMBILD.Sonstiges, alt: "", symbol: true, art };
}

/** Anzeigename der Stufe. */
export function stufenName(status) {
  return STUFEN_PROJEKT[status] || status || "–";
}

/** Team eines Projekts (Berater, Planer, Montageleitung) ohne Dubletten, in dieser Reihenfolge. */
export function team(p) {
  return [...new Set([p.berater, p.planer, p.montageleiter].filter(Boolean))];
}

/** Ort aus Projektdaten („Lochau“), sonst aus dem Titel nach dem Gedankenstrich. */
export function ort(p) {
  if (p.objekt_ort) return p.objekt_ort;
  const m = /[–-]\s*([^–-]+)$/.exec(String(p.titel || ""));
  return m ? m[1].trim() : "";
}
