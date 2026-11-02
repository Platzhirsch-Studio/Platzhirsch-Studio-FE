// src/lib/legal/brand.js
// Marken-Datensätze aus dem Backoffice "browserfest" machen (UWG, R1-legal).
//
// Problem: Das Backoffice-Feld dealers_description_* enthält bei fast jeder
// Marke "Platzhirsch Studio ist Ihr (offizieller) X Händler in Vorarlberg."
// Geht das ganze `marke`-Objekt an eine Client-Komponente, steht der Satz im
// RSC-/Flight-Payload des HTML, auch wenn die Anzeige ihn filtert. Crawler
// lesen ihn trotzdem. Deshalb: serverseitig NUR bereinigte Felder weitergeben.
//
// Eine Quelle: Muster und Händler-Liste kommen aus ./claims.js.
// Reine Logik (relative Imports, kein 'server-only'), testbar mit node --test.
import { sanitizeClaims, hasDealerClaim, hasCountryPromise, isVerifiedDealerBrand, dealerStatement, dealerStudio, toBrandSlug } from "./claims.js";

export const BRAND_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Felder, die nie ungeprüft an den Browser gehen. */
export const DEALER_FIELD_RE = /^dealers_(?:title|description)(?:_[a-z]{2})?$/;

// Felder mit festen Werten (Namen, Pfade, Zahlen): nicht umschreiben.
const RAW_FIELD_RE = /^(?:name|name1|name2|slug|url|link|website|bild|image|logo|video|doctype|owner|creation|modified|grundungsjahr|herkunftsland)(?:_|$)|_(?:url|link|bild|image|logo|slug|id)$/i;

/** Neutrale Showroom-Texte (gleicher Wortlaut wie messages-marken.json, {brand} = Markenname). */
export const NEUTRAL_SHOWROOM_TEXT = Object.freeze({
  de: {
    title: "{brand} in unserer Ausstellung in Lochau",
    text: "Wir zeigen und planen {brand} in unserer Ausstellung in Lochau am Bodensee. Welche Stücke gerade ausgestellt sind, sagen wir Ihnen gern vorab.",
  },
  en: {
    title: "{brand} in our showroom in Lochau",
    text: "We show and plan {brand} in our showroom in Lochau on Lake Constance. Ask us beforehand which pieces are currently on display.",
  },
  fr: {
    title: "{brand} dans notre espace d’exposition à Lochau",
    text: "Nous présentons et planifions {brand} dans notre espace d’exposition à Lochau, au bord du lac de Constance. Demandez-nous à l’avance quelles pièces sont actuellement exposées.",
  },
  it: {
    title: "{brand} nella nostra esposizione a Lochau",
    text: "Presentiamo e progettiamo {brand} nella nostra esposizione a Lochau, sul Lago di Costanza. Chieda pure in anticipo quali pezzi sono attualmente esposti.",
  },
});

const fill = (template, brand) => String(template || "").replaceAll("{brand}", brand);

// Satzweise teilen, ohne HTML-Tags (Showroom-Text wird als Klartext gezeigt).
const toPlain = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const sentences = (text) =>
  toPlain(text)
    .split(/(?<=[.!?])\s+(?=[\p{Lu}«"„“(])/u)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Showroom-Überschrift und -Text einer Markenseite (Ersatz für
 * src/components/MarkenItems/showroomText.js → resolveShowroomText, gleiche Signatur).
 * - Nur der Backoffice-Text der AKTUELLEN Sprache (kein deutscher Satz auf /en).
 * - ClassiCon: Backoffice-Text wie er ist (nur Superlative bereinigt).
 * - Alle anderen: Titel immer neutral; aus der Beschreibung bleiben nur Sätze
 *   ohne Händler-Wort (Muster aus claims.js), Superlative bereinigt.
 * @returns {{ title: string, text: string, source: "cms"|"filtered"|"neutral", removed: string[] }}
 */
export function resolveShowroomText(marke, locale = "de", neutral, brandName) {
  const loc = BRAND_LOCALES.includes(locale) ? locale : "de";
  const brand = brandName || marke?.name1 || "";
  const slug = toBrandSlug(marke?.name1 || brand);
  const fallback = NEUTRAL_SHOWROOM_TEXT[loc];
  const neutralTitle = fill(neutral?.title || fallback.title, brand);
  const neutralText = fill(neutral?.text || fallback.text, brand);
  const clean = (s) => sanitizeClaims(s, slug, { locale: loc, brandName: brand });

  const cmsTitle = toPlain(marke?.[`dealers_title_${loc}`]);
  const cmsText = toPlain(marke?.[`dealers_description_${loc}`]);

  // Inhaber-Entscheidung Nr. 22: Studio-Marken (Minotti) – belegter Wortlaut
  // aus dem Claim-Register, Backoffice-Sätze mit Händler-Wort fallen weg.
  const studio = dealerStudio(slug, loc);
  if (studio) {
    const rest = sentences(cmsText)
      .filter((s) => !hasCountryPromise(s) && !hasDealerClaim(s))
      .map(clean)
      .filter(Boolean)
      .join(" ");
    return {
      title: studio.title || neutralTitle,
      text: [studio.statement, rest].filter(Boolean).join(" ") || neutralText,
      source: "register",
      removed: [],
    };
  }

  if (isVerifiedDealerBrand(slug)) {
    // Händlersatz nur im Wortlaut des Claim-Registers (kein „offiziell … in
    // Vorarlberg“, recht P2-8), Länderversprechen fallen weg (recht P1-1).
    // Nur Sätze mit „offiziell/autorisiert/exklusiv“ werden ersetzt.
    const official = /offiziell|official|officiel|ufficial|autorisiert|authori[sz]ed|autoris[ée]|autorizzat|exklusiv|exclusi|esclusiv/i;
    let replaced = false;
    const text = sentences(cmsText)
      .filter((s) => !hasCountryPromise(s))
      .map((s) => {
        if (!(official.test(s) && hasDealerClaim(s))) return clean(s);
        if (replaced) return "";
        replaced = true;
        return dealerStatement(slug, loc);
      })
      .filter(Boolean)
      .join(" ");
    const title = cmsTitle && !official.test(cmsTitle) ? clean(cmsTitle) : neutralTitle;
    return {
      title: cmsTitle ? title : neutralTitle,
      text: text || neutralText,
      source: cmsTitle || cmsText ? "cms" : "neutral",
      removed: [],
    };
  }

  const parts = sentences(cmsText);
  const removed = parts.filter((s) => hasDealerClaim(s) || hasCountryPromise(s));
  const kept = parts.filter((s) => !hasDealerClaim(s) && !hasCountryPromise(s)).map(clean).filter(Boolean);
  const text = kept.join(" ");
  return {
    title: neutralTitle,
    text: text || neutralText,
    source: text ? (removed.length ? "filtered" : "cms") : "neutral",
    removed,
  };
}

/**
 * Bereinigte Kopie eines Marken-Datensatzes für Props an Client-Komponenten,
 * JSON-LD und Metadaten. Im Server-Code (page.js) aufrufen, BEVOR `marke`
 * weitergegeben wird:
 *
 *   const safeMarke = publicBrand(marke, { locale });
 *   <BrandPage marke={safeMarke} … />
 *
 * - dealers_title_* / dealers_description_* (alle Sprachen) werden entfernt und
 *   für die aktuelle Sprache durch den neutralen bzw. gefilterten Showroom-Text
 *   ersetzt (dealers_title_<locale>, dealers_description_<locale>), damit
 *   bestehende Komponenten ohne Änderung weiterlaufen. Andere Sprachen fehlen.
 * - Alle übrigen Text-Felder laufen durch sanitizeClaims (Händler-Sätze,
 *   Superlative), HTML bleibt erhalten. Namen, Pfade, Zahlen bleiben unverändert.
 * - Verschachtelte Objekte/Arrays (z. B. Bilder) werden rekursiv behandelt.
 * - opts.drop: weitere Feldnamen, die nicht an den Browser sollen.
 * @param {object} marke
 * @param {{locale?: string, neutral?: {title?: string, text?: string}, brandName?: string, drop?: string[]}} [opts]
 */
export function publicBrand(marke, opts = {}) {
  if (!marke || typeof marke !== "object") return marke;
  const loc = BRAND_LOCALES.includes(opts.locale) ? opts.locale : "de";
  const brandName = opts.brandName || marke.name1 || "";
  const slug = toBrandSlug(marke.name1 || brandName);
  const drop = new Set(opts.drop || []);

  const cleanValue = (key, value) => {
    if (typeof value === "string") {
      if (RAW_FIELD_RE.test(key) || !/\s/.test(value)) return value;
      const m = key.match(/_(de|en|fr|it)$/);
      return sanitizeClaims(value, slug, { locale: m ? m[1] : loc, brandName });
    }
    if (Array.isArray(value)) return value.map((v) => cleanValue(key, v));
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (DEALER_FIELD_RE.test(k) || drop.has(k)) continue;
        out[k] = cleanValue(k, v);
      }
      return out;
    }
    return value;
  };

  const out = cleanValue("", marke);
  const showroom = resolveShowroomText(marke, loc, opts.neutral, brandName);
  out[`dealers_title_${loc}`] = showroom.title;
  out[`dealers_description_${loc}`] = showroom.text;
  return out;
}

/** true, wenn irgendwo im (verschachtelten) Objekt ein Händler-Satz einer nicht belegten Marke steckt. */
export function brandRecordHasDealerClaim(marke, brandSlug) {
  const slug = toBrandSlug(brandSlug || marke?.name1 || "");
  if (isVerifiedDealerBrand(slug)) return false;
  const seen = (v) =>
    typeof v === "string"
      ? hasDealerClaim(toPlain(v)) && sanitizeClaims(toPlain(v), slug) !== toPlain(v)
      : Array.isArray(v)
        ? v.some(seen)
        : v && typeof v === "object"
          ? Object.values(v).some(seen)
          : false;
  return seen(marke);
}
