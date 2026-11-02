// Kartenbilder der Leistungs-Übersicht (/de/leistungen) und vorab erzeugte
// Größen (siehe tools/variants.mjs). Runde 5 (gesamtwerk P2): eigener
// public-Pfad /bilder/leistungen/ statt /labs/hub/v/ (keine Labs-Welt mehr,
// Inhaber-Entscheidung Nr. 9) – Quelle <id>.webp und Größen <id>-<breite>.<ext>
// liegen im selben Ordner. Reines Modul ohne JSX – auch vom Node-Skript genutzt.
export const HUB_DIR = "/bilder/leistungen";
export const HUB_WIDTHS = [384, 640, 960, 1200];

const HUB_SRC = /^\/bilder\/leistungen\/([a-z0-9]+(?:-[a-z]+)*)\.webp$/;

/** Kennung eines Kartenbilds ("/bilder/leistungen/sofaplaner.webp" → "sofaplaner") oder null. */
export function hubImageId(src) {
  const m = typeof src === "string" ? HUB_SRC.exec(src) : null;
  return m ? m[1] : null;
}

/** Pfad der Quelle eines Kartenbilds ("sofaplaner" → "/bilder/leistungen/sofaplaner.webp"). */
export const hubSrc = (id) => `${HUB_DIR}/${id}.webp`;

/** Eine Größe ("kuechenplaner", 640, "webp" → "/bilder/leistungen/kuechenplaner-640.webp"). */
export const hubVariant = (id, w, ext) => `${HUB_DIR}/${id}-${w}.${ext}`;

/** srcset für ein Format ("avif" | "webp"). */
export function hubSrcSet(id, ext) {
  return HUB_WIDTHS.map((w) => `${hubVariant(id, w, ext)} ${w}w`).join(", ");
}
