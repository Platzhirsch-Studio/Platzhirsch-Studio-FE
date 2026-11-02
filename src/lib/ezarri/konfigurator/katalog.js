// src/lib/ezarri/konfigurator/katalog.js – Konfigurator-Katalog für den Browser (Team B).
//
// SERVER-ONLY: liest data.js (2,5 MB JSON) und baut eine schlanke Projektion:
//   - alle 402 Referenzen (Mosaik, Safe, Corner, Cove) mit gemessenen Steinfarben
//     (measured-colors.json), Glanz/Reflexion/Finish aus Ezarris Konfigurator-Daten,
//     Format, Mischbarkeit, Bildpfad, Wasserwirkung, Spezialteilen
//   - Kollektionen (Name, Linie), 7 Fugen, 20 Patterns (Steinmasken aus patterns.json),
//     57 Ezarri-Mischungen (Rezepte)
// Der Browser bekommt beim ersten Aufruf nur die Referenzen des aktuellen Zustands
// (katalogFuer) und lädt den Rest im Leerlauf über /de/ezarri/konfigurator/katalog.
//
// Mosaik-ID im Zustand (state.js): Konfigurator-ID ("38"), sonst Referenz-ID.
// Quellenangabe: Daten und Bilder Ezarri (ezarri.com), Farben gemessen aus Ezarri-Bildern.
import "server-only";
import { getCollections, getGrouts, getPatterns, getConfiguratorPalette, getReferenceIndex, getReference, getReferenceIds, getVariants, DATA_STAND } from "../data.js";
import { EZARRI_SITE_URL } from "../config.js";
import MEASURED from "./measured-colors.json" with { type: "json" };
import PATTERN_MASKS from "./patterns.json" with { type: "json" };
import KONF_ROH from "../configurator.json" with { type: "json" };
import { safeVarianten } from "./safe-varianten.js";

/** Finish-Art aus Ezarris Specular-Textur bzw. Kollektion/Oberfläche. */
function finishArt(konf, ref) {
  const tex = konf?.finish; // gloss | spec | nacar | espejo | null
  if (tex === "nacar") return "perlmutt";
  if (tex === "espejo") return "spiegel";
  if (ref.kollektion === "gold" || ref.kollektion === "metal") return "spiegel";
  if (ref.kollektion === "iridescent") return "perlmutt";
  if (ref.kollektion === "fosfo" || ref.oberflaeche === "phosphoreszierend") return "leucht";
  if (ref.oberflaeche === "matt") return "matt";
  if (ref.oberflaeche === "satiniert") return "satin";
  return "glanz";
}

/** Glanz (0–1) und Reflexion (0–1): Ezarri-Werte, sonst aus der Oberfläche abgeleitet. */
function finishWerte(konf, ref, art) {
  let glanz = Number(konf?.glanz) || 0;
  let reflexion = Number(konf?.reflexion) || 0;
  if (!glanz && !reflexion) {
    const t = { matt: [0.12, 0.05], satin: [0.35, 0.15], glanz: [0.6, 0.3], perlmutt: [0.55, 0.5], spiegel: [0.9, 0.6], leucht: [0.4, 0.2] }[art] || [0.5, 0.25];
    [glanz, reflexion] = t;
  }
  if (ref.typ === "safe-step" || /safe/.test(ref.id)) glanz = Math.min(glanz, 0.25);
  return [Math.round(glanz * 100) / 100, Math.round(reflexion * 100) / 100];
}

/** Serien mit Zeichnung im Stein (Wolken, Flecken, Körnung) statt einfarbiger Steine. */
const GEZEICHNET = new Set(["aquarelle", "gea", "zen", "terrazzo", "space"]);

/** "Dune 25" → "Dune" (Name ohne Format, für abgeleitete Safe-Einträge). */
const baseCode = (n) => String(n || "").replace(/s+(25|50|hexa)(s*mm)?(s+safe)?$/i, "").replace(/s+safe$/i, "").trim();

const formatOf = (f) => (f === "25mm" ? "25" : f === "50mm" ? "50" : f === "Hexa" ? "hexa" : null);

let KATALOG = null;

function build() {
  const palette = getConfiguratorPalette();
  const konfById = new Map(palette.map((m) => [m.id, m]));
  const cards = getReferenceIndex();
  const refs = cards.map((c) => {
    const r = getReference(c.id);
    const konfId = r.konfigurator?.id ?? null;
    const konf = konfId ? konfById.get(konfId) : null;
    const art = finishArt(konf, r);
    const [glanz, reflexion] = finishWerte(konf, r, art);
    const varianten = getVariants(r);
    const spez = {};
    for (const v of varianten) {
      if (v.gruppe === "Special Pieces" && v.id) spez[v.label === "Cove" ? "cove" : "corner"] = v.id;
    }
    // Corner/Cove: Farbe des Grundmosaiks (Produktfoto ist freigestellt)
    const basis = varianten.find((v) => v.gruppe === "Format" && v.id)?.id;
    const farben = (r.typ === "corner" || r.typ === "cove") && basis && MEASURED.farben[basis] ? MEASURED.farben[basis] : MEASURED.farben[r.id] || (c.hex ? [[c.hex, 100]] : [["#9fb4b8", 100]]);
    const fmt = formatOf(r.format) || formatOf(r.formate_verfuegbar?.[0]?.label) || (r.konfigurator?.formate?.[0] === "50" ? "50" : r.typ === "corner" || r.typ === "cove" ? null : "25");
    const anw = (r.bilder?.anwendung || []).slice(0, 2).map((b) => ({ web: b.web, b: b.breite || 1600, h: b.hoehe || 1200 }));
    const out = {
      id: r.id,
      code: r.code || r.name,
      name: r.name,
      kol: r.kollektion,
      typ: r.typ,
      fmt,
      safe: r.typ === "safe-step" || /-safe(-|$)/.test(r.id),
      mid: konfId || r.id,
      mx: Boolean(r.konfigurator?.mischbar),
      pal: farben,
      fin: [glanz, reflexion, art],
      ...(GEZEICHNET.has(r.kollektion) ? { gez: 1 } : {}),
      img: r.bilder?.mosaik?.[0]?.web || null,
      ...(anw.length ? { anw } : {}),
      ff: r.farbfamilien || [],
      wf: [].concat(r.wasserfarbe ?? []),
      ob: r.oberflaeche ?? null,
      ...(spez.corner || spez.cove ? { spez } : {}),
      ...(r.quelle && r.quelle !== `${EZARRI_SITE_URL}/${r.id}` ? { q: r.quelle } : {}),
    };
    return out;
  });

  // Safe-Ausführungen, die Ezarri nur als ?as-25/?as-50 auf derselben Produktseite führt (P1-2)
  const byId = new Map(refs.map((r) => [r.id, r]));
  for (const v of safeVarianten(getReferenceIds().map(getReference))) {
    const b = byId.get(v.basis);
    if (!b) continue;
    const fmt = v.format === "50mm" ? "50" : "25";
    const safe = {
      ...b,
      id: v.id,
      code: `${baseCode(b.code)} ${fmt} Safe`,
      name: `${baseCode(b.name)} ${fmt} Safe`,
      typ: "safe-step",
      fmt,
      safe: true,
      fin: [Math.min(b.fin[0], 0.25), b.fin[1], b.fin[2]],
      q: v.quelle,
      basis: v.basis,
    };
    refs.push(safe);
    byId.set(v.id, safe);
  }

  const kollektionen = Object.fromEntries(getCollections().map((c) => [c.id, [c.name, c.linie]]));
  const fugen = getGrouts().map((g) => ({ id: g.id, name: g.name, hex: g.farbe_hex }));
  const patterns = getPatterns()
    .filter((p) => PATTERN_MASKS[p.id])
    .map((p) => ({ id: p.id, name: p.name, design: p.design_es, kanaele: PATTERN_MASKS[p.id].kanaele, w: PATTERN_MASKS[p.id].w, h: PATTERN_MASKS[p.id].h, maske: PATTERN_MASKS[p.id].maske, bild: p.bild?.web || null }));
  // Ezarri-Mischungen (P1-1): nur Rezepte, deren Bestandteile ALLE im Katalog stehen,
  // mit Ezarris Anteilen unverändert (kein Hochrechnen). Fehlt ein Bestandteil im
  // Ezarri-Abzug (IDs 0, 66, 67, 133–136), bieten wir die Mischung nicht als Rezept an,
  // sondern zeigen die fertige Ezarri-Referenz selbst (Farben gemessen aus dem
  // Produktfoto) mit dem Hinweis „Rezept unvollständig“.
  const knownMid = new Set(refs.map((r) => r.mid));
  const roh = new Map((KONF_ROH.mosaike || []).map((m) => [m.id, m]));
  const rezepte = palette
    .filter((m) => roh.get(m.id)?.cf_mosaico)
    .map((m) => {
      const r = roh.get(m.id);
      const ids = String(r.cf_mosaico).split(";").map((x) => x.trim());
      const teile = String(r.mischanteil || "").split(";").map((x) => Number.parseFloat(x));
      const summe = teile.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
      const fehlend = ids.filter((id) => !knownMid.has(id));
      const passt = ids.length === teile.length && teile.every((n) => Number.isFinite(n) && n > 0) && Math.round(summe) === 100 && ids.length <= 4 && new Set(ids).size === ids.length;
      const basis = { id: m.id, name: m.name, serie: m.serie, ref: m.referenz };
      if (!fehlend.length && passt) return { ...basis, mix: ids.map((id, i) => ({ id, anteil: Math.round(teile[i]) })) };
      // QM R2 P3: Summe 99 % (Alexander Gold, Rundung bei Ezarri) → größter Anteil +1,
      // als „normalisiert“ markiert. Andere Abweichungen bleiben „nach Produktfoto“.
      const fast = ids.length === teile.length && teile.every((n) => Number.isFinite(n) && n > 0) && Math.round(summe) === 99 && ids.length <= 4 && new Set(ids).size === ids.length;
      if (!fehlend.length && fast) {
        const gross = teile.indexOf(Math.max(...teile));
        return { ...basis, mix: ids.map((id, i) => ({ id, anteil: Math.round(teile[i]) + (i === gross ? 1 : 0) })), normalisiert: true };
      }
      // Ersatz: die Ezarri-Referenz selbst (z. B. „mojito“), sofern im Katalog
      if (!knownMid.has(m.id)) return null;
      return { ...basis, mix: [{ id: m.id, anteil: 100 }], unvollstaendig: true, fehlend: fehlend.length ? fehlend : ["Anteile"] };
    })
    .filter(Boolean);

  return { stand: DATA_STAND, quelle: EZARRI_SITE_URL, refs, kollektionen, fugen, patterns, rezepte };
}

/** Vollständiger Katalog (für die Route /katalog). */
export function getKonfiguratorKatalog() {
  return (KATALOG ??= build());
}

/** Bekannte Mosaik-IDs (für decodeState isKnown). */
export function isKnownMosaic(id) {
  const k = getKonfiguratorKatalog();
  return k.refs.some((r) => r.mid === id || r.id === id);
}

/**
 * Teilkatalog für den ersten Render: alle Referenzen der im Zustand genannten
 * Mosaik-IDs (alle Formate und Safe-Ausführungen) plus Spezialteile, alle Fugen,
 * Pattern-Metadaten und Kollektionen.
 */
export function katalogFuer(state) {
  const k = getKonfiguratorKatalog();
  const mids = new Set([
    ...state.mix.map((e) => e.id),
    ...state.kanaele.map((e) => e.id),
    ...(state.pattern?.ids || []),
  ]);
  const refs = k.refs.filter((r) => mids.has(r.mid) || mids.has(r.id));
  const spezIds = new Set(refs.flatMap((r) => Object.values(r.spez || {})));
  if (state.spezial?.cornerId) spezIds.add(state.spezial.cornerId);
  if (state.spezial?.coveId) spezIds.add(state.spezial.coveId);
  const spez = k.refs.filter((r) => spezIds.has(r.id) && !refs.includes(r));
  // Pattern-Masken (zusammen ca. 49 KB) nur für das gewählte Pattern
  const patterns = k.patterns.map((p) => (p.id === state.pattern?.id ? p : { ...p, maske: null }));
  return { ...k, refs: [...refs, ...spez], patterns, teil: true };
}
