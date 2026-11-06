"use client";
// A11 Schritt 3–4 (§ 5.8): abgeglichene Zeilen mit Chips Alle · Über Schwelle · Ohne Produkt · Erster Preis ·
// Wird übernommen; Δ % über der Schwelle mit Warnsymbol; „übernehmen“ je Zeile umschaltbar (über der Schwelle nur
// Leitung). Übernehmen (Leitung) als verzögerter Commit – die Website folgt nach Ablauf. UVP mit anderer Preisbasis
// ist gesperrt (UVP gilt nur als österreichische Herstellerempfehlung).
import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Bestaetigen from "../Bestaetigen";
import Schalter from "../Schalter";
import useAktion from "./useAktion";
import { preislisteAction, preislisteZeileAction } from "@/lib/backoffice/sortiment/actions";
import { PREISLISTEN } from "@/lib/backoffice/sortiment/texte";
import { cent, datum } from "@/lib/backoffice/format";

export default function PreislisteLauf({ liste, leitung, darfSchreiben }) {
  const { sofort, verzoegert, laeuft } = useAktion();
  const [chip, setChip] = useState("alle");
  const [frage, setFrage] = useState(false);
  const [lokal, setLokal] = useState({});
  const schwelle = Number(liste.schwelle_prozent) || 15;
  const zeilen = (liste.zeilen || []).map((z) => ({ ...z, uebernehmen: lokal[z.name] ?? z.uebernehmen }));
  const filter = {
    alle: () => true,
    schwelle: (z) => Math.abs(z.abweichung_prozent || 0) > schwelle,
    ohneProdukt: (z) => !z.produkt,
    erster: (z) => z.produkt && !z.alt_cent,
    wird: (z) => z.uebernehmen,
  };
  const sichtbar = zeilen.filter(filter[chip]);
  const anzahl = useMemo(() => Object.fromEntries(Object.keys(filter).map((k) => [k, zeilen.filter(filter[k]).length])), [zeilen]); // eslint-disable-line react-hooks/exhaustive-deps
  const offen = liste.status === "Geprueft" || liste.status === "Hochgeladen";

  const umschalten = async (z, an) => {
    setLokal((l) => ({ ...l, [z.name]: an ? 1 : 0 }));
    const r = await preislisteZeileAction({ name: liste.name, zeile: z.name, uebernehmen: an });
    if (!r?.ok) setLokal((l) => ({ ...l, [z.name]: z.uebernehmen }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segment label="Zeilen" wert={chip} onWechsel={setChip} groesse="s" optionen={Object.entries(PREISLISTEN.chips).map(([wert, titel]) => ({ wert, titel, anzahl: anzahl[wert] }))} />
        {darfSchreiben && offen && (
          <span className="flex flex-wrap gap-2">
            {liste.status === "Hochgeladen" && (
              <Knopf variant="primary" laedt={laeuft} onClick={() => sofort(() => preislisteAction({ name: liste.name, methode: "pruefen" }), { ok: "Preisliste abgeglichen" })}>
                {PREISLISTEN.abgleichen}
              </Knopf>
            )}
            {liste.status === "Geprueft" && (
              <Knopf variant="primary" icon="Check" disabled={!leitung || !anzahl.wird} grund={!leitung ? PREISLISTEN.anLeitung : undefined} onClick={() => setFrage(true)} data-testid="preisliste-uebernehmen">
                {PREISLISTEN.uebernehmen}
              </Knopf>
            )}
            <Knopf variant="ghost" onClick={() => sofort(() => preislisteAction({ name: liste.name, methode: "verwerfen" }), { ok: "Preisliste verworfen" })}>
              {PREISLISTEN.verwerfen}
            </Knopf>
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="bo-sor-tabelle">
          <thead>
            <tr>
              <th scope="col">Artikel</th>
              <th scope="col" className="r">{PREISLISTEN.alt}</th>
              <th scope="col" className="r">{PREISLISTEN.neuPreis}</th>
              <th scope="col" className="r">{PREISLISTEN.delta}</th>
              <th scope="col">Übernehmen</th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((z) => {
              const ueber = Math.abs(z.abweichung_prozent || 0) > schwelle;
              return (
                <tr key={z.name} data-warn={ueber ? "true" : undefined}>
                  <td>
                    <span className="block font-medium">{z.bezeichnung || z.hersteller_artikelnr}</span>
                    <span className="bo-sor-klein">{[z.hersteller_artikelnr, z.produkt ? null : "ohne Produkt", z.hinweis].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="r bo-sor-zahl text-bo-text-soft">{z.alt_cent ? cent(z.alt_cent) : "–"}</td>
                  <td className="r bo-sor-zahl font-semibold">{cent(z.neu_cent)}</td>
                  <td className={`r bo-sor-zahl ${ueber ? "bo-sor-gefahr" : "text-bo-text-soft"}`}>
                    {z.alt_cent ? (
                      <span className="inline-flex items-center gap-1">
                        {ueber && <TriangleAlert className="size-3.5" strokeWidth={2} aria-hidden="true" />}
                        {`${z.abweichung_prozent > 0 ? "+" : ""}${Number(z.abweichung_prozent).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`}
                      </span>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td>
                    <Schalter label={`${z.bezeichnung} übernehmen`} an={!!z.uebernehmen} onWechsel={(an) => umschalten(z, an)} deaktiviert={!darfSchreiben || !offen || !z.produkt || (ueber && !leitung)} groesse="s" zeile={false} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Bestaetigen
        offen={frage}
        titel={`${anzahl.wird} Preise übernehmen?`}
        text={`${PREISLISTEN.zusammenfassung(anzahl.wird, datum(liste.stand))} · ${PREISLISTEN.uebersprungen(zeilen.length - anzahl.wird)}`}
        fakten={[
          { label: "Marke", wert: liste.marke },
          { label: "Preisart", wert: liste.preisart },
        ]}
        bestaetigen="Übernehmen"
        laeuft={laeuft}
        onAbbrechen={() => setFrage(false)}
        onBestaetigen={async () => {
          setFrage(false);
          await verzoegert(() => preislisteAction({ name: liste.name, methode: "uebernehmen" }), { text: PREISLISTEN.uebernommen(anzahl.wird) });
        }}
      />
    </div>
  );
}
