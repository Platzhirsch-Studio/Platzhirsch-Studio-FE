// src/lib/ezarri/rechner/palette.server.js – schlanke Daten für Rechner, Custom Mix
// und Anfrage (Team C). Liest nur über src/lib/ezarri/data.js (Team A).
//
// SERVER-ONLY: Client-Inseln bekommen nur diese Projektionen als Props.
import "server-only";
import { getConfiguratorPalette, getGrouts, getReference, getVariants, MAX_MIX } from "../data.js";
import { FARBFAMILIEN } from "../facets.js";
import { formatId } from "./core.js";
import TONES from "./tones.json" with { type: "json" };

const thumbOf = (m, format = "25") => m.thumbs?.[format] || m.thumbs?.["25"] || m.thumbs?.["50"] || m.thumbs?.hexa || m.thumbs?.Hexa || null;

/**
 * Anzeigename: Ezarris Schreibweise „Iridiscent“ (Konfigurator-Daten) auf
 * „Iridescent“ (Kollektionsname, Katalog) angleichen. Codes bleiben unverändert.
 */
export function anzeigeName(name) {
  return String(name ?? "").replace(/Iridiscent/g, "Iridescent");
}

/** Formate eines Konfigurator-Mosaiks normalisiert ("25" | "50" | "hexa"); Ezarri liefert z. B. "Hexa". */
const formateOf = (m) => [...new Set((m.formate || []).map(formatId).filter(Boolean))];

const FAMILIE_LABEL = new Map(FARBFAMILIEN.map((f) => [f.id, f.label]));
/** Finish (Spekular-Textur) → deutsche Suchwörter. */
const FINISH_WORTE = { gloss: "glänzend gloss", nacar: "perlmutt schimmernd iridescent nacar", espejo: "spiegel metallisch espejo", spec: "glänzend" };
/** Zusätzliche Suchwörter je Farbfamilie (Alltagssprache). */
const FAMILIE_WORTE = { blau: "türkis azur aqua meer", gruen: "türkis mint oliv", weiss: "creme hell", grau: "anthrazit silber", schwarz: "dunkel", braun: "beige sand", gelb: "gold", rosa: "pink", rot: "orange" };

/**
 * Referenz-ID einer Ezarri-Referenz im gewünschten Format (QM P1-2).
 * Die Konfigurator-Daten verweisen bei 23 von 90 mischbaren Mosaiken auf die
 * 50-mm-Referenz (z. B. "2521-b-50"), auch wenn in 25 mm gemischt wird. Aufgelöst
 * wird über die Format-Varianten der Referenz: 25 → "25mm", 50 → "50mm", hexa → "Hexa".
 * Fehlt die Variante, gilt 25 mm, dann die Referenz selbst.
 * @param {string} refId
 * @param {"25"|"50"|"hexa"} [format]
 * @returns {string|null}
 */
export function referenzFuerFormat(refId, format = "25") {
  const r = refId ? getReference(refId) : null;
  if (!r) return null;
  const ziel = formatId(format) || "25";
  const eigene = formatId(r.format);
  if (eigene === ziel) return r.id;
  const formate = getVariants(r).filter((v) => v.gruppe === "Format" && v.id && getReference(v.id));
  const treffer = (f) => formate.find((v) => formatId(v.label) === f)?.id;
  return treffer(ziel) || (eigene === "25" ? r.id : treffer("25")) || r.id;
}

let PALETTE = null;
function palette() {
  return (PALETTE ??= getConfiguratorPalette());
}

/** Töne eines Konfigurator-Mosaiks [[hex, gewicht], …]; Fallback Grundfarbe. */
export function tonesOf(id) {
  const t = TONES.toene[String(id)];
  if (t?.length) return t;
  const m = palette().find((p) => p.id === String(id));
  return m?.hex ? [[m.hex, 100]] : [["#9a9c9e", 100]];
}

/** Ein Mosaik als Client-Projektion (≈ 250 B). */
function toMixItem(m) {
  const ref = m.referenz ? getReference(m.referenz) : null;
  const formate = formateOf(m);
  const refs = Object.fromEntries(formate.map((f) => [f, referenzFuerFormat(m.referenz, f)]).filter(([, id]) => id));
  const name = anzeigeName(m.name);
  return {
    id: m.id,
    name,
    serie: anzeigeName(m.serie),
    formate,
    farben: m.farbfilter,
    mischbar: m.mischbar,
    toene: tonesOf(m.id),
    thumb: thumbOf(m),
    // Referenz je Format (Anfrage, Muster); "referenz" = 25 mm bzw. erstes Format
    referenz: refs["25"] || refs[formate[0]] || null,
    refs,
    code: ref?.code ?? null,
    finish: m.finish,
    // Suchtext für die Auswahl: Name, Serie, Code, Farbfamilien, Finish (QM P2-6)
    suche: [name, m.serie, ref?.code, ...(m.farbfilter || []).flatMap((f) => [FAMILIE_LABEL.get(f), FAMILIE_WORTE[f]]), FINISH_WORTE[m.finish]]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

/** Alle mischbaren Mosaike (Ezarri: `mischbar`), für das Mischpult. */
export function getMixPalette() {
  return palette().filter((m) => m.mischbar).map(toMixItem);
}

/** Beliebige Konfigurator-Mosaike nach ID (z. B. aus ?m= oder ?k=), unbekannte fallen weg. */
export function getMixItems(ids) {
  const by = new Map(palette().map((m) => [m.id, m]));
  return (ids || []).map((id) => by.get(String(id))).filter(Boolean).map(toMixItem);
}

/**
 * Fertige Ezarri-Mischungen, deren Bestandteile alle mischbar sind → im Mischpult
 * ladbar und veränderbar. Rezept aus data.parseRecipe().
 */
export function getMixRecipes() {
  const by = new Map(palette().map((m) => [m.id, m]));
  return palette()
    .filter((m) => m.rezept?.length > 1 && m.rezept.length <= MAX_MIX)
    .filter((m) => m.rezept.every((r) => by.get(r.mosaikId)?.mischbar))
    .map((m) => ({
      id: m.id,
      name: anzeigeName(m.name),
      serie: anzeigeName(m.serie),
      thumb: thumbOf(m),
      ton: tonesOf(m.id)[0]?.[0] ?? null,
      mix: m.rezept.map((r) => ({ id: r.mosaikId, anteil: r.anteil })),
    }));
}

/**
 * Nicht mischbare Konfigurator-Mosaike (fertige Ezarri-Mischungen wie „Mojito“,
 * Spezialserien) als kleine Suchtreffer: Die Auswahl zeigt sie mit Link zur
 * Mosaik-Seite statt „0 Treffer“ (QM P2-6). ≈ 70 B je Eintrag.
 */
export function getFesteMosaike() {
  return palette()
    .filter((m) => !m.mischbar && m.referenz)
    .map((m) => {
      const name = anzeigeName(m.name);
      return {
        id: m.id,
        name,
        serie: anzeigeName(m.serie),
        referenz: referenzFuerFormat(m.referenz, "25"),
        suche: [name, m.serie, ...(m.farbfilter || []).flatMap((f) => [FAMILIE_LABEL.get(f), FAMILIE_WORTE[f]])].filter(Boolean).join(" ").toLowerCase(),
      };
    });
}

/** Fugenfarben (7) als {id, name, hex}. */
export function getGroutList() {
  return getGrouts().map((g) => ({ id: g.id, name: g.name, hex: g.farbe_hex }));
}

/**
 * Referenzen für die Anfrage-Chips (IDs aus ?ref=). Unbekannte IDs fallen weg.
 * @returns {Array<{id:string, code:string, name:string, kollektion:string}>}
 */
export function getReferenceChips(ids, max = 6) {
  const seen = new Set();
  const out = [];
  for (const raw of ids || []) {
    const id = String(raw).trim().toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const r = getReference(id);
    if (r) out.push({ id: r.id, code: r.code, name: displayName(r), kollektion: r.kollektion });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Referenzen zu Konfigurator-Mosaik-IDs (Mischung → Anfrage), im aktiven Format
 * der Mischung (QM P1-2: sonst gingen 50-mm-Muster raus, obwohl in 25 mm gemischt wird).
 * @param {Array<{id:string}>} mix
 * @param {"25"|"50"|"hexa"} [format]
 */
export function referencesForMix(mix, format = "25") {
  const by = new Map(palette().map((m) => [m.id, m]));
  return (mix || []).map((x) => referenzFuerFormat(by.get(String(x.id))?.referenz, format)).filter(Boolean);
}

function displayName(r) {
  const name = String(r.name || r.code || r.id).replace(/\s+(25|50|hexa)$/i, "");
  return name;
}

export { MAX_MIX };
