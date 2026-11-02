// Ein Schlüsselbild je Geschäftsfeld (Rat 9,5 B7, gesamtwerk M4, neuland 9):
// solange keine eigenen, freigegebenen Fotos da sind, bekommt jedes
// Geschäftsfeld eine ehrlich gekennzeichnete STUDIO-GRAFIK in der
// Haarlinien-Sprache von /arbeitsweise. Beschriftung sichtbar: „Schema des
// Studios“ – es ist keine Skizze von Harald Menghin (Inhaber-Entscheidung
// Nr. 8: nur echtes Material als seine Zeichnung), kein Foto, kein Projekt.
//
// Größen: mobil ein flaches Band 3:1 (Design-Jury P1-4: UNTER H1 und Knopf,
// ≤ 40 % der Bildschirmhöhe), ab lg 4:3 in der rechten Spalte (keine leere
// Hälfte). Die Beschriftung steht immer als figcaption unter dem Kasten. Die Grafik ist
// dekorativ (aria-hidden), die Beschriftung ist Text.
// Kein Client-JS, keine Hooks: nutzbar in Server- und Client-Komponenten
// (Termin-Grafik für T1, Ideenboard-Grafik für T2).
import { cx } from "@/components/ui";
import { ArchitektenDrawing, HotelDrawing, IdeenboardDrawing, KuecheDrawing, TerminDrawing } from "./drawings";
import StadtMap, { CITY_COORDS } from "./StadtMap";
import { kindCaption, schemaText } from "./text";

const DRAWINGS = {
  hotel: HotelDrawing,
  architekten: ArchitektenDrawing,
  kueche: KuecheDrawing,
  termin: TerminDrawing,
  ideenboard: IdeenboardDrawing,
};

/** Geschäftsfelder mit eigener Grafik (für Tests und Aufrufer). */
export const SCHEMA_KINDS = Object.freeze([...Object.keys(DRAWINGS), "stadt"]);

/**
 * @param {"hotel"|"architekten"|"kueche"|"termin"|"ideenboard"|"stadt"} kind
 * @param {string} [path] nur für kind="stadt": Pfad der Stadtseite (/designermoebel-…)
 * @param {"de"|"en"|"fr"|"it"} [locale]
 * @param {boolean} [swiss] de-CH-Schreibweise (kein ß)
 * @param {string} [className] Platzierung im Raster des Aufrufers
 */
export default function StudioSchema({ kind, path, locale = "de", swiss = false, className }) {
  const t = schemaText(locale, swiss);
  const Drawing = DRAWINGS[kind];
  if (!Drawing && kind !== "stadt") return null;
  return (
    <figure className={cx("relative m-0", className)} data-studio-schema={kind}>
      {/* Optik-QA 01.11.2026: ab sm (Handy quer, iPad hoch) 5:1 statt 3:1 – das 3:1-Band war dort
          260 px hoch (zwei Drittel des Bildschirms quer) mit viel leerer Fläche um die Grafik. */}
      {/* QM R3: am iPad hoch stand die Grafik im 5:1-Band winzig (≈ 20 % der Breite) – ab sm jetzt 5:2,
          das flache 5:1-Band nur noch für Telefone quer (niedrige Höhe). */}
      <div className="relative aspect-[3/1] w-full overflow-hidden border border-line bg-surface-raised sm:aspect-[5/2] [@media(orientation:landscape)_and_(max-height:30rem)]:aspect-[5/1]! lg:aspect-[4/3]!">
        {kind === "stadt" ? (
          <StadtMap path={path} />
        ) : (
          <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full p-2 lg:p-6" aria-hidden="true" focusable="false">
            <Drawing labels={t.labels} />
          </svg>
        )}
      </div>
      <figcaption className="mt-2 text-small text-text-soft" data-schema-label="">
        {kindCaption(kind, locale, swiss, CITY_COORDS[path]?.name || "")}
      </figcaption>
    </figure>
  );
}
