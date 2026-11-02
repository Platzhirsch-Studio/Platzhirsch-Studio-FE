// Ezarri-Kollektionsseiten: Einleitung, H1 und Description (R5 seo P2-3).
// Rein, ohne React – von page.js und Unit-Tests genutzt. Welle 2: optionaler
// letzter Parameter `locale` ("en" → englische Sätze, sonst deutsch).
import { LINIE_LABEL } from "./copy.js";
import { LINIE_LABEL as LINIE_LABEL_EN } from "./copy.en.js";
import { LINIE_LABEL as LINIE_LABEL_FR } from "./copy.fr.js";
import { LINIE_LABEL as LINIE_LABEL_IT } from "./copy.it.js";
import { wert } from "./werte.js";
import { clampDescription } from "../seo/pageMetadata.js";

const OBERFLAECHE_EN = { "glänzend": "gloss", matt: "matt", satiniert: "satin", phosphoreszierend: "glow-in-the-dark" };

const oberflaecheText = (c, en = false) => {
  if (!c?.oberflaeche) return null;
  const o = (v) => (en ? OBERFLAECHE_EN[v] ?? v : v);
  return [...new Set([...(c.oberflaeche.standard || []).map(o), ...(c.oberflaeche.safe || []).map((x) => `${o(x)} (Safe)`)])].join(", ");
};

// 01.11.2026: Französisch und Italienisch (Oberflächen über werte.wert()).
const oberflaecheIntl = (c, locale) => {
  if (!c?.oberflaeche) return null;
  const o = (v) => wert("oberflaeche", v, locale);
  return [...new Set([...(c.oberflaeche.standard || []).map(o), ...(c.oberflaeche.safe || []).map((x) => `${o(x)} (Safe)`)])].join(", ");
};
const fmtList = (c) => c.formate.join(", ").replace(/mm/g, " mm");

export function introSaetze(c, refs, locale = "de") {
  const basis = refs.filter((r) => r.typ === "mosaik").length;
  if (locale === "fr") {
    const parts = [`${c.name} fait partie de la ligne ${LINIE_LABEL_FR[c.linie] ?? c.linie}.`];
    if (refs.length) parts.push(`${refs.length} références, dont ${basis} mosaïques${refs.length > basis ? ", plus Safe-Steps et pièces spéciales" : ""}.`);
    if (c.formate?.length) parts.push(`Formats : ${fmtList(c)}.`);
    if (oberflaecheIntl(c, "fr")) parts.push(`Surface : ${oberflaecheIntl(c, "fr")}.`);
    return parts;
  }
  if (locale === "it") {
    const parts = [`${c.name} fa parte della linea ${LINIE_LABEL_IT[c.linie] ?? c.linie}.`];
    if (refs.length) parts.push(`${refs.length} referenze, di cui ${basis} mosaici${refs.length > basis ? ", oltre a Safe-Steps e pezzi speciali" : ""}.`);
    if (c.formate?.length) parts.push(`Formati: ${fmtList(c)}.`);
    if (oberflaecheIntl(c, "it")) parts.push(`Superficie: ${oberflaecheIntl(c, "it")}.`);
    return parts;
  }
  if (locale === "en") {
    const parts = [`${c.name} belongs to the ${LINIE_LABEL_EN[c.linie] ?? c.linie} line.`];
    if (refs.length) parts.push(`${refs.length} references, ${basis} of them mosaics${refs.length > basis ? ", plus Safe-Steps and special pieces" : ""}.`);
    if (c.formate?.length) parts.push(`Formats ${c.formate.join(", ").replace(/mm/g, " mm")}.`);
    if (oberflaecheText(c, true)) parts.push(`Surface ${oberflaecheText(c, true)}.`);
    return parts;
  }
  const parts = [`${c.name} gehört zur Linie ${LINIE_LABEL[c.linie] ?? c.linie}.`];
  if (refs.length) parts.push(`${refs.length} Referenzen, davon ${basis} Mosaike${refs.length > basis ? ", dazu Safe-Steps und Formstücke" : ""}.`);
  if (c.formate?.length) parts.push(`Formate ${c.formate.join(", ").replace(/mm/g, " mm")}.`);
  if (oberflaecheText(c)) parts.push(`Oberfläche ${oberflaecheText(c)}.`);
  return parts;
}

export const intro = (c, refs, locale = "de") => introSaetze(c, refs, locale).join(" ");

/** Sprechende H1: „Gea – Glasmosaik von Ezarri“ (statt nur „Gea“); englisch „Gea – glass mosaic by Ezarri“. */
const H1 = { en: (n) => `${n} – glass mosaic by Ezarri`, fr: (n) => `${n} – mosaïque de verre Ezarri`, it: (n) => `${n} – mosaico di vetro Ezarri` };
export const kollektionH1 = (c, locale = "de") => (H1[locale] ? H1[locale](c.name) : `${c.name} – Glasmosaik von Ezarri`);

/**
 * Description aus ganzen Sätzen, ≤ max Zeichen, nie mitten im Wort (vorher
 * .slice(0, 160): „… Beratung in Loc“). Kopf mit Markenname, Schluss
 * „Muster und Beratung in Lochau.“, dazwischen so viele Fakten, wie passen.
 */
export function kollektionDescription(c, refs, max = 150, locale = "de") {
  const KOPF = {
    en: `Ezarri ${c.name}: glass mosaic of the ${LINIE_LABEL_EN[c.linie] ?? c.linie} line.`,
    fr: `Ezarri ${c.name} : mosaïque de verre de la ligne ${LINIE_LABEL_FR[c.linie] ?? c.linie}.`,
    it: `Ezarri ${c.name}: mosaico di vetro della linea ${LINIE_LABEL_IT[c.linie] ?? c.linie}.`,
  };
  const SCHLUSS = { en: "Samples and advice in Lochau.", fr: "Échantillons et conseil à Lochau.", it: "Campioni e consulenza a Lochau." };
  const kopf = KOPF[locale] ?? `Ezarri ${c.name}: Glasmosaik der Linie ${LINIE_LABEL[c.linie] ?? c.linie}.`;
  const schluss = SCHLUSS[locale] ?? "Muster und Beratung in Lochau.";
  let text = kopf;
  // fr/it (01.11.2026): Custom-Linien haben kaum Datenblatt-Fakten → der Service-Satz
  // (Kurzform von KOLLEKTIONEN.custom in copy.<lang>.js), damit die Description ≥ 120 Zeichen hat.
  const SERVICE = { fr: "Mélange ou motif sur mesure pour votre projet.", it: "Miscela o motivo su misura per il vostro progetto." };
  const ORT = { fr: "Showroom au bord du lac de Constance.", it: "Showroom sul Lago di Costanza." };
  const extra = [...(c.linie === "Custom" && SERVICE[locale] ? [SERVICE[locale]] : []), ...(ORT[locale] ? [ORT[locale]] : [])];
  for (const satz of [...introSaetze(c, refs, locale).slice(1), ...extra]) {
    if (`${text} ${satz} ${schluss}`.length <= max) text = `${text} ${satz}`;
  }
  const mit = `${text} ${schluss}`;
  if (mit.length <= max) return mit;
  return text.length <= max ? text : clampDescription(text, max);
}
