import Seitenkopf from "../Seitenkopf";
import Leer from "../Leer";
import Fehler from "../Fehler";
import { Bento } from "../Kachel";
import { BerichtFilter, BerichtTabelle } from "./BerichtTeile";
import { BERICHT } from "./texte";

export { ladeBericht, summen, berichtCsv } from "./logik";

/**
 * Berichtsseite (MASTER G-13, Seitentyp T8; Lounge; Team P0-5b). Server-Komponente ohne eigene Datenquelle:
 * Die Seite prüft Sitzung/Recht, lädt mit `ladeBericht(() => …)` (Zeitlimit 8 s) und reicht das Ergebnis herein.
 * Aufbau: Seitenkopf („Bericht“ über dem großen Titel) · Filterzeile (Zeitraum mit Datumsfeld, Bereichsfilter) ·
 * Diagramme als Bento (Charts mit `className="md:col-span-*"`) · Ergebnistabelle in Kachel ohne Paging mit
 * Summenzeile, CSV (nur Export-Recht, protokolliert) und PDF (`pdfHref`, z. B. /druck/bericht/<id>; ohne Ziel
 * deaktiviert mit Ersatzweg). Leer: „Keine Daten im Zeitraum“; Zeitlimit: „Zeitraum eingrenzen“.
 *
 * @param {object} p
 * @param {string} p.bericht         ID (a–z, 0–9, Bindestrich) – Dateiname und Protokoll
 * @param {string} p.bereich         Bereichs-Slug (Export-Recht)
 * @param {string} p.titel
 * @param {import("react").ReactNode} [p.untertitel]
 * @param {Array<{titel:string, href?:string}>} [p.krumen]
 * @param {import("react").ReactNode} [p.aktionen]
 * @param {import("react").ReactNode} [p.unternav]
 * @param {{basis:string, params?:Record<string,string>, zeitraum?:boolean|{label?:string}, felder?:Array<{name,label,optionen}>}} [p.filter]
 * @param {{status:"ok"|"zeitlimit"|"fehler", zeilen?:object[], code?:string}} p.ergebnis   Rückgabe von ladeBericht
 * @param {Array<{fieldname,label,fieldtype?,cent?,summe?:boolean}>} p.spalten
 * @param {import("react").ReactNode} [p.diagramme]   Charts (Balken/Linie/Donut) – erscheinen nur bei Daten
 * @param {boolean} [p.darfExport]
 * @param {string} [p.pdfHref]
 * @param {Record<string,string>} [p.statusTon]
 */
export default function BerichtSeite({ bericht, bereich, titel, untertitel, krumen = [], aktionen, unternav, filter, ergebnis, spalten = [], diagramme, darfExport = false, pdfHref, statusTon, testid = "bericht" }) {
  const zeilen = ergebnis?.status === "ok" ? ergebnis.zeilen || [] : [];
  return (
    <div className="min-w-0" data-testid={testid}>
      <Seitenkopf titel={titel} untertitel={untertitel} krumen={krumen} ueber={krumen.length ? undefined : BERICHT.ueber} aktionen={aktionen} unternav={unternav} />
      {filter && <BerichtFilter basis={filter.basis} params={filter.params} zeitraum={filter.zeitraum ?? true} felder={filter.felder} />}
      {ergebnis?.status === "zeitlimit" ? (
        <Leer art="gefiltert" icon="Hourglass" titel={BERICHT.zeitlimitTitel} text={BERICHT.zeitlimitText} zuruecksetzenHref={filter?.basis} testid="bericht-zeitlimit" />
      ) : ergebnis?.status === "fehler" ? (
        <Fehler code={ergebnis.code || "unavailable"} />
      ) : zeilen.length === 0 ? (
        <Leer art="gefiltert" icon="ChartColumn" titel={BERICHT.leerTitel} text={BERICHT.leerText} zuruecksetzenHref={filter?.params && Object.keys(filter.params).length ? filter.basis : undefined} testid="bericht-leer" />
      ) : (
        <div className="flex min-w-0 flex-col gap-(--bo-bento-gap)">
          {diagramme && <Bento>{diagramme}</Bento>}
          <BerichtTabelle bericht={bericht} bereich={bereich} spalten={spalten} zeilen={zeilen} statusTon={statusTon} darfExport={darfExport} pdfHref={pdfHref} params={filter?.params} />
        </div>
      )}
    </div>
  );
}
