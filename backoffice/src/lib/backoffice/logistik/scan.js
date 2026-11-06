// Code-Erkennung am Packtisch und im Lager (10-konzept-logistik § 6.1, 33-referenz-jtl M1).
// Baut auf lib/backoffice/codes.js (Formate der Frappe-Apps) und ordnet logistisch ein:
// Lieferschein → Pack-Ansicht/Abholkarte · Bestellung → Lieferschein öffnen/erzeugen · Abholcode → Abholkarte ·
// Wareneingang · Bestand-QR · Platz-QR · Kommissions-Etikett (KOM:) · Artikel (EAN/SN/Website-Link). Reines Modul.

import { erkenneCode } from "../codes.js";

const ZIELE = {
  "PH Lieferschein": "lieferschein",
  "PH Bestellung": "bestellung",
  "PH Auftragsbestaetigung": "auftrag",
  "PH Wareneingang": "wareneingang",
  "PH Lagerbestand": "bestand",
  "PH Inventur": "inventur",
  "PH Tour": "tour",
  "PH Sendung": "sendung",
};

/**
 * @param {string} text
 * @param {{abholcode?:boolean}} [opts]
 * @returns {{art:"lieferschein"|"bestellung"|"auftrag"|"wareneingang"|"bestand"|"inventur"|"tour"|"sendung"|"abholcode"|"platz"|"kommission"|"artikel"|"seriennummer"|"unbekannt", wert:string, lagerort?:string, platz?:string|null, slug?:string, doctype?:string}}
 */
export function erkenneLogistikCode(text, opts = { abholcode: true }) {
  const t = String(text ?? "").trim();
  if (!t) return { art: "unbekannt", wert: "" };
  const kom = /^KOM:\s*(.+)$/i.exec(t);
  if (kom) return { art: "kommission", wert: kom[1].trim() };
  // Abholcodes sind 6 Zeichen ohne Bindestrich – „SN-0441“ bleibt eine Seriennummer.
  const c = erkenneCode(t, { ...opts, abholcode: !!opts.abholcode && t.length === 6 });
  if (c.art === "beleg" && ZIELE[c.doctype]) return { art: ZIELE[c.doctype], wert: c.name, doctype: c.doctype };
  if (c.art === "abholcode") return { art: "abholcode", wert: c.wert };
  if (c.art === "lageretikett") return { art: "platz", wert: t, lagerort: c.lagerort, platz: c.platz };
  if (c.art === "ean" || /^\d{8,14}$/.test(t)) return { art: "artikel", wert: t };
  if (c.art === "url") return { art: "artikel", wert: c.slug || t, slug: c.slug };
  // Seriennummern und freie Artikelcodes: alles mit Ziffern und ohne Leerzeichen
  if (/^[A-Z0-9][A-Z0-9-]{3,}$/i.test(t) && /\d/.test(t)) return { art: "seriennummer", wert: t };
  return { art: "unbekannt", wert: t };
}

/** Ziel-URL am Packtisch für einen erkannten Code (oder null). */
export function packtischZiel(code) {
  switch (code.art) {
    case "lieferschein":
      return `/packtisch/${encodeURIComponent(code.wert)}`;
    case "wareneingang":
      return `/d/ph-wareneingang/${encodeURIComponent(code.wert)}`;
    default:
      return null;
  }
}
