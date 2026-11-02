// src/lib/legal/manufacturerText.js
// Zentraler Filter für Hersteller- und Backoffice-Texte (UWG § 2, Design-Bibel
// §1 Stimme, §11, §14). R3-marken-seo hat ihn aus
// src/components/MarkenItems/showroomText.js (und dem Craft-/Lead-Filter aus
// markenitems.js / brandData.js) hierher verschoben; am alten Ort bleibt ein
// Re-Export, weil die Produktseite ihn von dort importiert.
//
// Drei Satzarten fallen weg, satzweise und in DE/EN/FR/IT:
//  1. Händler-/Offiziell-/Autorisiert-Sätze – außer bei Marken, deren
//     Händlerstatus belegt ist (VERIFIED_DEALER_BRANDS in ./claims.js: ClassiCon,
//     Ezarri, Minotti, Bad-&-Wellness-Marken; Inhaber-Entscheidungen Nr. 7/19/21/22).
//  2. Stimme/Superlative: luxus/exklusiv/führend/feinste … (VOICE_PATTERNS)
//     plus die Superlativ-Regeln des Claim-Guards (größte, einzigartig,
//     unique, Nr. 1 …, findClaims in ./claims.js).
//  3. Liefer- und Verfügbarkeitszusagen („Erhältlich bei …“, „Lieferung in
//     ganz Österreich“) – das sagen wir nicht pro Marke (nur
//     sanitizeManufacturerText bzw. cleanProse mit dropDelivery).
//
// Reine Logik: relative Imports, kein "server-only", kein "@/". Läuft in
// Server-Komponenten, node --test (tests/unit/r3-marken-legal.test.mjs) und
// tools/checks.
import { VERIFIED_DEALER_BRANDS, dealerStatement, dealerStudio, findClaims, hasCountryPromise, hasUnprovenClaim, softenCountryPromise, toBrandSlug } from "./claims.js";

export const MANUFACTURER_TEXT_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

// Eine Quelle für belegte Händler: ./claims.js (CLAIM_REGISTER).
export const VERIFIED_DEALER_SLUGS = new Set(VERIFIED_DEALER_BRANDS);

// Händler-/Offiziell-/Autorisiert-Wörter in DE, EN, FR, IT. Bewusst breit:
// ein Fehlalarm kostet nur einen Satz, ein Treffer daneben eine Abmahnung.
const DEALER_PATTERNS = [
  /h(ä|ae)ndler/i, // Händler, Fachhändler, Vertragshändler
  /vertrieb|vertriebspartner|vertragspartner/i,
  /offiziell|autorisiert|zertifiziert|lizenziert/i,
  /\b(official|officially|authori[sz]ed|certified|licensed)\b/i,
  /\b(dealer|dealership|retailer|reseller|stockist|distributor)s?\b/i,
  /officiel|officielle|agr(é|e)(é|e)|autoris(é|e)|revendeur|distributeur|concessionnaire/i,
  /ufficial|autorizzat|rivendit|distribut|concession/i,
  /exklusivpartner|exclusive partner|partenaire exclusif|partner esclusivo/i,
];

// Stimme (Bibel §1, harte Regel „keine Superlative“): Luxus-/Exklusiv-/
// Superlativ-Wörter in DE, EN, FR, IT.
const VOICE_PATTERNS = [
  /luxus|luxur|lussuos|\blusso\b|\bluxe\b/i,
  /exklusiv|exclusi|esclusiv/i,
  /h(ö|oe)chste|feinste|gr(ö|oe)(ß|ss)te|edelste|\bbeste[nmrs]?\b/i,
  /f(ü|ue)hrend|marktf(ü|ue)hrer/i,
  /\b(finest|highest|greatest|leading|world-?class|best-in-class|unrivalled|unparalleled)\b/i,
  /\bleader(s|ship)?\b/i,
  /\bplus (grand|beau|belle|haut|fin|raffin|prestigi)|\bde premier plan\b|\brenomm(é|e)e mondiale\b/i,
  /\bpi(ù|u) (grand|alt|fin|raffinat|prestigios|bell)|\bmassima qualit/i,
];

// Liefer- und Verfügbarkeitszusagen alter Backoffice-Texte (UWG-Audit,
// Katalog-Abnahme A1): wer liefert wohin, wo ist es erhältlich.
const DELIVERY_PATTERNS = [
  /erh(ä|ae)ltlich (bei|im|in)\b/i,
  /\b(lieferung|lieferbar|liefern|geliefert)\b[^.!?]{0,60}\b(in ganz|ganz (österreich|europa|deutschland)|europaweit|weltweit|österreichweit|kostenlos|gratis|innerhalb von)/i,
  /\bversandkostenfrei\b|\bsofort lieferbar\b|\bab lager\b/i,
  /\bavailable (at|from) (platzhirsch|our|us)\b/i,
  /\b(delivery|delivered|ship(ping|ped)?)\b[^.!?]{0,60}\b(throughout|nationwide|worldwide|across (austria|europe|germany)|free of charge|within \d)/i,
  /\bin stock\b|\bfree (delivery|shipping)\b/i,
  /\bdisponibles? (chez|à|a) (platzhirsch|nous|notre)\b/i,
  /\blivr(aison|é|ée|és|ées|ons)\b[^.!?]{0,60}\b(dans toute|partout|gratuit|offerte|sous \d)/i,
  /\ben stock\b/i,
  /\bdisponibil[ei] (da|presso) (platzhirsch|noi|nostro)\b/i,
  /\b(consegna|consegnato|consegnati|spedizione)\b[^.!?]{0,60}\b(in tutta|gratuit|entro \d|ovunque)/i,
  /\bpronta consegna\b|\bdisponibil[ei] a magazzino\b/i,
];

// „offiziell“, „autorisiert“, „exklusiv“ in DE/EN/FR/IT (Händlersätze belegter Marken).
const OFFICIAL_RE = /offiziell|official|officiel|ufficial|autorisiert|authori[sz]ed|autoris[ée]|autorizzat|exklusiv|exclusi|esclusiv/i;

const test = (patterns, text) => Boolean(text) && typeof text === "string" && patterns.some((re) => re.test(text));

/** true, wenn der Text eine Händler-/Offiziell-/Autorisiert-Formulierung enthält (breit, ohne Kontext). */
export const hasDealerWording = (text) => test(DEALER_PATTERNS, text);

/** true, wenn der Text Luxus-/Exklusiv-Wörter oder einen Superlativ (auch nach ./claims.js) enthält. */
export function hasVoiceViolation(text) {
  if (!text || typeof text !== "string") return false;
  if (test(VOICE_PATTERNS, text)) return true;
  return findClaims(text).some((f) => f.type === "superlative");
}

/** true, wenn der Text eine Liefer- oder Verfügbarkeitszusage macht. */
export const hasDeliveryClaim = (text) => test(DELIVERY_PATTERNS, text);

// Runde 2 (recht P1-1/P1-2): unbelegte Werbeaussagen (perfekt*, Perfektion,
// Exzellenz, ausschließlich, weltweit) und pauschale Länderversprechen („in ganz
// Österreich“ ohne „auf Wunsch“) – Muster in ./claims.js. Gilt für jede
// Herstellerprosa (story, craft, approach, Intro, Produkttexte), immer.
export const hasManufacturerClaim = (text) => hasUnprovenClaim(text) || hasCountryPromise(text);

/** true, wenn diese Marke eine Händler-Formulierung tragen darf (VERIFIED_DEALER_BRANDS). */
export function isVerifiedDealer(brandName) {
  return VERIFIED_DEALER_SLUGS.has(toBrandSlug(brandName));
}

// Sätze eines Backoffice-Texts („… Vorarlberg. In unserer …“ → 2 Sätze).
export const sentences = (text) =>
  String(text || "")
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜÀ-Ý«"„“])/u)
    .map((s) => s.trim())
    .filter(Boolean);

// Die Firma heißt „Platzhirsch Home Living“ (Bibel §1); ältere Texte sagen
// noch „Platzhirsch Studio“.
export const normalizeCompanyName = (text) =>
  String(text || "").replace(/Platzhirsch[\s-]+Studio\b/g, "Platzhirsch Home Living");

/**
 * Backoffice-Prosa für die Anzeige: nur Sätze ohne Stimm-Verstoß, ohne
 * Händler-Wort (außer allowDealer) und – mit dropDelivery – ohne Liefer-/
 * Verfügbarkeitszusage.
 * @param {string} text
 * @param {{allowDealer?: boolean, dropDelivery?: boolean}} [opts]
 * @returns {string} "" wenn nichts übrig bleibt
 */
export function cleanProse(text, { allowDealer = false, dropDelivery = false } = {}) {
  return sentences(normalizeCompanyName(text))
    .filter(
      (s) =>
        !hasVoiceViolation(s) &&
        !hasManufacturerClaim(s) &&
        (allowDealer || !hasDealerWording(s)) &&
        (!dropDelivery || !hasDeliveryClaim(s))
    )
    .join(" ");
}

/**
 * Der Filter für Herstellertexte (Markenseite, Produktseite, Kollektion):
 * Superlative, Händler- und Liefersätze fallen satzweise weg; ClassiCon behält
 * seine belegten Händlersätze.
 * @param {string} text Klartext (HTML vorher entfernen)
 * @param {{brand?: string}} [opts] brand = Markenname oder Slug
 * @returns {string}
 */
export function sanitizeManufacturerText(text, { brand } = {}) {
  return cleanProse(text, { allowDealer: isVerifiedDealer(brand), dropDelivery: true });
}

/** Satzweise Ergebnis mit Grund – für Prüfskripte und Berichte. */
export function auditManufacturerText(text, { brand } = {}) {
  const allowDealer = isVerifiedDealer(brand);
  return sentences(normalizeCompanyName(text)).map((s) => {
    const reasons = [
      hasVoiceViolation(s) && "voice",
      !allowDealer && hasDealerWording(s) && "dealer",
      hasDeliveryClaim(s) && "delivery",
      hasManufacturerClaim(s) && "claim",
    ].filter(Boolean);
    return { sentence: s, keep: reasons.length === 0, reasons };
  });
}

/**
 * Prosa, die einen Textblock eröffnet: "" wenn schon der ERSTE Satz weg muss
 * (der Rest finge mitten im Gedanken an: „Erhältlich bei …“).
 */
export function leadProse(raw, { allowDealer = false, dropDelivery = false } = {}) {
  const first = sentences(raw)[0] || "";
  if (!first || hasVoiceViolation(first) || hasManufacturerClaim(first) || (!allowDealer && hasDealerWording(first))) return "";
  if (dropDelivery && hasDeliveryClaim(first)) return "";
  return cleanProse(raw, { allowDealer, dropDelivery });
}

/**
 * Quelle eines Handwerk-Eintrags (Backoffice-Feld source/quelle bzw. die
 * Freigabe approved). Ohne Quelle bleibt der Abschnitt aus (Inhaber-offen
 * Nr. 28: Nutzungserlaubnis bzw. eigene Texte fehlen noch).
 */
export const craftSource = (c) => String(c?.source || c?.quelle || c?.source_url || "").trim() || (c?.approved === true || c?.approved === 1 ? "approved" : "");

/**
 * Handwerk-Einträge ({ title, eyeline, text }) der Markenseite: nur mit Quelle
 * (requireSource, Standard); Titel/Zeile mit Stimm-Verstoß oder unbelegter
 * Werbeaussage fallen ganz weg, der Text wird bereinigt, leere entfallen.
 */
export function cleanCraftEntries(entries, { allowDealer = false, requireSource = true } = {}) {
  return (entries || [])
    .filter((c) => !requireSource || craftSource(c))
    .filter((c) => !hasVoiceViolation(c?.title) && !hasVoiceViolation(c?.eyeline))
    .filter((c) => !hasManufacturerClaim(c?.title) && !hasManufacturerClaim(c?.eyeline))
    .map((c) => ({ ...c, text: cleanProse(c.text, { allowDealer }) }))
    .filter((c) => c.text);
}

// Neutrale Texte (Wortlaut wie marken.showroomNeutralTitle/-Text in
// messages-marken.json); Aufrufer können die übersetzten Vorlagen übergeben.
export const NEUTRAL_TEXT = {
  de: {
    title: "{brand} in unserer Ausstellung in Lochau",
    text: "Wir zeigen und planen {brand} in unserer Ausstellung in Lochau am Bodensee.",
  },
  en: {
    title: "{brand} in our showroom in Lochau",
    text: "We show and plan {brand} in our showroom in Lochau on Lake Constance.",
  },
  fr: {
    title: "{brand} dans notre espace d’exposition à Lochau",
    text: "Nous présentons et planifions {brand} dans notre espace d’exposition à Lochau, au bord du lac de Constance.",
  },
  it: {
    title: "{brand} nella nostra esposizione a Lochau",
    text: "Presentiamo e progettiamo {brand} nella nostra esposizione a Lochau, sul Lago di Costanza.",
  },
};

const fill = (template, brand) => String(template || "").replaceAll("{brand}", brand);

/**
 * Showroom-Überschrift und -Text einer Markenseite (Backoffice-Felder
 * dealers_title_<l> / dealers_description_<l>).
 * - Nur der Text der AKTUELLEN Sprache (kein deutscher Text auf /en).
 * - Belegte Marke (ClassiCon): Backoffice-Text, Stimm-Verstöße entfernt.
 * - Alle anderen: Titel immer neutral; aus der Beschreibung bleiben nur Sätze
 *   ohne Händler-Wort und ohne Stimm-Verstoß, sonst der neutrale Text.
 * @returns {{ title: string, text: string, source: "cms" | "filtered" | "neutral", removed: string[] }}
 */
export function resolveShowroomText(marke, locale = "de", neutral, brandName) {
  const brand = brandName || marke?.name1 || "";
  const fallback = NEUTRAL_TEXT[locale] || NEUTRAL_TEXT.de;
  const neutralTitle = fill(neutral?.title || fallback.title, brand);
  const neutralText = fill(neutral?.text || fallback.text, brand);

  const cmsTitle = String(marke?.[`dealers_title_${locale}`] || "").trim();
  const cmsText = String(marke?.[`dealers_description_${locale}`] || "").trim();

  // Inhaber-Entscheidung Nr. 22: Studio-Marken (Minotti) bekommen den belegten
  // Wortlaut aus dem Claim-Register (Titel + Satz nah an der Minotti-Pressemeldung).
  // Backoffice-Sätze mit Händler-Wort („Ihr offizieller Minotti Händler in
  // Vorarlberg“) fallen weg, die übrigen Sätze bleiben (bereinigt).
  const studio = dealerStudio(marke?.name1 || brand, locale);
  if (studio) {
    const rest = cleanProse(softenCountryPromise(cmsText), { allowDealer: false });
    return {
      title: studio.title || neutralTitle,
      text: [studio.statement, rest].filter(Boolean).join(" ") || neutralText,
      source: "register",
      removed: [],
      evidenceUrl: studio.showEvidenceLink ? studio.evidenceUrl : null,
    };
  }

  if (isVerifiedDealer(marke?.name1 || brand)) {
    // Händlersätze mit „offiziell/autorisiert/exklusiv“ („Ihr offizieller
    // ClassiCon Händler in Vorarlberg“ klingt nach Gebietsexklusivität, recht
    // P2-8) werden durch den Satz aus dem Claim-Register ersetzt; schlichte
    // Händlersätze bleiben. Länderversprechen fallen weg (cleanProse).
    const statement = dealerStatement(marke?.name1 || brand, locale);
    let replaced = false;
    const parts = sentences(softenCountryPromise(normalizeCompanyName(cmsText))).map((s) => {
      if (!OFFICIAL_RE.test(s) || !hasDealerWording(s)) return s;
      if (replaced) return "";
      replaced = true;
      return statement;
    });
    const verifiedText = cleanProse(parts.filter(Boolean).join(" "), { allowDealer: true }) || (replaced ? statement : "");
    const verifiedTitle =
      hasVoiceViolation(cmsTitle) || hasManufacturerClaim(cmsTitle) || OFFICIAL_RE.test(cmsTitle) ? "" : normalizeCompanyName(cmsTitle);
    return {
      title: verifiedTitle || neutralTitle,
      text: verifiedText || neutralText,
      source: verifiedTitle || verifiedText ? "cms" : "neutral",
      removed: [],
    };
  }

  // R8 (recht P0-2, Entscheidung Nr. 3): „Lieferung und Montage in ganz
  // Österreich“ → „… auf Wunsch“; ein Satz, der danach noch ein Länder- oder
  // Weltversprechen trägt, fällt weg.
  const parts = sentences(softenCountryPromise(normalizeCompanyName(cmsText)));
  const bad = (s) => hasDealerWording(s) || hasVoiceViolation(s) || hasManufacturerClaim(s);
  const kept = parts.filter((s) => !bad(s));
  const removed = parts.filter(bad);
  const text = kept.join(" ");

  return {
    title: neutralTitle,
    text: text || neutralText,
    source: text ? (removed.length ? "filtered" : "cms") : "neutral",
    removed,
  };
}
