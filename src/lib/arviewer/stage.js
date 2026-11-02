// AR-Viewer: welche Darstellungsstufe ein Katalogprodukt bekommt.
// Reine Funktionen ohne Server-/Browser-Abhängigkeit (Unit-Tests: tests/unit/ar-viewer-sortiment.test.mjs).
//
//   Stufe 1 "3d"       – echtes 3D-Modell (GLB, iOS Quick Look aus GLB), nur mit Freigabe
//                        des Herstellers oder als gekennzeichnetes Beispielmodell
//   Stufe 2 "ar-foto"  – freigestelltes Produktfoto als maßstäbliche Fläche (GLB-Plane mit
//                        Alpha-Textur) + Grundfläche B × T; Maße NUR aus Herstellerquelle mit URL
//   Stufe 2b "raumbedarf" – Grundfläche + halbtransparenter Quader in Originalgröße aus
//                        Herstellermaßen (mit URL), ganz ohne Herstellerbild → für jede
//                        Marke zulässig, auch bei Bearbeitungsverbot (Minotti, Poliform …)
//   Stufe 3 "bild"     – Fotos des Herstellers, kein AR
//   "ohne-bild"        – weder Modell noch Bild im Backoffice
//
// Rechte (src/lib/arviewer/rights.json, Feld veraenderung):
//   "ja"     → Stufe 2 öffentlich
//   "unklar" → wie "nein" (Fix-Runde 1, F2, P0): öffentlich Bildansicht bzw. Raumbedarf,
//              Stufe 2 nur intern (ARVIEWER_INTERN=1) mit gekennzeichneter Vorschau
//   "nein"   → Stufe 2 nur intern (ARVIEWER_INTERN=1); öffentlich höchstens Stufe 3
// Öffentliche Seiten zeigen keine Rechte-/Freigabe-Hinweise: `hinweis` ist nur bei
// `nurIntern` gesetzt, `gesperrt`/`ausblick` sind Inventur-Infos für den internen Betrieb.

export const STUFEN = Object.freeze({
  "3d": {
    nr: 1,
    titel: "Echtes 3D & AR",
    kurz: "3D & AR",
    text: "Ein 3D-Modell vom Hersteller: frei drehen, Maße einblenden und in Originalgröße in Ihren Raum stellen.",
  },
  "ar-foto": {
    nr: "2a",
    titel: "AR-Foto in Originalgröße",
    kurz: "AR-Foto",
    text: "Das freigestellte Produktfoto steht als Fläche in echter Breite und Höhe im Raum, dazu die Grundfläche am Boden. Es zeigt, wie viel Platz das Möbel braucht, aber nicht seine Form von allen Seiten.",
  },
  raumbedarf: {
    nr: "2b",
    titel: "Raumbedarf in Originalgröße",
    kurz: "Raumbedarf",
    text: "Grundfläche und Höhe in echter Größe als heller Quader im Raum, nach den Maßen des Herstellers. So sehen Sie, ob es passt, auch ohne Foto.",
  },
  bild: {
    nr: 3,
    titel: "Bildansicht",
    kurz: "Bild",
    text: "Fotos des Herstellers. Für die Ansicht im Raum fehlen noch ein freigegebenes Modell oder geprüfte Maße.",
  },
  "ohne-bild": {
    nr: 3,
    titel: "Noch ohne Bild",
    kurz: "Ohne Bild",
    text: "Für dieses Produkt liegt im Katalog noch kein Bild vor. Wir zeigen es Ihnen gern im Showroom oder schicken Unterlagen.",
  },
});

export const STUFEN_REIHENFOLGE = ["3d", "ar-foto", "raumbedarf", "bild", "ohne-bild"];

/** Stufen mit Ansicht im Raum (Filter-Chip „Im Raum ansehen“ fasst sie zusammen). */
export const RAUM_STUFEN = Object.freeze(["3d", "ar-foto", "raumbedarf"]);
export const hatRaum = (stufe) => RAUM_STUFEN.includes(stufe);

const FORMAT_LABEL = (f = "") => f.replace(/^zip\s*/i, "").replace(/[()]/g, "").replace(/,?\s*Inhalt prüfen/i, "").trim();

/**
 * @param {object} p
 * @param {string} p.brand            Backoffice-Markenname (Schlüssel in rights.json)
 * @param {boolean} p.hasImage
 * @param {object|null} p.rights      rights.marken[brand]
 * @param {object|null} p.model3d     Eintrag in models3d.json (src, poster, freigabe, sample)
 * @param {object|null} p.arFoto      Eintrag in arfotos.json (glb, poster, w, d, h)
 * @param {object|null} p.dims        Eintrag in dims.json (Herstellermaße mit URL)
 * @param {object|null} [p.raumbedarf] Eintrag in raumbedarf.json (glb, usdz, poster) – Stufe 2b
 * @param {object|null} p.source3d    sources.json modelle3d-Treffer (url, format)
 * @param {string|null} p.brand3d     sources.json quelle3d.status der Marke
 * @param {boolean} p.catalogDims     Backoffice-Freitext enthält Maße (nur Ausblick)
 * @param {boolean} [p.intern=false]  interner Betrieb (ARVIEWER_INTERN=1)
 * @returns {{stufe: string, ausblick: string[], hinweis: string|null, nurIntern: boolean, gesperrt: string|null}}
 */
export function resolveStage({
  brand,
  hasImage,
  rights = null,
  model3d = null,
  arFoto = null,
  dims = null,
  raumbedarf = null,
  source3d = null,
  brand3d = null,
  catalogDims = false,
  intern = false,
}) {
  const veraenderung = rights?.veraenderung || "unklar";
  const freigabe = Boolean(rights?.freigabe);
  const ausblick = [];
  let gesperrt = null;
  let hinweis = null;
  let nurIntern = false;
  let stufe = null;

  // Stufe 1: Herstellermodell – nur mit schriftlicher Freigabe (oder intern zum Prüfen).
  if (model3d?.src) {
    if (model3d.freigabe || freigabe || model3d.sample) stufe = "3d";
    else if (intern) {
      stufe = "3d";
      nurIntern = true;
      hinweis = "Interne Vorschau: Herstellermodell ohne schriftliche Freigabe – nicht veröffentlichen.";
    } else gesperrt = "Herstellermodell vorhanden, Freigabe fehlt.";
  }

  // Stufe 2: AR-Foto – braucht ein erzeugtes Asset UND Herstellermaße mit Quelle.
  if (!stufe && arFoto?.glb && dims?.quelle) {
    if (veraenderung === "ja") stufe = "ar-foto";
    else if (intern) {
      stufe = "ar-foto";
      nurIntern = true;
      hinweis =
        veraenderung === "unklar"
          ? `Interne Vorschau: ${brand} hat die Bildbearbeitung (Freistellen) noch nicht schriftlich freigegeben. Nicht veröffentlichen.`
          : `Interne Vorschau: ${brand} untersagt die Veränderung seiner Bilder. Nicht veröffentlichen.`;
    } else if (veraenderung === "unklar") gesperrt = `${brand}: Freigabe für freigestellte Bilder fehlt – öffentlich nur die Bildansicht.`;
    else gesperrt = `${brand} untersagt die Veränderung seiner Bilder – deshalb hier nur die Bildansicht.`;
  }

  // Stufe 2b: Raumbedarf – kein Bild im Spiel, daher unabhängig von den Bildrechten.
  if (!stufe && raumbedarf?.glb && dims?.quelle) stufe = "raumbedarf";

  if (!stufe) stufe = hasImage ? "bild" : "ohne-bild";

  // Ausblick: was für eine höhere Stufe fehlt (nur Fakten aus der Inventur).
  if (stufe !== "3d") {
    if (source3d?.url) {
      const f = FORMAT_LABEL(source3d.format);
      ausblick.push(`Herstellermodell gefunden${f ? ` (${f})` : ""} – Umwandlung nach GLB und schriftliche Freigabe stehen aus.`);
    } else if (brand3d === "public" || brand3d === "public_form") {
      ausblick.push(`${brand} bietet 3D-Daten an – die Zuordnung zu diesem Produkt ist noch offen.`);
    }
  }
  if (stufe === "raumbedarf" && veraenderung === "nein") gesperrt = null; // Hinweis bleibt über das Rechte-Register sichtbar
  if (stufe === "bild" || stufe === "ohne-bild" || stufe === "raumbedarf") {
    if (veraenderung === "nein" && !gesperrt) {
      ausblick.push(`AR-Foto nicht möglich: ${brand} untersagt die Veränderung seiner Bilder.`);
    } else if (dims?.quelle && !arFoto && hasImage && veraenderung !== "nein" && stufe !== "raumbedarf") {
      ausblick.push("Maße vom Hersteller bestätigt – das AR-Foto wird als Nächstes erzeugt.");
    } else if (dims?.quelle && stufe === "raumbedarf" && hasImage && veraenderung !== "nein") {
      ausblick.push("Ein AR-Foto (freigestelltes Produktfoto) folgt, sobald die Marke die Bildbearbeitung freigibt.");
    } else if (!dims && catalogDims && hasImage && veraenderung !== "nein") {
      ausblick.push("AR-Foto möglich, sobald die Maße vom Hersteller bestätigt sind.");
    }
  }

  return { stufe, ausblick, hinweis, nurIntern, gesperrt };
}

/**
 * Maße für die Anzeige: nur aus Herstellerquelle. Liefert null, wenn keine
 * geprüfte Angabe vorliegt – die UI zeigt dann „Maße fehlen“.
 */
export function verifiedDims(dims) {
  if (!dims || !dims.quelle) return null;
  const ok = ["w", "d", "h"].every((k) => Number.isFinite(dims[k]) && dims[k] > 0);
  return ok ? { w: dims.w, d: dims.d, h: dims.h, quelle: dims.quelle, modell: dims.modell || null, geprueft: dims.geprueft || null, hoeheHinweis: (dims.hoeheBeleg && dims.hoeheHinweis) || null } : null;
}

export const formatCm = ({ w, d, h }) => `B ${Math.round(w)} × T ${Math.round(d)} × H ${Math.round(h)} cm`;
