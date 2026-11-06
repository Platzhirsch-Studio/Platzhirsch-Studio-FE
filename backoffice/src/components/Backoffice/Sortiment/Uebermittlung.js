"use client";
// Übermittlung an den Hersteller (IWOfurn · EDI · CSV): Weg wählen (Segment, Vorschlag aus dem Bestellweg des
// Lieferanten), Datei vorab prüfen (gleiche Regeln wie der Server: Positionen, Mengen, GLN), „Exportdatei erzeugen“
// legt die Datei als privaten Anhang ab und zeigt sie; danach „Als übermittelt markieren“ (verzögert, setzt aus dem
// Entwurf „Gesendet“) bzw. „Eingang bestätigt“ / „Fehler vermerken“. Keine Direktübertragung (unverifiziert).
import { useMemo, useState } from "react";
import { Download, FileText, TriangleAlert } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import useAktion from "./useAktion";
import { exportAction, uebermittlungAction } from "@/lib/backoffice/sortiment/actions";
import { exportieren, exportDaten, naechsteUebermittlung, pruefeExport, wegFuerBestellweg, WEGE } from "@/lib/backoffice/sortiment/uebermittlung";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { BESTELLAKTE, GLOSSAR } from "@/lib/backoffice/sortiment/texte";

/** @param {{b:object, lieferant:object|null, eigeneGln:string, darfSchreiben:boolean}} p */
export default function Uebermittlung({ b, lieferant, eigeneGln, darfSchreiben }) {
  const { sofort, verzoegert, laeuft } = useAktion();
  const vorschlag = b.uebermittlung_weg && WEGE[b.uebermittlung_weg]?.datei ? b.uebermittlung_weg : wegFuerBestellweg(lieferant?.bestellweg || b.bestellweg);
  const [weg, setWeg] = useState(WEGE[vorschlag]?.datei ? vorschlag : "CSV");
  const [datei, setDatei] = useState(null);

  const d = useMemo(() => exportDaten(b, { lieferant: lieferant || {}, einst: { eigene_gln: eigeneGln } }), [b, lieferant, eigeneGln]);
  const fehler = pruefeExport(weg, d.bestellung, d.absender, d.lieferant);
  const vorschau = useMemo(() => {
    if (fehler.length) return null;
    try {
      return exportieren(weg, d.bestellung, d.absender, d.lieferant);
    } catch {
      return null;
    }
  }, [weg, d, fehler.length]);

  const erzeugen = () =>
    sofort(() => exportAction({ name: b.name, weg }), {
      ok: (r) => BESTELLAKTE.dateiErzeugt(GLOSSAR.uebermittlungWeg[r.weg] || r.weg),
      onOk: (r) => setDatei(r),
    });

  useKuerzel("akte@sortiment", { "sortiment.akte-export": () => darfSchreiben && !fehler.length && erzeugen() });

  const inhalt = datei?.inhalt || vorschau?.inhalt || "";
  const name = datei?.dateiname || vorschau?.dateiname || "";
  const href = inhalt ? `data:${WEGE[weg].mime};charset=utf-8,${encodeURIComponent(inhalt)}` : null;

  return (
    <div className="flex flex-col gap-5" data-testid="uebermittlung">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segment
          label="Übermittlungsweg"
          wert={weg}
          onWechsel={(w) => {
            setWeg(w);
            setDatei(null);
          }}
          optionen={["IWOfurn", "EDI", "CSV"].map((w) => ({ wert: w, titel: w === "CSV" ? "CSV" : w, anzahl: undefined }))}
        />
        {darfSchreiben && (
          <span className="flex flex-wrap gap-2">
            <Knopf variant="secondary" icon="Download" laedt={laeuft} onClick={erzeugen} disabled={fehler.length > 0} grund={fehler.length ? fehler[0] : undefined} kuerzel="Umschalt+E" data-testid="export-erzeugen">
              {BESTELLAKTE.exportieren}
            </Knopf>
          </span>
        )}
      </div>
      <p className="bo-sor-unter">
        {WEGE[weg].label}
        {weg === vorschlag ? " · Bestellweg des Lieferanten" : ""}
      </p>
      {fehler.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-[16px] bg-bo-eiche-soft p-3 text-[14px] text-bo-eiche-text">
          {fehler.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      )}
      {!WEGE[weg].verifiziert && <p className="rounded-[14px] bg-bo-fill px-4 py-3 text-[13px] text-bo-text-soft">{BESTELLAKTE.unverifiziert}</p>}
      {inhalt && (
        <section aria-label={BESTELLAKTE.vorschau}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[14px] font-medium">
              <FileText className="size-4" strokeWidth={1.75} aria-hidden="true" />
              {name}
              <span className="bo-sor-klein">{datei ? "erzeugt und angehängt" : "Vorschau"}</span>
            </span>
            {href && (
              <a className="bo-knopf bo-knopf--ghost inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium" href={href} download={name}>
                <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
                Herunterladen
              </a>
            )}
          </div>
          <pre className="bo-sor-code" data-testid="export-vorschau">{inhalt}</pre>
        </section>
      )}
      {darfSchreiben && (b.uebermittlung_status || datei) && (
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] bg-bo-surface-2 p-3">
          <span className="mr-2 text-[14px]">
            Stand: <strong className="font-semibold">{GLOSSAR.uebermittlungStatus[datei ? "Exportiert" : b.uebermittlung_status] || "–"}</strong>
          </span>
          {naechsteUebermittlung(datei ? "Exportiert" : b.uebermittlung_status).map((s) => (
            <Knopf key={s} size="s" variant={s === "Uebermittelt" ? "secondary" : "ghost"} onClick={() => verzoegert(() => uebermittlungAction({ name: b.name, status: s }), { text: s === "Uebermittelt" && b.status === "Entwurf" ? "Als übermittelt markiert · Bestellung gesendet" : `Übermittlung: ${GLOSSAR.uebermittlungStatus[s]}` })}>
              {BESTELLAKTE.markieren[s]}
            </Knopf>
          ))}
        </div>
      )}
    </div>
  );
}
