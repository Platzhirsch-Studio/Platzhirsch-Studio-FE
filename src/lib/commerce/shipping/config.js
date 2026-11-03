// src/lib/commerce/shipping/config.js
// Versand-Konfiguration des Accessoire-Shops (Inhaber-Entscheidungen Nr. 29
// und 31.10.2026 „Versand über LetMeShip“):
//   - Versandkosten werden LIVE über LetMeShip berechnet (Standard). Eine
//     Pauschale gilt NUR als Rückfall, wenn die API nicht antwortet UND der
//     Inhaber eine Pauschale eingetragen hat (PAUSCHALE_CENT, heute null).
//     Sonst: klare Meldung + Abholung im Showroom anbieten. Nie schätzen.
//   - Zerbrechlich (Feld der Variante, sonst Kategorie) → versichert
//     (Versicherungswert = Warenwert), K17 31.10.2026 – nicht mehr fest „Riedel“.
//   - Abholung im Showroom: kein LetMeShip-Aufruf.
// ALLE Zahlen mit null sind vom Inhaber zu liefern (qa-screenshots/shop/README.md
// „LetMeShip“). Ohne Paketprofil (Gewicht/Maße) ist ein Artikel nicht
// versandfähig (nur Abholung) – außer im Mock, der eigene, als MOCK markierte
// Testwerte nutzt.
// Rein, ohne "@/"-Importe.
import { kategorieHinweis, paketProfil, pakettypOf, profilNutzbar, versandGesperrtFuer } from "../../shop/paketprofile.js";
import { UST_NORMALSATZ_AT } from "../../shop/ust.js";

export const ABSENDER = Object.freeze({
  firma: "Platzhirsch Home Living",
  strasse: "Landstraße",
  hausnr: "11",
  plz: "6911",
  ort: "Lochau",
  land: "AT",
  email: "info@platzhirsch.studio",
  telefon: "+43 5574 46255",
});

/** Lieferländer. CH: nicht verfügbar, bis USt/Zoll geklärt sind (release.js "ust"). */
export const LAENDER = Object.freeze({
  AT: Object.freeze({ versand: true }),
  DE: Object.freeze({ versand: true }),
  CH: Object.freeze({ versand: false, grund: "ch" }),
});
export const LAND_IDS = Object.freeze(Object.keys(LAENDER));
export const versandLandOk = (land) => LAENDER[land]?.versand === true;

/**
 * Tarif-Quelle: "live" (LetMeShip, Standard laut Inhaber 31.10.2026) oder
 * "pauschale" (nur, wenn der Inhaber das später so entscheidet).
 */
export const VERSAND_QUELLE = "live";
/** Dienstwahl bei mehreren Tarifen: "guenstigster" | "schnellster" (Inhaber offen). */
export const DIENST_WAHL = "guenstigster";
/** Rückfall-Pauschale je Land in Cent (inkl. USt) – null = keine Pauschale (Meldung + Abholung). */
export const PAUSCHALE_CENT = Object.freeze({ AT: null, DE: null });
/** Aufschlag auf den LetMeShip-Tarif in Cent (Verpackung o. Ä.) – Inhaber; 0 = Tarif 1:1. */
export const AUFSCHLAG_CENT = 0;
/**
 * Nur für die Umrechnung eines LetMeShip-NETTOtarifs in den Kunden-
 * Bruttopreis (letmeship.js kundenCent): AT-Normalsatz, damit der Versand-
 * preis für alle Warenkörbe gleich ist. Die im Versand ENTHALTENE USt
 * rechnet src/lib/shop/ust.js (Nebenleistung folgt der Hauptleistung,
 * gemischt anteilig; EuGH C-349/96, UStR 2000 Rz 347) – Steuerberater bestätigt.
 */
export const VERSAND_UST_SATZ = UST_NORMALSATZ_AT;
/** Gültigkeit einer Tarif-Abfrage (Tarif-ID mit Ablaufzeit), danach neu abfragen. */
export const QUOTE_TTL_MS = 15 * 60 * 1000;

/**
 * Paketprofile (K3/K17, 31.10.2026): Tabelle der Pakettypen und Hinweise je
 * Kategorie in src/lib/shop/paketprofile.js (Inhaber füllt
 * qa-screenshots/shop/PAKETPROFILE.md aus). Reihenfolge je Zeile:
 * Varianten-Versanddaten → Pakettyp-Profil → sonst nur Abholung.
 * Pakettyp-Profile sind Schätzungen (geprueft: false) und gelten nur
 * im Testmodus; live erst nach Messung durch den Inhaber (geprueft: true).
 * Gefahrgut (Parfum UN 1266, Akku-Leuchten UN 3481) bleibt nur abholbar.
 * Zerbrechlich aus dem Varianten-Feld, sonst aus der Kategorie; zerbrechliche
 * Sendungen werden versichert (Versicherungswert = Warenwert).
 */
export { PAKETTYPEN, KATEGORIE_HINWEISE } from "../../shop/paketprofile.js";

/**
 * NUR Mock: feste Beispielwerte, damit der Testlauf ein Paket bilden kann.
 * KEINE echten Gewichte/Maße.
 */
export const MOCK_PROFIL = Object.freeze({ gewichtG: 1000, laengeCm: 30, breiteCm: 20, hoeheCm: 15 });

const zahl = (v) => (typeof v === "number" && v > 0 ? v : null);

/**
 * Profil einer Warenkorbzeile { kategorie, name?, varianteName?, varianten?, masse?, inhalt?, zerbrechlich?, versandGewichtG?, versandMasseCm? }.
 * → { gewichtG, laengeCm, breiteCm, hoeheCm, zerbrechlich, versichern, kerze, pakettyp, quelle, geprueft, gesperrt }
 *
 * mode (Shop-Modus): Geschätzte Pakettyp-Profile (geprueft: false) gelten NUR
 * bei mode "test"; ohne Angabe gilt die strenge Live-Regel (nur geprueft: true).
 * Gefahrgut (versandGesperrt) sperrt immer – auch im Test und im Mock.
 */
export function profilOf(item, { mock = false, mode = "live" } = {}) {
  const h = kategorieHinweis(item?.kategorie);
  const pakettyp = pakettypOf(item || {});
  const typProfil = paketProfil(pakettyp);
  const tp = profilNutzbar(typProfil, mode) ? typProfil : null;
  const m = Array.isArray(item?.versandMasseCm) && item.versandMasseCm.length === 3 ? item.versandMasseCm : null;
  const vg = zahl(item?.versandGewichtG);
  const varianteKomplett = Boolean(vg && m && m.every((x) => zahl(x)));
  const p = {
    // Variantengewicht ohne eigene Kartonmaße: + Tara des (geschätzten) Kartons.
    gewichtG: varianteKomplett ? vg : vg && tp ? vg + tp.tareG : vg ?? tp?.gewichtG ?? null,
    laengeCm: zahl(m?.[0]) ?? tp?.laengeCm ?? null,
    breiteCm: zahl(m?.[1]) ?? tp?.breiteCm ?? null,
    hoeheCm: zahl(m?.[2]) ?? tp?.hoeheCm ?? null,
    zerbrechlich: typeof item?.zerbrechlich === "boolean" ? item.zerbrechlich : h.zerbrechlich,
    kerze: h.kerze,
    pakettyp,
    // Gefahrgut immer; Diffuser/Raumspray ohne geprüftes SDB außerhalb des Testmodus (paketprofile.js).
    gesperrt: versandGesperrtFuer(typProfil, mode),
    geprueft: varianteKomplett || Boolean(tp?.geprueft),
  };
  p.quelle = varianteKomplett ? "variante" : tp && profilVollstaendig(p) ? (tp.geprueft ? "pakettyp" : "pakettyp-schaetzung") : null;
  if (mock && !p.gesperrt) for (const [k, v] of Object.entries(MOCK_PROFIL)) p[k] ??= v;
  if (p.gesperrt) {
    p.quelle = null;
    p.gewichtG = p.laengeCm = p.breiteCm = p.hoeheCm = null;
  }
  // K17: Versicherung an „zerbrechlich“ gekoppelt.
  p.versichern = p.zerbrechlich;
  return p;
}
export const profilVollstaendig = (p) => !p.gesperrt && [p.gewichtG, p.laengeCm, p.breiteCm, p.hoeheCm].every((v) => Number(v) > 0);

/**
 * Pakete einer Lieferung: je Warenkorbzeile ein Paket-Eintrag mit Menge
 * (einzeln verpackt). Vereinfachung bis der Inhaber Kartongrößen/Sammel-
 * verpackung festlegt. → { pakete, versichern, zerbrechlich, kerze, fehlend }
 */
export function paketeOf(zeilen, { mock = false, mode = "live" } = {}) {
  const pakete = [];
  const fehlend = [];
  const gesperrt = [];
  let versichern = false;
  let zerbrechlich = false;
  let kerze = false;
  let schaetzung = false;
  for (const z of zeilen) {
    const p = profilOf(z, { mock, mode });
    if (!profilVollstaendig(p)) fehlend.push(p.pakettyp || z.kategorie);
    if (p.gesperrt) gesperrt.push(p.pakettyp);
    schaetzung ||= p.quelle === "pakettyp-schaetzung";
    versichern ||= p.versichern;
    zerbrechlich ||= p.zerbrechlich;
    kerze ||= p.kerze;
    pakete.push({ gewichtG: p.gewichtG, laengeCm: p.laengeCm, breiteCm: p.breiteCm, hoeheCm: p.hoeheCm, menge: z.menge, inhalt: z.name });
  }
  return { pakete, versichern, zerbrechlich, kerze, schaetzung, fehlend: [...new Set(fehlend)], gesperrt: [...new Set(gesperrt)] };
}
