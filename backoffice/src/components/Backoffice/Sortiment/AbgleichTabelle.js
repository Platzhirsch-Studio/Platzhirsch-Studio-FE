"use client";
// AB-Abgleich (§ 4.3, E3): je Abweichung Bestellt ↔ laut AB, Segment OK 1 · Rückfrage 2 · Ablehnen 3 als
// role="grid" (Tasten 1/2/3 wirken nur mit Fokus im Raster, ↑/↓ wechselt die Zeile). „Rückfrage“ öffnet das Menü
// mit drei Zielen: beim Hersteller (Mail, verzögert) · beim Verkauf (Aufgabe, verzögert) · nur vermerken.
// Ablehnen und Preis-OK nur Leitung – für das Team gesperrt mit Grund.
import { useRef, useState } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { Status } from "./Bausteine";
import useAktion from "./useAktion";
import { bewertenAction, klaerenAction } from "@/lib/backoffice/sortiment/actions";
import { bewertungErlaubt, reklamationText } from "@/lib/backoffice/sortiment/regeln";
import { BESTELLAKTE, GLOSSAR } from "@/lib/backoffice/sortiment/texte";

/** @param {{name:string, abNummer:string, zeilen:object[], leitung:boolean, darfSchreiben:boolean}} p */
export default function AbgleichTabelle({ name, abNummer, zeilen, leitung, darfSchreiben }) {
  const { sofort, verzoegert, laeuft } = useAktion();
  const [aktiv, setAktiv] = useState(0);
  const [rueckfrage, setRueckfrage] = useState(null);
  const [lokal, setLokal] = useState({});
  const zeilenRef = useRef([]);

  const wert = (z) => lokal[z.idx] ?? z.bewertung ?? "offen";

  const bewerte = async (z, bewertung) => {
    if (!bewertungErlaubt(bewertung, z.feld, { leitung })) return;
    if (bewertung === "pruefen") {
      setRueckfrage(z);
      return;
    }
    const alt = wert(z);
    setLokal((l) => ({ ...l, [z.idx]: bewertung }));
    const r = z.feld === "Preis" && bewertung === "ok" ? await sofort(() => klaerenAction({ name, zeile: z.idx, aktion: "akzeptieren" }), { ok: BESTELLAKTE.bewertet(GLOSSAR.bewertung.ok) }) : await sofort(() => bewertenAction({ name, zeile: z.idx, bewertung }), { ok: BESTELLAKTE.bewertet(GLOSSAR.bewertung[bewertung]) });
    if (!r?.ok) setLokal((l) => ({ ...l, [z.idx]: alt }));
  };

  const taste = (e, i) => {
    const z = zeilen[i];
    if (e.target.closest("button[role='menuitem'],input,textarea")) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktiv(Math.min(zeilen.length - 1, i + 1));
      zeilenRef.current[Math.min(zeilen.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv(Math.max(0, i - 1));
      zeilenRef.current[Math.max(0, i - 1)]?.focus();
    } else if (darfSchreiben && ["1", "2", "3"].includes(e.key)) {
      e.preventDefault();
      bewerte(z, { 1: "ok", 2: "pruefen", 3: "abgelehnt" }[e.key]);
    }
  };

  const ziel = async (aktion) => {
    const z = rueckfrage;
    if (!z) return;
    setRueckfrage(null);
    const alt = wert(z);
    setLokal((l) => ({ ...l, [z.idx]: "pruefen" }));
    const r =
      aktion === "vermerken"
        ? await sofort(() => bewertenAction({ name, zeile: z.idx, bewertung: "pruefen" }), { ok: BESTELLAKTE.bewertet(GLOSSAR.bewertung.pruefen) })
        : await verzoegert(() => klaerenAction({ name, zeile: z.idx, aktion, text: aktion === "lieferant_reklamieren" ? reklamationText([z], name, abNummer) : "" }), { text: aktion === "lieferant_reklamieren" ? "Rückfrage an den Hersteller" : "Rückfrage an den Verkauf", onVerworfen: () => setLokal((l) => ({ ...l, [z.idx]: alt })) });
    if (!r?.ok) setLokal((l) => ({ ...l, [z.idx]: alt }));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="bo-sor-tabelle bo-sor-grid" role="grid" aria-label={BESTELLAKTE.abweichungenTitel} data-testid="abgleich">
          <thead>
            <tr>
              <th scope="col">Position</th>
              <th scope="col">{BESTELLAKTE.bestellt} → {BESTELLAKTE.bestaetigt}</th>
              <th scope="col">{BESTELLAKTE.bewertungLabel}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => {
              const w = wert(z);
              return (
                <tr key={z.idx} ref={(el) => (zeilenRef.current[i] = el)} tabIndex={i === aktiv ? 0 : -1} aria-selected={i === aktiv} onFocus={() => setAktiv(i)} onKeyDown={(e) => taste(e, i)} data-testid="abgleich-zeile">
                  <td>
                    <span className="block max-w-[240px] truncate font-medium">
                      <span className="tabular-nums text-bo-text-soft">{z.position} · </span>
                      {z.bezeichnung}
                    </span>
                    <span className="bo-sor-klein block">{GLOSSAR.abFeld[z.feld] || z.feld}{z.klaerung ? ` · ${z.klaerung}` : ""}</span>
                  </td>
                  <td>
                    <span className="bo-sor-nr block">
                      {z.bestellt} <span className="text-bo-text-faint" aria-label="bestätigt">→</span> <strong className="font-semibold">{z.bestaetigt}</strong>
                    </span>
                    <span className="bo-sor-klein bo-sor-warn block">{z.abweichung_text}</span>
                  </td>
                  <td>
                    {darfSchreiben ? (
                      <span className="bo-sor-bewertung" role="radiogroup" aria-label={`Bewertung Position ${z.position} ${GLOSSAR.abFeld[z.feld] || z.feld}`}>
                        {[
                          ["ok", "OK", "1"],
                          ["pruefen", "Rückfrage", "2"],
                          ["abgelehnt", "Ablehnen", "3"],
                        ].map(([b, t, k]) => {
                          const erlaubt = bewertungErlaubt(b, z.feld, { leitung });
                          return (
                            <button key={b} type="button" role="radio" aria-checked={w === b} data-wert={b} disabled={!erlaubt || laeuft} title={!erlaubt ? (b === "abgelehnt" ? BESTELLAKTE.ablehnenNurLeitung : BESTELLAKTE.preisOkNurLeitung) : undefined} tabIndex={-1} onClick={() => bewerte(z, b)}>
                              {t}
                              <kbd aria-hidden="true">{k}</kbd>
                            </button>
                          );
                        })}
                      </span>
                    ) : (
                      <Status gruppe="bewertung" wert={w} groesse="sm" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!leitung && darfSchreiben && <p className="bo-sor-klein mt-3 px-3">{BESTELLAKTE.ablehnenNurLeitung} · {BESTELLAKTE.preisOkNurLeitung}</p>}
      <Dialog
        offen={!!rueckfrage}
        onSchliessen={() => setRueckfrage(null)}
        titel="Rückfrage – an wen?"
        text={rueckfrage ? `Position ${rueckfrage.position}: ${GLOSSAR.abFeld[rueckfrage.feld]} ${rueckfrage.abweichung_text}` : ""}
        groesse="md"
        fuss={<Knopf variant="secondary" onClick={() => setRueckfrage(null)}>Abbrechen</Knopf>}
      >
        <div className="flex flex-col gap-2">
          <Knopf variant="secondary" icon="Mail" onClick={() => ziel("lieferant_reklamieren")} className="justify-start">
            Rückfrage {BESTELLAKTE.rueckfrageZiele.hersteller}
          </Knopf>
          <Knopf variant="secondary" icon="Users" onClick={() => ziel("kunde_rueckfragen")} className="justify-start">
            Rückfrage {BESTELLAKTE.rueckfrageZiele.verkauf}
          </Knopf>
          <Knopf variant="ghost" icon="Pencil" onClick={() => ziel("vermerken")} className="justify-start">
            {BESTELLAKTE.rueckfrageZiele.vermerken}
          </Knopf>
          {rueckfrage && <p className="mt-2 whitespace-pre-line rounded-[16px] bg-bo-surface-2 p-4 text-[13px] leading-5 text-bo-text-soft">{reklamationText([rueckfrage], name, abNummer)}</p>}
        </div>
      </Dialog>
    </>
  );
}
