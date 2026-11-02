// Company facts for the legal draft previews.
// Address, phone, e-mail and social profiles come ONLY from src/lib/site.js
// (single source, Landstraße 11 per Firmenbuch, 00-rechtspaket W1).
// The register data below is not in site.js yet: it is taken word for word
// from the Impressum draft (Marktresearch/recht/04, Variante A) and belongs in
// src/lib/legal/company.js once that file exists (owner: R3-marken-seo; see
// 04 Abschn. 5 "Technische Umsetzung"). Nothing here is invented.
import { ADDRESS, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SITE_NAME, SITE_URL, SOCIAL } from "@/lib/site";

export { ADDRESS, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SITE_NAME, SITE_URL, SOCIAL };

export const STREET_LINE = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`;
export const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

// From 04-impressum-pflichtangaben.md, Variante A (MW GmbH, heute).
export const REGISTER = {
  legalName: "MW Immobilienverwaltungs GmbH",
  legalForm: "Gesellschaft mit beschränkter Haftung",
  seat: "Lochau",
  fn: "FN 443753 d",
  court: "Landesgericht Feldkirch",
  uid: "ATU70035339",
  managers: "Susanne Messmer, Andreas Wegscheider",
  authority: "Bezirkshauptmannschaft Bregenz",
};

/** Handle of a social profile from site.js, e.g. "Instagram (instagram.com/platzhirsch.studio)". */
export const SOCIAL_LINE = SOCIAL.map((s) => `${s.name} (${s.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")})`).join(", ");
