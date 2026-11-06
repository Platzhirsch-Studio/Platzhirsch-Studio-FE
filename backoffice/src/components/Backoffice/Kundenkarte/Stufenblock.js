"use client";
// Stufenblock (Konzept §3.5.2): Stufenleiter als <ol> mit aria-current, „Nächste Stufe“, Beträge nur für
// Leitung/GF hinter „Beträge zeigen“ (verfällt beim Verlassen), „Neu berechnen“, Einwilligungszeile
// (erfassen mit Nachweis / beenden), Fußzeile „Zählt: …“. Linie füllt nur nach Stufenwechsel – nie beim Laden.

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { stufenStil } from "./StufenKennzeichen";
import EinwilligungDialog from "./EinwilligungDialog";
import { EinwilligungBeendenDialog } from "./Dialoge";
import { neuBerechnenAction } from "@/lib/backoffice/kundenkarte/actions";
import { zaehltText } from "@/lib/backoffice/kundenkarte/regeln";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export default function Stufenblock({ karte, stufen = [], uebersicht, betraegeErlaubt = false, darfSchreiben = false, umsatzregeln = false, startstufe = "Platzhirsch", kundenmodus = "", oeffneEinwilligung = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [zeigen, setZeigen] = useState(false);
  const [laeuft, starte] = useTransition();
  const [langsam, setLangsam] = useState(false);
  const [fuellen, setFuellen] = useState(false);
  const [dialog, setDialog] = useState((kundenmodus || oeffneEinwilligung) && darfSchreiben && Number(karte.einwilligung_auswertung) !== 1 ? "erfassen" : null);
  const timer = useRef(null);
  const aktive = stufen.filter((s) => s.aktiv);
  const idx = aktive.findIndex((s) => s.name === karte.stufe);
  const st = aktive[idx];
  const einwilligung = Number(karte.einwilligung_auswertung) === 1;
  const naechste = uebersicht?.naechste_stufe;

  useEffect(() => () => clearTimeout(timer.current), []);

  const berechnen = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLangsam(true), 2000);
    starte(async () => {
      const r = await neuBerechnenAction({ karte: karte.name });
      clearTimeout(timer.current);
      setLangsam(false);
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      if (r.wechsel) setFuellen(true);
      zeige(r.berechnet === false ? "Ohne Einwilligung wird nicht ausgewertet." : `Einstufung geprüft · ${r.belege ?? 0} Einkäufe berücksichtigt`, { art: "ok", unter: r.wechsel ? `Stufe ${r.wechsel.alt} → ${r.wechsel.neu}` : undefined });
      router.refresh();
    });
  };
  useKuerzel("akte@kundenkarte", { "kundenkarte.neu-berechnen": () => (einwilligung && darfSchreiben ? berechnen() : false) });

  const schwellen = aktive.filter((s) => Number(s.schwelle_jahresumsatz_cent) > 0).map((s) => `ab ${cent(s.schwelle_jahresumsatz_cent).replace(",00", "")}`).join(" / ");

  return (
    <section className="bo-kachel bo-kachel--dicht" aria-label="Stufe und Einstufung" data-testid="kk-stufenblock">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <ol className="bo-kk-leiter" aria-label="Stufen">
          {aktive.map((s, i) => (
            <li key={s.name} className="contents">
              {i > 0 && <span className="bo-kk-leiter__linie" aria-hidden="true" data-erreicht={i <= idx ? "" : undefined} data-fuellen={fuellen && i === idx ? "" : undefined} />}
              <span className="bo-kk-leiter__schritt" aria-current={i === idx ? "step" : undefined} data-erreicht={i <= idx ? "" : undefined} style={stufenStil(s.farbe)}>
                <span className="bo-kk-leiter__punkt" aria-hidden="true" />
                {s.stufenname}
                <span className="bo-kk-sr">{i < idx ? " (erreicht)" : i === idx ? " (aktuell)" : " (offen)"}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-bo-text-soft">{einwilligung ? T.akte.naechsteStufe(naechste) : null}</span>
          {betraegeErlaubt && einwilligung && (
            <Knopf size="s" variant="ghost" icon="Eye" aria-pressed={zeigen} onClick={() => setZeigen((z) => !z)} data-testid="kk-betraege">
              {zeigen ? T.akte.betraegeAus : T.akte.betraegeZeigen}
            </Knopf>
          )}
          {darfSchreiben && einwilligung && (
            <Knopf size="s" variant="ghost" icon="RefreshCw" label={T.akte.neuBerechnen} laedt={laeuft} onClick={berechnen} data-testid="kk-neu-berechnen" />
          )}
        </div>
      </div>

      {zeigen && betraegeErlaubt && einwilligung && (
        <div className="mt-4 rounded-2xl bg-bo-surface-2 px-4 py-3 text-[14px]" data-testid="kk-betraege-text">
          <p className="font-medium tabular-nums">{T.akte.umsatz(cent(uebersicht?.jahresumsatz_cent), naechste && uebersicht?.fehlt_noch_cent != null ? `${naechste}: ${cent(uebersicht.fehlt_noch_cent)}` : null, schwellen)}</p>
          {!umsatzregeln && <p className="bo-kk-warn mt-1">{T.akte.imAufbau}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
        {einwilligung ? (
          <p className="flex items-center gap-2 text-[14px]">
            <Icon name="Shield" className="size-4 text-bo-see-text" />
            {T.akte.einwilligungSeit(datum(karte.einwilligung_am))}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-[14px] text-bo-text-soft">
            <Icon name="Shield" className="size-4" />
            {T.akte.ohneEinwilligung(st?.stufenname && Number(karte.stufe_manuell) ? st.stufenname : startstufe)}
          </p>
        )}
        {darfSchreiben &&
          (einwilligung ? (
            <Knopf size="s" variant="ghost" onClick={() => setDialog("beenden")} data-testid="kk-einwilligung-beenden">
              {T.akte.beenden}
            </Knopf>
          ) : (
            <Knopf size="s" icon="Shield" onClick={() => setDialog("erfassen")} disabled={!["Aktiv", "Beantragt", "Gesperrt"].includes(karte.status)} grund={!["Aktiv", "Beantragt", "Gesperrt"].includes(karte.status) ? "Nur für gültige Karten." : undefined} data-testid="kk-einwilligung-erfassen">
              {T.akte.einwilligungErfassen}
            </Knopf>
          ))}
      </div>

      <p className="bo-kk-fusszeile mt-3 flex flex-wrap justify-between gap-2">
        <span>{zaehltText(umsatzregeln)}</span>
        {einwilligung && (
          <span title={karte.umsatz_berechnet_am ? datumZeit(karte.umsatz_berechnet_am) : undefined}>
            {laeuft ? (langsam ? T.akte.dauert : T.akte.berechnet) : uebersicht?.umsatz_stand ? T.akte.stand(uebersicht.umsatz_stand) : ""}
          </span>
        )}
      </p>

      {dialog === "erfassen" && <EinwilligungDialog karte={karte.name} name={karte.kunde_name} kundenmodus={kundenmodus} onSchliessen={() => setDialog(null)} onFertig={() => (setDialog(null), setFuellen(true), router.refresh())} />}
      {dialog === "beenden" && <EinwilligungBeendenDialog karte={karte.name} name={karte.kunde_name} vonHand={Number(karte.stufe_manuell) === 1} onSchliessen={() => setDialog(null)} onFertig={() => (setDialog(null), zeige(T.einwilligung.beendet, { art: "ok" }), router.refresh())} />}
    </section>
  );
}
