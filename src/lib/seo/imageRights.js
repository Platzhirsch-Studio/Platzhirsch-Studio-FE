// src/lib/seo/imageRights.js – Urheber-Register der EIGENEN Fotos (Bilder-SEO,
// Auftrag des Inhabers vom 31.10.2026, Bericht qa-screenshots/bilder-seo/bericht.md).
//
// Zweck: Google kann für eigene Fotos „Bildnachweis/Credit: Platzhirsch Home
// Living“ zeigen. Quellen dafür: ImageObject-JSON-LD auf der Seite, auf der das
// Bild erscheint (imageObjectSchema/ownImageSchemas), und XMP in der Bilddatei
// (tools/images/embed-rights.mjs). Das Register entscheidet beides.
//
// Regeln (bewusste Inhaber-Entscheidung):
//   - NUR eigene Fotos (Showroom, Café, Team, Haralds Skizzen/Modelle,
//     Projekte) mit dokumentierter Freigabe in Marktresearch/recht/bildrechte.csv
//     bzw. aus dem Arbeitsweise-Import (media.js, Einwilligung im Bildregister).
//   - Herstellerbilder bekommen NIE eine Platzhirsch-Urheberangabe (Rechte,
//     Irreführung) – sie bleiben „Bild: <Marke>“. isManufacturerImage() sperrt
//     sie; registerErrors() und der Test bilder-seo.test.mjs prüfen das.
//   - Fotograf/Urheber nur, wenn belegt. Sonst leer, Rechteinhaber
//     „Platzhirsch Home Living“ (Nutzungsrecht). Nichts erfinden.
//   - Ein Copyright-Vermerk, der schon in der Datei steht (EXIF 0x8298 /
//     IPTC 2:116), wird NICHT überschrieben oder entfernt (§ 90c UrhG AT,
//     § 95c UrhG DE: Schutz von Rechte-Informationen). Er wird wörtlich in
//     `dateiVermerk` geführt und als copyrightNotice übernommen.
//   - Teamfotos/Beratungsbilder mit offener Freigabe (bildrechte.csv
//     „offen“) stehen hier NICHT.
//   - © Platzhirsch (Inhaber-Entscheidung Nr. 31, 31.10.2026): sichtbares
//     Zeichen „© PLATZHIRSCH“, copyrightHolder und XMP-Rechteinhaber
//     „Platzhirsch Home Living“ NUR, wenn `exklusiveRechteBestaetigt === true`
//     (exklusive, uneingeschränkte Nutzungsrechte inkl. Bearbeitung vom
//     Fotografen vertraglich bestätigt – das „Häkchen“). Standard false.
//     Fotograf (`fotograf`) und sein Datei-Vermerk bleiben in jedem Fall
//     erhalten (§ 90c UrhG); sichtbare Nennung je nach Vertrag
//     (`fotografSichtbarNennen`: true/false, null = laut Vertrag offen).
//   - Lizenzseite (license/acquireLicensePage) nur, wenn es die Seite gibt.
//     Heute gibt es keine Seite „Bildrechte“ → LICENSE_PAGE = null
//     (Vorschlag im Bericht, Text muss der Inhaber freigeben).
//   - Alt-Texte bleiben beschreibend; der Name „Platzhirsch Home Living“
//     gehört in creditText, nicht in jeden Alt-Text.
//
// Neues eigenes Foto: Rechte in bildrechte.csv dokumentieren, dann hier einen
// Eintrag ergänzen (Haralds Material kommt automatisch über media.js, sobald
// der Import-Slot `rechteinhaber`/`urheber` trägt – tools/arbeitsweise/import.mjs).
//
// Rein, nur relative Importe (node --test, tools/images/*.mjs).
import { MEDIA, KETTE } from "../arbeitsweise/media.js";

export const SITE_URL = "https://platzhirsch.studio";
export const RIGHTS_HOLDER = "Platzhirsch Home Living";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Seite mit Nutzungs-/Lizenzbedingungen für Bilder (license / acquireLicensePage).
 * null, solange es keine solche Seite gibt – NICHT auf /impressum zeigen lassen,
 * das Impressum enthält keine Bildlizenz-Angaben.
 * @type {string|null}
 */
export const LICENSE_PAGE = null;

/**
 * Herstellerbilder und fremde Quellen: niemals im Register.
 * Wellness/Küche (Händler-Freigaben, „Bild: <Marke>“), Katalogbilder
 * (public/Images/Wellness/produkte/<marke>/…), Backoffice-Bilder (/cmx, /cms),
 * Yacht-Referenz Minotti/Custom Line, Markenfotos im Slider, Labs-Texturen.
 */
export const MANUFACTURER_PATTERNS = Object.freeze([
  /^\/Images\/Wellness\//i,
  /^\/Images\/Kueche\//i,
  /^\/Images\/Home\/slider\//i,
  /^\/cmx\//i,
  /^\/cms\//i,
  /^\/labs\//i,
  /^https?:\/\//i,
  /minotti|poliform|rimadesio|flos|classicon|paola-lenti|tuuci|custom-?line|navetta|agape|dornbracht|antoniolupi|starpool|soleum|aquavia|naggura|gaggenau|miele|v-zug|bora|liebherr|quooker|baobab|riedel|trudon|ezarri|binni/i,
]);

export const isManufacturerImage = (src) => MANUFACTURER_PATTERNS.some((re) => re.test(String(src || "")));

/**
 * @typedef {{
 *   datei: string,            Pfad unter public/ (wie im <img src>)
 *   motiv: string,            sachliche Beschreibung (intern)
 *   kategorie: "showroom"|"cafe"|"team"|"skizze"|"modell"|"projekt"|"rendering"|"foto",
 *   urheber: string,          Urheber (natürliche Person, § 74 UrhG) – NUR wenn belegt, sonst ""
 *   fotograf: string|null,    Fotograf/Fotostudio laut Datei/Vertrag, sonst null
 *   exklusiveRechteBestaetigt: boolean, exklusive, uneingeschränkte Nutzungsrechte inkl.
 *                             Bearbeitung vertraglich bestätigt (Nr. 31)? Standard false
 *   fotografSichtbarNennen: boolean|null, sichtbare Fotografennennung laut Vertrag (null = offen)
 *   rechteinhaber: string,    wer die Nutzungsrechte hält
 *   creditText: string,       Bildnachweis, den Google zeigen darf
 *   dateiVermerk?: string,    Copyright-Vermerk, der schon in der Datei steht (wörtlich, wird nicht entfernt)
 *   beleg: string,            wo die Freigabe dokumentiert ist
 *   umfang: string,           Nutzungsumfang laut Freigabe
 *   bearbeitung: boolean,     Bearbeitung (Wasserzeichen, Zuschnitt) von der Freigabe gedeckt?
 *   lizenzSeite: string|null, Pfad einer existierenden Lizenzseite, sonst null
 *   stand: string,            Datum der Prüfung YYYY-MM-DD
 * }} RightsEntry
 */

/** @type {ReadonlyArray<RightsEntry>} */
export const STATIC_IMAGE_RIGHTS = Object.freeze([
  Object.freeze({
    datei: "/Images/Home/aboutHome.jpg",
    motiv: "Showroom Lochau: Wohnbereich mit Sofas, Sesseln und Kamin",
    kategorie: "showroom",
    // bildrechte.csv: „Name des Fotografen offen (§ 74 UrhG prüfen)“ → leer.
    urheber: "",
    // Fotostudio laut EXIF Copyright (0x8298) und IPTC 2:116 der Datei.
    fotograf: "Heidegger Fotografie",
    // Nr. 31: „©“ und Rechteinhaber Platzhirsch erst, wenn der Inhaber die
    // exklusiven Rechte inkl. Bearbeitung vom Fotografen bestätigt hat.
    exklusiveRechteBestaetigt: false,
    // Sichtbare Nennung „Foto: Heidegger Fotografie“ laut Vertrag offen.
    fotografSichtbarNennen: null,
    rechteinhaber: RIGHTS_HOLDER,
    creditText: RIGHTS_HOLDER,
    // In der Datei selbst (EXIF Copyright 0x8298 und IPTC 2:116, gelesen am
    // 31.10.2026): Vermerk des Fotostudios. Bleibt unverändert; Klärung mit
    // dem Inhaber, ob „Foto: Heidegger Fotografie“ genannt werden muss.
    dateiVermerk: "Heidegger Fotografie  6900 Bregenz/Austria",
    beleg: "Mail an den Inhaber 28.10.2026 (Inhaber-Entscheidung Nr. 11), Marktresearch/recht/bildrechte.csv",
    umfang: "Web laut Mail; Zuschnitte, Ads, Feed, KI offen",
    // Bearbeitung (Wasserzeichen, Zuschnitt) laut Register NICHT geklärt.
    bearbeitung: false,
    lizenzSeite: LICENSE_PAGE,
    stand: "2026-10-31",
  }),
]);

const KAT_BY_TYP = { skizze: "skizze", modell: "modell", rendering: "rendering", foto: "foto", screenshot: "projekt" };

/**
 * Einträge aus dem Arbeitsweise-Import (media.js). Nur Slots mit
 * `rechteinhaber` (Pflicht im Schritt „Rechte eintragen“ von
 * tools/arbeitsweise/import.mjs) – ältere Slots ohne diese Angabe bleiben
 * draußen, bis sie nachgetragen sind. Probelauf-Objekte nie.
 */
export function arbeitsweiseRights(media = MEDIA, kette = KETTE) {
  const slots = [...Object.values(media || {}), ...Object.entries(kette || {}).filter(([k]) => k !== "fakten").map(([, v]) => v)];
  const out = [];
  for (const s of slots) {
    if (!s?.src || s.probelauf === true || typeof s.rechteinhaber !== "string" || !s.rechteinhaber.trim()) continue;
    for (const src of [s.src, s.srcMobile].filter(Boolean)) {
      out.push(
        Object.freeze({
          datei: src,
          motiv: s.alt,
          kategorie: KAT_BY_TYP[s.typ] || "foto",
          urheber: typeof s.urheber === "string" ? s.urheber.trim() : "",
          fotograf: typeof s.fotograf === "string" && s.fotograf.trim() ? s.fotograf.trim() : null,
          exklusiveRechteBestaetigt: s.exklusiveRechteBestaetigt === true,
          fotografSichtbarNennen: typeof s.fotografSichtbarNennen === "boolean" ? s.fotografSichtbarNennen : null,
          rechteinhaber: s.rechteinhaber.trim(),
          creditText: s.rechteinhaber.trim(),
          beleg: `Bildregister ${s.einwilligung} (tools/arbeitsweise/import.mjs)`,
          umfang: "Web (Arbeitsweise, Team, Profil)",
          bearbeitung: s.bearbeitung === true,
          lizenzSeite: LICENSE_PAGE,
          stand: s.rechteStand || "",
        })
      );
    }
  }
  return out;
}

/** Das ganze Register (statisch + Import). */
export function imageRights() {
  return [...STATIC_IMAGE_RIGHTS, ...arbeitsweiseRights()];
}

const normalize = (src) => {
  const s = String(src || "").replace(/^https?:\/\/platzhirsch\.studio/i, "");
  try {
    return decodeURI(s.split("?")[0]);
  } catch {
    return s.split("?")[0];
  }
};

/** Register-Eintrag eines eigenen Fotos oder null (Herstellerbilder immer null). */
export function ownImage(src, register = imageRights()) {
  const path = normalize(src);
  if (!path || isManufacturerImage(path)) return null;
  return register.find((e) => e.datei === path) || null;
}

export const isOwnImage = (src, register) => ownImage(src, register) !== null;

/** Prüft das Register (leer = in Ordnung). */
export function registerErrors(register = imageRights()) {
  const errs = [];
  const seen = new Set();
  for (const e of register) {
    const id = e?.datei || "?";
    if (!/^\/[^?#]+\.(?:jpe?g|png|webp|avif)$/i.test(e?.datei || "")) errs.push(`${id}: datei muss ein lokaler Bildpfad unter public/ sein`);
    if (isManufacturerImage(e?.datei)) errs.push(`${id}: Herstellerbild/fremde Quelle – gehört nicht ins Urheber-Register`);
    if (seen.has(id)) errs.push(`${id}: doppelt`);
    seen.add(id);
    for (const f of ["rechteinhaber", "creditText", "beleg", "umfang"]) if (typeof e?.[f] !== "string" || !e[f].trim()) errs.push(`${id}: ${f} fehlt`);
    if (typeof e?.urheber !== "string") errs.push(`${id}: urheber muss ein Text sein (leer, wenn nicht belegt)`);
    if (typeof e?.bearbeitung !== "boolean") errs.push(`${id}: bearbeitung (true/false) fehlt`);
    if (e?.fotograf !== null && (typeof e?.fotograf !== "string" || !e.fotograf.trim())) errs.push(`${id}: fotograf als Name oder null`);
    if (typeof e?.exklusiveRechteBestaetigt !== "boolean") errs.push(`${id}: exklusiveRechteBestaetigt (true/false) fehlt`);
    if (e?.fotografSichtbarNennen !== null && typeof e?.fotografSichtbarNennen !== "boolean") errs.push(`${id}: fotografSichtbarNennen als true/false oder null (offen)`);
    // exklusive Rechte nach Nr. 31 schließen die Bearbeitung ein
    if (e?.exklusiveRechteBestaetigt === true && e?.bearbeitung !== true) errs.push(`${id}: exklusiveRechteBestaetigt ohne bearbeitung: true – widersprüchlich`);
    if (e?.lizenzSeite != null && e.lizenzSeite !== LICENSE_PAGE) errs.push(`${id}: lizenzSeite nur mit existierender Seite (LICENSE_PAGE)`);
    if (e?.stand && !/^\d{4}-\d{2}-\d{2}$/.test(e.stand)) errs.push(`${id}: stand als YYYY-MM-DD`);
  }
  return errs;
}

/**
 * Darf „© Platzhirsch“ (sichtbares Zeichen, copyrightHolder, XMP-Rechteinhaber)
 * gesetzt werden? Nur bei bestätigten exklusiven Rechten (Nr. 31), nie auf
 * Herstellerbildern.
 */
export const copyrightZeichenErlaubt = (entry) => entry?.exklusiveRechteBestaetigt === true && !isManufacturerImage(entry?.datei);

const vermerkText = (entry) => (entry?.dateiVermerk ? entry.dateiVermerk.replace(/\s{2,}/g, ", ").trim() : "");

/**
 * copyrightNotice. Der Vermerk des Fotografen aus der Datei bleibt immer
 * enthalten (§ 90c UrhG). „© Platzhirsch Home Living“ nur bei bestätigten
 * exklusiven Rechten; ohne Bestätigung der Datei-Vermerk bzw. „© <Fotograf>“
 * bzw. leer (dann kein copyrightNotice).
 */
export function copyrightNoticeOf(entry) {
  const vermerk = vermerkText(entry);
  if (copyrightZeichenErlaubt(entry)) return vermerk ? `© ${entry.rechteinhaber} (Foto: ${vermerk})` : `© ${entry.rechteinhaber}`;
  if (vermerk) return vermerk;
  return entry?.fotograf ? `© ${entry.fotograf}` : "";
}

/** Fotostudio/Firma vs. Person (für schema.org creator). */
const STUDIO_RE = /fotografie|photograph|studio|gmbh|\b(?:og|kg|e\.u\.)\b/i;

/**
 * schema.org ImageObject (Google „Bild-Metadaten“) für ein EIGENES Foto,
 * sonst null. Standalone-Knoten mit eigener @id, kollidiert nicht mit
 * WebPage/Organization-Knoten der Seite.
 * @param {string} src  Pfad wie im <img src>
 * @param {{alt?: string, width?: number, height?: number, register?: RightsEntry[]}} [opts]
 */
export function imageObjectSchema(src, { alt, width, height, register } = {}) {
  const e = ownImage(src, register);
  if (!e) return null;
  const url = `${SITE_URL}${encodeURI(e.datei)}`;
  const node = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${url}#image`,
    contentUrl: url,
    url,
    ...(alt ? { caption: alt } : {}),
    ...(width && height ? { width, height } : {}),
    creditText: e.creditText,
  };
  const notice = copyrightNoticeOf(e);
  if (notice) node.copyrightNotice = notice;
  // copyrightHolder nur bei bestätigten exklusiven Rechten (Nr. 31) –
  // ein bloßes Nutzungsrecht macht Platzhirsch nicht zum Rechteinhaber.
  if (copyrightZeichenErlaubt(e)) node.copyrightHolder = e.rechteinhaber === RIGHTS_HOLDER ? { "@id": ORGANIZATION_ID } : { "@type": "Organization", name: e.rechteinhaber };
  // creator: belegter Urheber, sonst der Fotograf laut Datei/Vertrag (nie geraten).
  if (e.urheber) node.creator = { "@type": "Person", name: e.urheber };
  else if (e.fotograf) node.creator = { "@type": STUDIO_RE.test(e.fotograf) ? "Organization" : "Person", name: e.fotograf };
  if (e.lizenzSeite) {
    node.license = `${SITE_URL}${e.lizenzSeite}`;
    node.acquireLicensePage = `${SITE_URL}${e.lizenzSeite}`;
  }
  return node;
}

/** ImageObjects für mehrere Bilder einer Seite; Herstellerbilder fallen weg. */
export function ownImageSchemas(images = [], register) {
  const seen = new Set();
  return images
    .map((img) => (typeof img === "string" ? { src: img } : img))
    .filter((img) => img?.src && !seen.has(normalize(img.src)) && seen.add(normalize(img.src)))
    .map((img) => imageObjectSchema(img.src, { ...img, register }))
    .filter(Boolean);
}
