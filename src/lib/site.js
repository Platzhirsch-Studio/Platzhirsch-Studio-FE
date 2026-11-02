// src/lib/site.js
// The single source of truth for the business facts that appear all over the
// site (header, footer, showroom sections, landing pages, schema). Change a
// value here and every page follows — the phone number alone used to be typed
// out in 12 files, in two different formats.
export const SITE_URL = "https://platzhirsch.studio";
export const SITE_NAME = "Platzhirsch Home Living";
// Registered company behind the brand (Firmenbuch FN 443753 d, Impressum
// draft Marktresearch/recht/04 Variante A; same wording as the Datenschutz
// contact block). Changes when the Handels-GmbH is registered (Rechtspaket W14).
export const LEGAL_NAME = "MW Immobilienverwaltungs GmbH";

export const PHONE_DISPLAY = "+43 5574 46255";
export const PHONE_HREF = "tel:+43557446255";
export const EMAIL = "info@platzhirsch.studio";
export const EMAIL_HREF = `mailto:${EMAIL}`;

export const ADDRESS = {
  street: "Landstraße 11",
  postalCode: "6911",
  city: "Lochau",
  region: "Vorarlberg",
  country: "Österreich",
  countryCode: "AT",
};

// Google Business Profile pin.
export const GEO = { latitude: 47.5302782, longitude: 9.7517183 };
export const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Platzhirsch+Home+Living,+Landstra%C3%9Fe+11,+6911+Lochau";

// Google Business Profile (Masterplan AP2 Nr. 1: GBP.reviewUrl). `mapsUrl` is
// the profile's cid link (same value as `hasMap` in the LocalBusiness schema).
// `reviewUrl` is the target of /de/bewerten and the QR card. Until the
// Place-ID is known (owner: Place-ID-Finder), it opens the profile; then set
// it to https://search.google.com/local/writereview?placeid=<PLACE_ID>.
export const GBP = {
  cid: "10377983053407187294",
  mapsUrl: "https://maps.google.com/?cid=10377983053407187294",
  reviewUrl: "https://maps.google.com/?cid=10377983053407187294",
};

// Service area of the LocalBusiness schema (`areaServed`). Region and
// countries as before (delivery/assembly "auf Anfrage", owner decision 3);
// cities = the indexed region pages (src/lib/content/landingPages.js). City
// Wikidata links are left out until the IDs are checked (09-local-seo F5).
export const AREA_SERVED = {
  regions: ["Vorarlberg"],
  countries: ["Österreich", "Deutschland", "Schweiz", "Liechtenstein"],
  cities: ["Bregenz", "Dornbirn", "Lindau", "Friedrichshafen", "St. Gallen"],
};

// Only profiles that exist (checked in Marktresearch/01-bestandsanalyse and
// linked from the footer). They feed the footer and `sameAs` of the site
// JSON-LD; never add a planned account here before it is live.
export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/platzhirsch.studio/" },
  { name: "Facebook", href: "https://www.facebook.com/platzhirsch.studio/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/platzhirsch-studio" },
];

// Opening hours of showroom and café – the ONE source (Design-Bibel §9
// OpeningLine). Footer, mobile menu, Kontakt page (Kontakt/copy.js) and the
// openingHoursSpecification of the site JSON-LD (siteSchema() in
// src/lib/seo/siteSchema.js, rendered by [locale]/layout.js) read it.
// Weekdays: 0 = Sunday … 6 = Saturday. `days: [a, b]` with `from`/`to` is the
// range a–b; a closed row lists its single days.
export const OPENING_HOURS = [
  { days: [2, 5], from: "10:00", to: "18:00" },
  { days: [6], from: "10:00", to: "14:00" },
  { days: [0, 1], closed: true },
];

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekdays covered by one OPENING_HOURS row (a range for open rows). */
export function openingDays(row) {
  if (row.closed || row.days.length !== 2) return [...row.days];
  const [from, to] = row.days;
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** schema.org openingHoursSpecification built from OPENING_HOURS (open rows only). */
export function openingHoursSpecification() {
  return OPENING_HOURS.filter((row) => !row.closed).map((row) => {
    const days = openingDays(row).map((d) => SCHEMA_DAYS[d]);
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days.length === 1 ? days[0] : days,
      opens: row.from,
      closes: row.to,
    };
  });
}

/** Localised weekday name; `style` "long" (Dienstag) or "short" (Di.). */
export function weekdayName(locale, day, style = "long") {
  // 7 Jan 2024 was a Sunday.
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + day)));
}

/** Label of a row's days: "Dienstag – Freitag" for a range, else a list. */
export function openingDaysLabel(locale, row, style = "long") {
  if (!row.closed && row.days.length === 2) {
    return `${weekdayName(locale, row.days[0], style)} – ${weekdayName(locale, row.days[1], style)}`;
  }
  return row.days.map((d) => weekdayName(locale, d, style)).join(", ");
}

/** One compact line of the open rows, e.g. "Di.–Fr. 10:00–18:00 · Sa. 10:00–14:00". */
export function openingHoursLine(locale) {
  return OPENING_HOURS.filter((row) => !row.closed)
    .map((row) => `${openingDaysLabel(locale, row, "short").replace(" – ", "–")} ${row.from}–${row.to}`)
    .join(" · ");
}
