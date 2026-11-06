"use client";
// Dialog „Einwilligung zur Auswertung der Einkäufe erfassen“ (Konzept §3.5.5): nur mit Nachweis (Foto/Datei
// oder Bestätigung der Kundin im Kundenmodus) und Haken „Datenschutzinformation erhalten“ (Art. 7 Abs. 1 DSGVO).
// Kein Rückgängig – Rücknahme ist der Widerruf.

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { Dialog } from "../Overlay";
import { ChipWahl } from "./Dialoge";
import { einwilligungErfassenAction, kundenmodusStandAction, kundenmodusStartenAction } from "@/lib/backoffice/kundenkarte/actions";
import { EINWILLIGUNG_KANAELE } from "@/lib/backoffice/kundenkarte/labels";
import { DATENSCHUTZINFO_VERSION, EINWILLIGUNG_TEXT, EINWILLIGUNG_TEXTVERSION, T } from "@/lib/backoffice/kundenkarte/texte";

/** Nachweis: Kamera (capture) oder Datei, Vorschau 96 px. */
export function NachweisAufnahme({ datei, onDatei, fehler, testid = "kk-nachweis" }) {
  const id = useId();
  const vorschau = useMemo(() => (datei && /^image\//.test(datei.type) ? URL.createObjectURL(datei) : ""), [datei]);
  useEffect(() => () => vorschau && URL.revokeObjectURL(vorschau), [vorschau]);
  return (
    <div data-testid={testid}>
      <span className="bo-kk-label" id={`${id}-l`}>
        {T.einwilligung.nachweis} <span className="text-bo-text-faint">(Pflicht)</span>
      </span>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby={`${id}-l`}>
        <label className="bo-knopf bo-knopf--secondary inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold">
          <Icon name="ScanLine" className="size-4" />
          {T.einwilligung.foto}
          <input type="file" accept="image/*" capture="environment" className="bo-kk-sr" onChange={(e) => onDatei(e.target.files?.[0] || null)} data-testid={`${testid}-foto`} />
        </label>
        <label className="bo-knopf bo-knopf--ghost inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold">
          <Icon name="Paperclip" className="size-4" />
          {T.einwilligung.datei}
          <input type="file" accept="image/*,application/pdf" className="bo-kk-sr" onChange={(e) => onDatei(e.target.files?.[0] || null)} data-testid={`${testid}-datei`} />
        </label>
        {datei && (
          <span className="inline-flex items-center gap-2 text-[13px] text-bo-text-soft">
            {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (blob:) */}
            {vorschau ? <img src={vorschau} alt="Vorschau des Nachweises" className="size-24 rounded-xl object-cover" /> : <Icon name="FileText" className="size-4" />}
            {datei.name}
          </span>
        )}
      </div>
      {fehler && <p className="bo-kk-fehler">{fehler}</p>}
    </div>
  );
}

export default function EinwilligungDialog({ karte, name, kundenmodus: kmStart = "", onSchliessen, onFertig }) {
  const router = useRouter();
  const [kanal, setKanal] = useState(kmStart ? "Unterschrift Tablet" : "Unterschrift Formular");
  const [datei, setDatei] = useState(null);
  const [haken, setHaken] = useState(false);
  const [textOffen, setTextOffen] = useState(false);
  const [km, setKm] = useState(kmStart ? { id: kmStart, bestaetigt: null } : null);
  const [fehler, setFehler] = useState({});
  const [laeuft, starte] = useTransition();

  useEffect(() => {
    if (!km?.id || km.bestaetigt) return undefined;
    let aktiv = true;
    const pruefe = async () => {
      const r = await kundenmodusStandAction({ sitzung: km.id });
      if (aktiv && r?.ok && r.bestaetigt) setKm({ id: km.id, bestaetigt: r.bestaetigt });
    };
    pruefe();
    const t = setInterval(pruefe, 2000);
    return () => {
      aktiv = false;
      clearInterval(t);
    };
  }, [km]);

  const nachweisDa = kanal === "Unterschrift Tablet" ? Boolean(km?.bestaetigt) : Boolean(datei);
  const fehlt = !nachweisDa && !haken ? T.einwilligung.fehlt : !nachweisDa ? T.einwilligung.fehltNachweis : !haken ? T.einwilligung.fehltHaken : "";

  const erfassen = () =>
    starte(async () => {
      const fd = new FormData();
      fd.set("karte", karte);
      fd.set("kanal", kanal);
      fd.set("datenschutz", haken ? "1" : "0");
      if (kanal === "Unterschrift Tablet") fd.set("kundenmodus", km?.id || "");
      else if (datei) fd.set("datei", datei);
      const r = await einwilligungErfassenAction(fd);
      if (!r?.ok) return setFehler({ [r?.feld || "allgemein"]: r?.message || T.fehler.allgemein });
      onFertig?.(r);
    });

  const anKundin = () =>
    starte(async () => {
      const r = await kundenmodusStartenAction({ karte, zweck: "einwilligung" });
      if (!r?.ok) return setFehler({ allgemein: r?.message || T.fehler.allgemein });
      router.push(`${r.href}?zurueck=${encodeURIComponent(`/kundenkarte/karten/${karte}?tab=details&kundenmodus=${r.sitzung}`)}`);
    });

  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.einwilligung.titel}
      text={name}
      groesse="md"
      sperren={laeuft}
      testid="kk-einwilligung"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" laedt={laeuft} disabled={Boolean(fehlt)} grund={fehlt || undefined} onClick={erfassen} data-testid="kk-einwilligung-erfassen-knopf">
            {T.einwilligung.knopf}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-bo-surface-2 px-4 py-3">
          <p className="bo-kk-label">{T.einwilligung.text}</p>
          <p className="bo-kk-mono text-[13px]">{EINWILLIGUNG_TEXTVERSION}</p>
          <button type="button" className="mt-1 inline-flex items-center gap-1 text-[13px] text-bo-text-soft" aria-expanded={textOffen} onClick={() => setTextOffen((x) => !x)}>
            <Icon name={textOffen ? "ChevronDown" : "ChevronRight"} className="size-3.5" />
            {T.einwilligung.zeigen}
          </button>
          {textOffen && <p className="mt-2 text-[14px] leading-6">{EINWILLIGUNG_TEXT}</p>}
        </div>
        <ChipWahl label={T.einwilligung.wie} optionen={EINWILLIGUNG_KANAELE.map((k) => ({ wert: k.wert, label: k.label }))} wert={kanal} onWert={setKanal} name="kanal" />
        {kanal === "Unterschrift Tablet" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
            {km?.bestaetigt ? (
              <p className="flex items-center gap-2 text-[14px] text-bo-salbei-text">
                <Icon name="CircleCheck" className="size-4" />
                Bestätigt im Kundenmodus
              </p>
            ) : (
              <>
                <p className="flex-1 text-[14px] text-bo-text-soft">{km ? "Wartet auf die Bestätigung der Kundin …" : "Die Kundin bestätigt am iPad."}</p>
                <Knopf icon="Eye" onClick={anKundin} laedt={laeuft} data-testid="kk-an-kundin">
                  {T.einwilligung.anKundin}
                </Knopf>
              </>
            )}
          </div>
        ) : (
          <NachweisAufnahme datei={datei} onDatei={setDatei} fehler={fehler.nachweis} />
        )}
        <label className="bo-kk-haken">
          <input type="checkbox" checked={haken} onChange={(e) => setHaken(e.target.checked)} data-testid="kk-datenschutz-haken" />
          {T.einwilligung.datenschutz(DATENSCHUTZINFO_VERSION)}
        </label>
        {(fehler.allgemein || fehler.datenschutz) && (
          <p className="bo-kk-fehler" role="alert">
            {fehler.allgemein || fehler.datenschutz}
          </p>
        )}
      </div>
    </Dialog>
  );
}
