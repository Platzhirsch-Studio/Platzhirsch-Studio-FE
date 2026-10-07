// src/lib/site.js
// The single source of truth for the business facts that appear all over the
// site (header, footer, showroom sections, landing pages, schema). Change a
// value here and every page follows — the phone number alone used to be typed
// out in 12 files, in two different formats.
export const SITE_URL = "https://platzhirsch.studio";
export const SITE_NAME = "Platzhirsch Home Living";

export const PHONE_DISPLAY = "+43 5574 46255";
export const PHONE_HREF = "tel:+43557446255";
export const EMAIL = "info@platzhirsch.studio";
export const EMAIL_HREF = `mailto:${EMAIL}`;

export const ADDRESS = {
  street: "Landstraße 9",
  postalCode: "6911",
  city: "Lochau",
  region: "Vorarlberg",
  country: "Österreich",
  countryCode: "AT",
};

// Google Business Profile pin.
export const GEO = { latitude: 47.5302782, longitude: 9.7517183 };
export const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Platzhirsch+Home+Living,+Landstra%C3%9Fe+9,+6911+Lochau";

export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/platzhirsch.studio/" },
  { name: "Facebook", href: "https://www.facebook.com/platzhirsch.studio/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/platzhirsch-studio" },
];
