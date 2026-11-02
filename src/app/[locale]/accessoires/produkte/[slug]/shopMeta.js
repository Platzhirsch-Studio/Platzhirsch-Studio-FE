// Meta-Titel/-Beschreibung der Shop-Produktseiten (/accessoires/produkte/<slug>).
// Crawl 01.11.2026: (1) gleichnamige Artikel einer Marke und Kategorie (z. B.
// Riedel „Merlot Dekanter“ einzeln und als Restaurant-6er-Set) hatten denselben
// <title>, ebenso lange Namen, die erst durch das Kürzen auf 60 Zeichen gleich
// wurden („Assouline Bahrain Pearls“); (2) viele Kurztexte ergaben Meta-
// Descriptions unter 70 Zeichen („Streichhölzer von Baobab Collection.“).
// Nur Katalogdaten (Name, Serie, Slug, Merkmale) – keine erfundenen Angaben.
// Relativer Import (kein "@/"), damit node --test die Datei direkt laden kann.
import { META_TITLE_MAX, clampDescription, cutTitle, fitTitle } from "../../../../../lib/seo/pageMetadata.js";

const MIN = 70;
const SUFFIX = " | Platzhirsch";

const SCHLUSS = Object.freeze({
  de: "Produktdetails und Herstellerangaben bei Platzhirsch Home Living.",
  en: "Product details and manufacturer information at Platzhirsch Home Living.",
  fr: "Détails du produit et informations du fabricant chez Platzhirsch Home Living.",
  it: "Dettagli del prodotto e informazioni del produttore da Platzhirsch Home Living.",
});

const woerter = (s) => String(s || "").split(/\s+/).filter(Boolean);
const gross = (w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1));

/**
 * Unterscheidungs-Zusatz für den Titel, wenn andere Artikel derselben Marke und
 * Kategorie denselben Namen tragen. Vorrang: Wörter der Serie, die den anderen
 * fehlen („Restaurant“); sonst der eigene Slug-Rest nach dem gemeinsamen Anfang
 * („belles-matieres“ → „Belles Matieres“). Der Artikel mit dem kürzesten Slug
 * behält meist den Titel ohne Zusatz.
 * @param {{slug: string, marke: string, name: string, kategorie: string, serie?: string}} p
 * @param {Array<typeof p>} liste alle Produkte der Welt
 * @returns {string}
 */
export function titelZusatz(p, liste) {
  const gruppe = liste.filter((x) => x.marke === p.marke && x.kategorie === p.kategorie && x.name === p.name);
  if (gruppe.length < 2) return "";
  const andere = gruppe.filter((x) => x.slug !== p.slug);
  const fremd = new Set(andere.flatMap((x) => woerter(x.serie).map((w) => w.toLowerCase())));
  const serieExtra = woerter(p.serie).filter((w) => !fremd.has(w.toLowerCase()));
  if (serieExtra.length && andere.every((x) => woerter(x.serie).length)) return serieExtra.join(" ");
  const teile = gruppe.map((x) => x.slug.split("-"));
  let n = 0;
  while (teile.every((t) => n < t.length && t[n] === teile[0][n])) n += 1;
  return p.slug.split("-").slice(n).map(gross).join(" ");
}

/** Kürzeste Wortfolge vom Ende von `name`, mit der kein anderer Name endet. */
function eigenesEnde(name, andere) {
  const w = woerter(name);
  const enden = andere.map((a) => woerter(a));
  for (let k = 1; k <= w.length; k += 1) {
    const end = w.slice(-k).join(" ");
    if (enden.every((o) => o.slice(-k).join(" ") !== end)) return end.replace(/^[-–]\s*/u, "");
  }
  return "";
}

/**
 * <title> aller Produkte einer Welt in einer Sprache, garantiert verschieden:
 * „Marke Name [Zusatz] – Kategorie | Platzhirsch“ (fitTitle, ≤ 60 Zeichen).
 * Werden zwei Titel erst durch das Kürzen gleich, behält jeder das Ende seines
 * Namens, das ihn unterscheidet („Assouline Bahrain Pearls (Ultimate)“).
 * @param {Array<{slug: string, marke: string, name: string, kategorie: string, serie?: string}>} liste
 * @param {{markeName: (p: object) => string, kategorie: (p: object) => string}} o
 * @returns {Map<string, string>} slug → Titel
 */
export function shopTitel(liste, { markeName, kategorie }) {
  const basis = new Map(liste.map((p) => {
    const z = titelZusatz(p, liste);
    return [p.slug, `${markeName(p)} ${p.name}${z ? ` ${z}` : ""}`];
  }));
  const titel = new Map(liste.map((p) => [p.slug, fitTitle(`${basis.get(p.slug)} – ${kategorie(p)}${SUFFIX}`)]));
  const nachTitel = new Map();
  for (const [slug, t] of titel) nachTitel.set(t, [...(nachTitel.get(t) || []), slug]);
  for (const slugs of nachTitel.values()) {
    if (slugs.length < 2) continue;
    for (const slug of slugs) {
      const ende = eigenesEnde(basis.get(slug), slugs.filter((s) => s !== slug).map((s) => basis.get(s)));
      if (!ende) continue;
      const kopf = cutTitle(basis.get(slug), META_TITLE_MAX - ende.length - 1);
      titel.set(slug, kopf.endsWith(ende) ? kopf : `${kopf} ${ende}`);
    }
  }
  return titel;
}

/**
 * Meta-Beschreibung (bereits auf ≤ 150 Zeichen gekürzt): der Kurztext, wenn er
 * gekürzt noch ≥ 70 Zeichen hat. Sonst Name davor (falls er im Text fehlt),
 * dann Merkmale, bis 70 Zeichen erreicht sind, zuletzt ein fester Schlusssatz.
 * @param {{kurz: string, name: string, merkmale?: string[], locale: string}} a
 * @returns {string}
 */
export function metaBeschreibung({ kurz, name, merkmale = [], locale }) {
  let text = clampDescription(kurz);
  if (text.length >= MIN) return text;
  const dazu = (teil) => {
    const s = String(teil || "").trim().replace(/([^.!?…])$/u, "$1.");
    if (!s) return;
    const neu = clampDescription(text ? `${text} ${s}` : s);
    if (neu.length > text.length) text = neu;
  };
  if (name && !text.toLowerCase().includes(String(name).toLowerCase())) {
    const neu = clampDescription(text ? `${name}: ${text}` : name);
    if (neu.length > text.length) text = neu;
  }
  // Merkmale, deren Wörter schon alle im Text stehen („Fayence“, „Serie: Lyngby“), bringen nichts.
  const wortSet = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  for (const m of merkmale) {
    if (text.length >= MIN) break;
    const da = new Set(wortSet(text));
    if (wortSet(m).every((w) => da.has(w))) continue;
    dazu(m);
  }
  if (text.length < MIN) dazu(SCHLUSS[locale] || SCHLUSS.de);
  return text;
}
