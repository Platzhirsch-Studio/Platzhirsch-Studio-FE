// src/lib/seo/aboutFacts.js
// Data of the facts block "Auf einen Blick" (GEO W2, SEO-Team A, 31.10.2026)
// and the about FAQ – built only from existing sources, nothing re-typed:
//   - name, legal name, address, phone, e-mail, showroom hours → src/lib/site.js
//   - café name, phone, hours → CAFE_PROFILE (src/lib/seo/siteSchema.js;
//     own café number +43 5574 46257, Tue–Sun 9–24, NOT the showroom's)
//   - advisory languages → contactPoint.availableLanguage of the Organization
//   - dealer sentences → dealerStatementList (Claim-Guard, src/lib/legal/claims.js)
//   - Minotti Studio → dealerStudio("minotti") incl. press-release URL
// No founding year (not documented: Impressum/Firmenbuch FN 443753 d give
// none), no showroom area (the 400 m² of the press release are as of 2019).
//
// Pure module (relative imports only), so node --test can load it.
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME, openingDaysLabel, openingHoursLine, weekdayName } from "../site.js";
import { dealerStatementList, dealerStudio, isVerifiedDealerBrand } from "../legal/claims.js";
import { CAFE_PROFILE, organizationNode } from "./siteSchema.js";

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Dealer brands grouped by field (slugs as in CLAIM_REGISTER). The Claim-Guard
// drops any slug that is not verified, so this list can never add a claim.
export const DEALER_GROUPS = Object.freeze([
  { key: "groupFurniture", slugs: ["classicon", "flos", "tom-dixon"] },
  { key: "groupPool", slugs: ["ezarri"] },
  { key: "groupBath", slugs: ["dornbracht", "antoniolupi", "starpool", "soleum", "fabio-alemanno", "aquavia-spa", "naggura"] },
  { key: "groupKitchen", slugs: ["gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker"] },
  { key: "groupAccessories", slugs: ["baobab-collection", "riedel", "cire-trudon", "zalto", "assouline", "kahler", "lyngby-porcelaen"] },
]);

/** [{ key, text }] – one Claim-Guard sentence per group, empty groups left out. */
export function dealerGroups(locale) {
  return DEALER_GROUPS.map((g) => ({ key: g.key, text: dealerStatementList(g.slugs.filter(isVerifiedDealerBrand), locale) })).filter(
    (g) => g.text
  );
}

const dayIndex = (name) => SCHEMA_DAYS.indexOf(name);

/** "Di.–So. 09:00–24:00" from CAFE_PROFILE.openingHours (one continuous range). */
export function cafeHoursLine(locale) {
  const { days, opens, closes } = CAFE_PROFILE.openingHours;
  const first = dayIndex(days[0]);
  const last = dayIndex(days[days.length - 1]);
  return `${openingDaysLabel(locale, { days: [first, last] }, "short").replace(" – ", "–")} ${opens}–${closes}`;
}

/** Long names of the café's closed days ("Montag"). */
export function cafeClosedDays(locale) {
  const open = new Set(CAFE_PROFILE.openingHours.days);
  return SCHEMA_DAYS.map((d, i) => (open.has(d) ? null : weekdayName(locale, i, "long"))).filter(Boolean).join(", ");
}

/** Advisory languages from the Organization's contactPoint, named in the locale. */
export function advisoryLanguages(locale) {
  const CODES = { German: "de", English: "en", Italian: "it", French: "fr" };
  const names = (organizationNode().contactPoint?.availableLanguage || []).map((n) => CODES[n]).filter(Boolean);
  let display;
  try {
    display = new Intl.DisplayNames([locale], { type: "language" });
  } catch {
    display = null;
  }
  const list = names.map((c) => (display ? display.of(c) : c));
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(list);
  } catch {
    return list.join(", ");
  }
}

/** Country of the address in the page language ("Österreich", "Austria", "Autriche"). */
export function countryName(locale) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(ADDRESS.countryCode) || ADDRESS.country;
  } catch {
    return ADDRESS.country;
  }
}

/** Placeholder values of the facts block and the about FAQ. */
export function aboutVars(locale) {
  return {
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    address: `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.region}, ${countryName(locale)}`,
    hours: openingHoursLine(locale),
    cafe: CAFE_PROFILE.name,
    cafeHours: cafeHoursLine(locale),
    cafePhone: CAFE_PROFILE.telephone,
    phone: CAFE_PROFILE.telephone,
    closed: cafeClosedDays(locale),
  };
}

/** Minotti Studio line: belegter Studio-Satz + press-release link (or null). */
export function minottiFact(locale) {
  const studio = dealerStudio("minotti", locale);
  return studio ? { statement: studio.statement, evidenceUrl: studio.showEvidenceLink ? studio.evidenceUrl : null } : null;
}

export const CONTACT = Object.freeze({ phone: PHONE_DISPLAY, email: EMAIL });
