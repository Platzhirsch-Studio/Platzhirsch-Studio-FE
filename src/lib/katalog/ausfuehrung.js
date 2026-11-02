// src/lib/katalog/ausfuehrung.js
// Reine Logik für Galerie und Konfigurator der Katalog-Produktseite
// (Inhaber-Auftrag 31.10.2026: „konfigurierbar, starke Bilder – auch wie es im
// Raum wirkt“). Ohne "@/"-Importe (node --test, Client-Insel).
//
// Datenfelder: bilder[].typ, ausfuehrungen[], zubehoer[], MARKE.looks[] – siehe schema.js.
// Die Insel (src/components/Katalog/Konfigurator.js) bekommt nur das, was
// konfiguratorDaten() liefert: Texte in der Sprache, Bilder als {src,w,h,alt}.
import { bildTyp, textOf } from "./schema.js";

/** Galerie nach Typ: Raumbilder zuerst, dann Freisteller, dann Details (stabil). */
export function galerie(p) {
  const list = p?.bilder || [];
  return {
    ambiente: list.filter((b) => bildTyp(b) === "ambiente"),
    freisteller: list.filter((b) => bildTyp(b) === "freisteller"),
    detail: list.filter((b) => bildTyp(b) === "detail"),
  };
}

/** Standard-Auswahl: je Gruppe die Option mit standard: true, sonst die erste. → [optionId, …] */
export function standardAuswahl(p) {
  return (p?.ausfuehrungen || []).map((g) => (g.optionen.find((o) => o.standard) || g.optionen[0])?.id || null);
}

/** Auswahl prüfen/ergänzen (unbekannte IDs → Standard der Gruppe). */
export function normalisiereAuswahl(p, auswahl = []) {
  const std = standardAuswahl(p);
  return (p?.ausfuehrungen || []).map((g, i) => (g.optionen.some((o) => o.id === auswahl[i]) ? auswahl[i] : std[i]));
}

/** Bild-Objekt zu einem src (aus p.bilder oder dem Bild-Objekt der Option). */
function bildVon(p, b) {
  if (b && typeof b === "object") return b;
  return (p?.bilder || []).find((x) => x.src === b) || null;
}

/**
 * Vorschaubild der Auswahl: das erste Bild der zuletzt geänderten Gruppe mit
 * Bildern (zuletzt), sonst der ersten Gruppe mit Bild in der Auswahl, sonst
 * erster Freisteller bzw. erstes Bild.
 * @param {object} p
 * @param {string[]} auswahl
 * @param {number|null} zuletzt  Index der zuletzt geänderten Gruppe
 */
export function vorschauBild(p, auswahl, zuletzt = null) {
  const gruppen = p?.ausfuehrungen || [];
  const optionBild = (gi) => {
    const o = gruppen[gi]?.optionen.find((x) => x.id === auswahl[gi]);
    return o?.bilder?.length ? bildVon(p, o.bilder[0]) : null;
  };
  if (zuletzt != null) {
    const b = optionBild(zuletzt);
    if (b) return b;
  }
  for (let i = 0; i < gruppen.length; i++) {
    const b = optionBild(i);
    if (b) return b;
  }
  const g = galerie(p);
  return g.freisteller[0] || p?.bilder?.[0] || null;
}

/** Lesbarer Text der Auswahl: „Basis: Eiche · Front-Paneel: Blau (RAL 5024)“. */
export function auswahlText(p, auswahl, locale = "de") {
  return (p?.ausfuehrungen || [])
    .map((g, i) => {
      const o = g.optionen.find((x) => x.id === auswahl[i]);
      if (!o) return null;
      const name = textOf(o.name, locale);
      const code = o.code && !name.includes(o.code) ? ` (${o.code})` : "";
      return `${textOf(g.gruppe, locale)}: ${name}${code}`;
    })
    .filter(Boolean)
    .join(" · ");
}

/** Produkttext für „Beratung anfragen“ (Kontext produkt=…), inkl. Ausführung. */
export function produktMitAusfuehrung(markeName, p, auswahl, locale = "de") {
  const a = auswahlText(p, auswahl, locale);
  return a ? `${markeName} ${p.name} – ${a}` : `${markeName} ${p.name}`;
}

const klein = (b, locale) => (b ? { src: b.src, w: b.width, h: b.height, alt: textOf(b.alt, locale) } : null);

/**
 * Serialisierbare, kleine Daten für die Insel (keine Quellen, keine 4 Sprachen).
 * Vorschau-Rahmen: Seitenverhältnis des breitesten Bilds aller Optionen +
 * Standard (so springt der Rahmen beim Wechsel nicht; object-contain, kein Beschnitt).
 */
/** Herstellercode ohne Platzhalter-Unterstrich am Ende („AVAS1100_“ → „AVAS1100“, QM R1). */
export const sauberCode = (c) => (typeof c === "string" ? c.replace(/_+$/u, "").trim() || null : null);
const sauberName = (n) => (typeof n === "string" ? n.replace(/([A-Z0-9])_+(?=\s|$)/gu, "$1") : n);
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * QM R1 (Agape Cenote): „Montageart“ und „Artikel“ waren zwei unabhängige Wahlen für
 * dieselbe Sache (freistehend + AVAS1101 teilversenkt war möglich). Eine Gruppe B, deren
 * Optionen je genau eine Option einer früheren Gruppe A im Namen tragen (gleiche Anzahl,
 * 1:1), wird in A eingefaltet: A-Option bekommt den Code der B-Option, abweichende
 * Zusatzangaben (z. B. Maße) als detail; B entfällt samt Standardwert.
 * @param {Array<{name: string, optionen: object[]}>} gruppen
 * @param {string[]} standard
 */
export function koppleGruppen(gruppen, standard) {
  const out = gruppen.map((g) => ({ ...g, optionen: g.optionen.map((o) => ({ ...o })) }));
  const std = [...standard];
  for (let bi = out.length - 1; bi > 0; bi--) {
    const b = out[bi];
    for (let ai = 0; ai < bi; ai++) {
      const a = out[ai];
      if (a.optionen.length < 2 || a.optionen.length !== b.optionen.length) continue;
      const paar = a.optionen.map((ao) => {
        const re = new RegExp(`(^|[\\s–,(])${esc(ao.name)}(?=$|[\\s,)])`, "iu");
        return b.optionen.filter((bo) => re.test(String(bo.name)));
      });
      if (!paar.every((m) => m.length === 1) || new Set(paar.map((m) => m[0].id)).size !== a.optionen.length) continue;
      const details = paar.map(([bo], k) => {
        let d = String(bo.name);
        if (bo.code) d = d.split(bo.code).join("");
        d = d.replace(new RegExp(esc(a.optionen[k].name), "iu"), "");
        return d.replace(/^[\s–,-]+|[\s–,-]+$/gu, "").trim();
      });
      const gleich = details.every((d) => d === details[0]);
      a.optionen.forEach((ao, k) => {
        const bo = paar[k][0];
        ao.code = ao.code || sauberCode(bo.code);
        if (!gleich && details[k]) ao.detail = details[k];
        if (!ao.bild && bo.bild) ao.bild = bo.bild;
      });
      out.splice(bi, 1);
      std.splice(bi, 1);
      break;
    }
  }
  return { gruppen: out, standard: std };
}

/** „Gelcoat bordeaux red NCS S 6030-Y80R“ → „… (NCS S 6030-Y80R)“ wie alle anderen Farben (QM R1). */
export function klammerCode(name, code) {
  if (typeof name !== "string" || !code || name.includes(`(${code})`) || !name.endsWith(` ${code}`)) return name;
  return `${name.slice(0, -code.length - 1)} (${code})`;
}

export function konfiguratorDaten(p, locale = "de") {
  const roh = (p?.ausfuehrungen || []).map((g) => ({
    name: textOf(g.gruppe, locale),
    optionen: g.optionen.map((o) => ({
      id: o.id,
      name: klammerCode(sauberName(textOf(o.name, locale)), sauberCode(o.code)),
      code: sauberCode(o.code),
      farbe: o.farbe || null,
      bild: o.bilder?.length ? klein(bildVon(p, o.bilder[0]), locale) : null,
    })),
  }));
  const startStd = standardAuswahl(p);
  const { gruppen, standard: std } = koppleGruppen(roh, startStd);
  const start = klein(vorschauBild(p, startStd), locale);
  const alle = [start, ...gruppen.flatMap((g) => g.optionen.map((o) => o.bild))].filter(Boolean);
  // Höchstes Format (kleinstes w/h) bestimmt die Rahmenhöhe → kein Sprung.
  const ratio = alle.length ? Math.min(...alle.map((b) => b.w / b.h)) : 4 / 3;
  return { gruppen, start, standard: std, ratio: Math.max(ratio, 0.75) };
}
