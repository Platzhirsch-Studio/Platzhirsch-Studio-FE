// src/lib/marken/minottiBodensee.js
// „Minotti am Bodensee“ auf der Minotti-Markenseite (/de/ueber-uns/marken/minotti)
// und der Modell-Link „Dieses Modell im Sofaplaner planen“ auf Minotti-Sofa-
// Produkt- und Kollektionsseiten (Ideen-Team lokal-seo, 31.10.2026).
//
// Regeln:
// - Studio-/Händleraussage NUR über den Claim-Guard (dealerStatement aus
//   src/lib/legal/claims.js), Adresse aus src/lib/site.js.
// - Keine Aussage, welche Modelle ausgestellt sind; keine Fahrzeiten, keine
//   Fläche, keine Preise, keine Superlative.
// - Alle Ziele sind deutsche Seiten → nur locale "de" (sonst null / []).
// - Nicht verlinkt: /einkaufen-aus-der-schweiz (Entwurf, noindex, „unverlinkt
//   bis zur Freigabe“) – stattdessen der freigegebene Schweiz-Ratgeber.
// - Der Sofaplaner-Link auf ein Modell (?m=<slug>) nur, wenn die Familie im
//   Sofaplaner-Katalog existiert (`hasFamily`, auf dem Server getFamily() aus
//   src/lib/sofaplaner/catalog.server.js). Ohne Minotti-Zustimmung enthält der
//   Katalog nur neutrale Typen → kein Modell-Link.
//
// Rein (nur relative Imports), damit node --test es laden kann
// (tests/unit/minotti-bodensee.test.mjs).
import { dealerStatement } from "../legal/claims.js";
import { ADDRESS } from "../site.js";
import { withContext } from "../forms/pathContext.js";
import { terminBase } from "../kuechenplaner/planTermin.js";
import { sourceCopyFor } from "../sofaplaner/consent.js";

const BRAND_SLUG = "minotti";

// Nur Kategorien, in denen ein Produkt ein Sofa-Modell ist (Sessel/Liegen haben
// eigene Namen, die mit einer Sofa-Familie verwechselt werden könnten).
export const SOFA_MODEL_CATEGORIES = Object.freeze(["sofas-couches"]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

const slugify = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Ist die Marke Minotti (Name oder Slug)? */
export function isMinotti(brand) {
  return slugify(brand) === BRAND_SLUG;
}

/**
 * Sofa-Familie (Sofaplaner-Slug) zu einem Produkt- oder Kollektionsnamen.
 * Längstes Präfix an Wortgrenzen, das im Katalog existiert:
 * „Lido Sofas“ → lido, „Freeman Tailor“ → freeman-tailor, „Yves Sofa“ → yves-sofa.
 * Ein führendes „Minotti“ fällt weg. Ohne Treffer null.
 * @param {string} name
 * @param {(slug: string) => boolean} hasFamily
 */
export function matchSofaFamily(name, hasFamily) {
  if (typeof hasFamily !== "function") return null;
  const tokens = slugify(name).split("-").filter(Boolean);
  if (tokens[0] === BRAND_SLUG) tokens.shift();
  for (let n = Math.min(tokens.length, 6); n > 0; n--) {
    const slug = tokens.slice(0, n).join("-");
    if (SLUG_RE.test(slug) && hasFamily(slug)) return slug;
  }
  return null;
}

/**
 * Modell-Familie für eine Produkt- oder Kollektionsseite, oder null:
 * nur Deutsch, nur Minotti, (bei Produkten) nur Sofa-Kategorie, nur bekannte Familie.
 * @param {{locale: string, brand?: string, name?: string, categoryKey?: string|null, hasFamily: (slug: string) => boolean}} p
 *   categoryKey: undefined = keine Kategorie-Prüfung (Kollektionsseite).
 */
export function sofaplanerFamilyFor({ locale, brand, name, categoryKey, hasFamily }) {
  if (locale !== "de" || !isMinotti(brand) || !name) return null;
  if (categoryKey !== undefined && !SOFA_MODEL_CATEGORIES.includes(slugify(categoryKey))) return null;
  return matchSofaFamily(name, hasFamily);
}

/** Pfad (ohne Sprache) des Sofaplaners mit vorgewähltem Modell. */
export function sofaplanerModelPath(slug) {
  return SLUG_RE.test(String(slug || "")) ? `/sofaplaner?m=${encodeURIComponent(slug)}` : "/sofaplaner";
}

export const SOFAPLANER_MODEL_LABEL = "Dieses Modell im Sofaplaner planen";

/** Termin-Link (mit Sprache) für das Minotti Studio: /de/termin bei aktivem Kalender, sonst /de/beratung. */
export function minottiTerminHref(calendar = false) {
  return withContext(terminBase("de", Boolean(calendar)), { thema: "sofa", produkt: "Minotti" });
}

const all = () => true;

/**
 * Inhalt des Abschnitts „Minotti am Bodensee“ (nur Minotti, nur Deutsch), sonst null.
 * @param {{slug: string, locale: string, calendar?: boolean, on?: (id: string) => boolean}} p
 * @returns {null | {title: string, paragraphs: string[], address: {label: string, lines: string[]}, links: {id: string, href: string, label: string, hrefLang?: string}[], faq: {q: string, a: string}[]}}
 */
export function minottiBodensee({ slug, locale, calendar = false, on = all }) {
  if (slug !== BRAND_SLUG || locale !== "de") return null;
  const studio = dealerStatement(BRAND_SLUG, "de");
  if (!studio) return null;
  const street = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`;
  const links = [
    on("sofaplaner") && { id: "sofaplaner", href: "/de/sofaplaner", label: `${sourceCopyFor("de").seoName}: Sofa vorab zusammenstellen` },
    { id: "termin", href: minottiTerminHref(calendar), label: "Termin im Minotti Studio anfragen" },
    { id: "ratgeber-preis", href: "/de/ratgeber/was-kostet-ein-minotti-sofa", label: "Ratgeber: Was kostet ein Minotti-Sofa?" },
    { id: "ratgeber-schweiz", href: "/de/ratgeber/moebel-aus-oesterreich-in-die-schweiz", label: "Aus der Schweiz: Möbel aus Österreich einführen" },
    on("yacht") && { id: "yacht", href: "/de/yacht-interior", label: "Minotti auch an Bord: Yacht-Interieur" },
  ].filter(Boolean);
  return {
    title: "Minotti am Bodensee",
    paragraphs: [
      studio,
      `Sie finden das Studio in unserem Showroom in ${ADDRESS.city} am Bodensee. Für einen Besuch empfehlen wir einen Termin – dann hat jemand aus dem Team Zeit für Sie, und Sie können vorab sagen, welches Modell Sie interessiert.`,
    ],
    address: { label: "Showroom", lines: [street, `${ADDRESS.region}, ${ADDRESS.country}`] },
    links,
    faq: [
      {
        q: "Wo kann ich Minotti am Bodensee probesitzen?",
        a: `Im Minotti Studio by Platzhirsch Home Living in unserem Showroom, ${street}. Wir empfehlen einen Termin: Schreiben Sie in die Anfrage, welches Modell Sie interessiert, dann sagen wir Ihnen, was Sie vor Ort ausprobieren können.`,
      },
    ],
  };
}
