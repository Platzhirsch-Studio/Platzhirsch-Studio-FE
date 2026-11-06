"use client";
// G-05 `LeitungBitten` (Team P0-5c, Q-B11, Q-C11): Sekundärknopf „Leitung bitten“ → Mini-Dialog (sm) mit vorbelegtem
// Anliegen und optionalem Kommentar → PH Aufgabe an die Bereichsleitung mit Bezug zum Objekt. Danach Zustand
// „Angefragt bei Leitung · heute 09:14“ mit Link zur Aufgabe. Idempotent je Objekt/Aktion/Tag (Server prüft).
// Ohne Recht „Aufgabe anlegen“ rendert der Baustein nichts (keine Schein-Aktion) – `erlaubt` kommt vom Server:
//
//   // Server-Seite
//   import { darfLeitungBitten } from "@/components/Backoffice/Informieren/server";
//   const darfBitten = await darfLeitungBitten(session);
//   // im ⋯-Menü der Akte (Client)
//   <MenuePunkt deaktiviert grund="Nur Faktura-Leitung">Freigeben</MenuePunkt>
//   <LeitungBitten variante="menue" erlaubt={darfBitten} bereich="faktura" aktion="freigeben"
//     aktionTitel="Rechnung freigeben" objekt={{ doctype: "PH Rechnung", name, titel: name }} />
//   // als Knopf unter einem gesperrten Knopf
//   <LeitungBitten erlaubt={darfBitten} bereich="kundenkarte" aktion="kuendigen" aktionTitel="Karte kündigen" objekt={…} />

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import cx from "./cx";
import Knopf from "./Knopf";
import { Icon } from "./icons";
import { Dialog, MenuePunkt } from "./Overlay";
import { useToast } from "./Toast";
import { leitungBittenAction, leitungStatusAction } from "./Informieren/aktionen";
import { zeitKurz } from "./Informieren/logik";
import { LEITUNG_TEXTE as T } from "./Informieren/texte";

/**
 * @param {object} p
 * @param {boolean} p.erlaubt                 darf PH Aufgabe anlegen (Server: darfLeitungBitten) – sonst nichts
 * @param {string} p.bereich                  Slug („faktura“) – bestimmt die Leitung
 * @param {string} [p.bereichTitel]           Anzeige („Faktura“) → „Faktura-Leitung bitten“
 * @param {string} p.aktion                   Kennung der gesperrten Aktion („freigeben“)
 * @param {string} p.aktionTitel              Anzeige („Rechnung freigeben“)
 * @param {{doctype:string, name:string, titel?:string}} p.objekt
 * @param {{zeit:string, href?:string}|null} [p.angefragt]   bekannter Stand (sonst wird beim Öffnen geprüft)
 * @param {"knopf"|"menue"} [p.variante]
 * @param {"s"|"m"} [p.groesse]
 * @param {(r:{aufgabe:string, zeit:string, href:string}) => void} [p.onAngefragt]
 */
export default function LeitungBitten({ erlaubt, bereich, bereichTitel, aktion, aktionTitel, objekt, angefragt: angefragtStart = null, variante = "knopf", groesse = "s", onAngefragt, className, testid = "leitung-bitten" }) {
  const id = useId();
  const { zeige } = useToast();
  const [angefragt, setAngefragt] = useState(angefragtStart);
  const [offen, setOffen] = useState(false);
  const [kommentar, setKommentar] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [pruefe, setPruefe] = useState(false);
  const leitung = bereichTitel ? T.leitungVon(bereichTitel) : T.leitungAllgemein;
  const eingabe = { bereich, aktion, aktionTitel, objekt };

  if (!erlaubt || !objekt?.doctype || !objekt?.name) return null;

  // Vor dem Öffnen prüfen, ob heute schon gefragt wurde (zweiter Versuch → „Bereits angefragt …“ statt Dialog).
  const oeffnen = async () => {
    if (pruefe) return;
    setPruefe(true);
    try {
      const r = await leitungStatusAction(eingabe);
      if (r?.ok && r.angefragt) {
        setAngefragt(r.angefragt);
        zeige(T.bereits(zeitKurz(r.angefragt.zeit)), { art: "info" });
        return;
      }
      setOffen(true);
    } finally {
      setPruefe(false);
    }
  };

  const bitten = async () => {
    if (laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await leitungBittenAction({ ...eingabe, kommentar });
      if (!r?.ok) {
        setFehler(r?.message || T.fehler);
        return;
      }
      const stand = { aufgabe: r.aufgabe, zeit: r.zeit, href: r.href };
      setAngefragt(stand);
      setOffen(false);
      setKommentar("");
      zeige(r.bereits ? T.bereits(zeitKurz(r.zeit)) : T.gesendet(leitung), { art: r.bereits ? "info" : "ok", aktion: { titel: T.aufgabeOeffnen, onClick: () => window.location.assign(r.href) } });
      onAngefragt?.(stand);
    } finally {
      setLaeuft(false);
    }
  };

  const dialog = offen
    ? createPortal(
        <Dialog
          offen={offen}
          onSchliessen={() => setOffen(false)}
          titel={T.titel(leitung)}
          text={T.text}
          groesse="sm"
          sperren={laeuft}
          testid={`${testid}-dialog`}
          fuss={
            <>
              <Knopf variant="secondary" onClick={() => setOffen(false)} disabled={laeuft}>
                {T.abbrechen}
              </Knopf>
              <Knopf variant="primary" icon="UserCog" laedt={laeuft} onClick={bitten} data-testid={`${testid}-senden`}>
                {T.senden}
              </Knopf>
            </>
          }
        >
          <div className="grid gap-4 pt-4">
            <figure className="rounded-bo-karte bg-bo-surface-2 p-4">
              <figcaption className="text-[13px] leading-[18px] text-bo-text-soft">{T.anliegen}</figcaption>
              <blockquote className="mt-1.5 border-l-2 border-bo-cognac pl-3 text-[15px] leading-[22px]">{T.vorbelegt(aktionTitel, objekt.titel || objekt.name)}</blockquote>
            </figure>
            <div className="grid gap-1.5">
              <label htmlFor={`${id}-kommentar`} className="px-1 text-[13px] leading-[18px] font-medium text-bo-text-soft">
                {T.kommentar}
              </label>
              <textarea
                id={`${id}-kommentar`}
                rows={3}
                maxLength={2000}
                value={kommentar}
                placeholder={T.kommentarPlatzhalter}
                onChange={(e) => setKommentar(e.target.value)}
                className="bo-input resize-y rounded-bo-zeile border-transparent bg-bo-surface px-4 py-3 text-[15px] leading-[22px] shadow-(--bo-sh-card)"
                data-testid={`${testid}-kommentar`}
              />
            </div>
            {fehler && (
              <p role="alert" className="px-1 text-[13px] leading-[18px] text-bo-danger-text">
                {fehler}
              </p>
            )}
          </div>
        </Dialog>,
        document.body
      )
    : null;

  if (variante === "menue") {
    return (
      <>
        {angefragt ? (
          <MenuePunkt icon="CircleCheck" href={angefragt.href} testid={`${testid}-angefragt`}>
            {`${T.angefragt(zeitKurz(angefragt.zeit))} · ${T.aufgabeOeffnen}`}
          </MenuePunkt>
        ) : (
          <MenuePunkt icon="UserCog" onWaehlen={oeffnen} testid={testid}>
            {T.knopf}
          </MenuePunkt>
        )}
        {dialog}
      </>
    );
  }

  if (angefragt) {
    return (
      <p className={cx("inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px]", className)} data-testid={`${testid}-angefragt`}>
        <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-bo-salbei-soft text-bo-salbei-text" aria-hidden="true">
          <Icon name="Check" className="size-3.5" strokeWidth={2.25} />
        </span>
        <span className="text-bo-text-soft">{T.angefragt(zeitKurz(angefragt.zeit))}</span>
        {angefragt.href && (
          <Link href={angefragt.href} className="font-medium text-bo-text underline decoration-bo-line-strong underline-offset-[3px] hover:decoration-current">
            {T.aufgabeOeffnen}
          </Link>
        )}
      </p>
    );
  }

  return (
    <>
      <Knopf variant="secondary" size={groesse} icon="UserCog" laedt={pruefe} onClick={oeffnen} className={className} data-testid={testid}>
        {T.knopf}
      </Knopf>
      {dialog}
    </>
  );
}
