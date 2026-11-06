"use client";
// FreigabeEintrag (G-15, Q-C7): Antragsteller, Objekt-Chip, Betrag, Grund; „Freigeben“ (geldwirksam →
// Bestätigen-Dialog mit Betrag und Folge) und „Ablehnen“ (Pflichtgrund im Eintrag, Senden erst nach
// 8 s mit Rückgängig; verlässt man die Seite, wird die Ablehnung gesendet, Q-C4). Eigener Antrag →
// beide Knöpfe gesperrt mit dem Satz „Eigener Antrag – zweite Person nötig“.
// Eintrag kommt aus lib/backoffice/freigaben (normalisiereEintrag) – serialisierbar.

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import Avatar from "../Avatar";
import Knopf from "../Knopf";
import Bestaetigen from "../Bestaetigen";
import { Icon } from "../icons";
import { cent, relativ } from "@/lib/backoffice/format";
import { ABLEHNEN_VERZOEGERUNG_MS, pruefeGrund } from "@/lib/backoffice/freigaben/index";
import { ablehnenAction, freigebenAction } from "./aktionen";
import { TEXTE } from "./texte";

/**
 * @param {{eintrag:object, onErledigt?:(id:string, ergebnis:"freigegeben"|"abgelehnt")=>void, demo?:boolean}} props
 * `demo`: Aktionen laufen nicht zum Server (Baustein-Demo).
 */
export default function FreigabeEintrag({ eintrag, onErledigt, demo = false }) {
  const [bestaetigen, setBestaetigen] = useState(false);
  const [ablehnen, setAblehnen] = useState(false);
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState("");
  const [rest, setRest] = useState(0);
  const [laeuft, starte] = useTransition();
  const ausstehend = useRef(null);
  const grundId = useId();
  const satzId = useId();
  const betrag = eintrag.betragCent !== null && eintrag.betragCent !== undefined ? cent(eintrag.betragCent) : null;

  const sendeAblehnung = (g) => {
    ausstehend.current = null;
    if (demo) return onErledigt?.(eintrag.id, "abgelehnt");
    return ablehnenAction({ art: eintrag.freigabeArt, name: eintrag.name, grund: g }).then((r) => {
      if (r?.ok) onErledigt?.(eintrag.id, "abgelehnt");
      else setFehler(r?.message || TEXTE.glockeFehler);
    });
  };

  // Countdown des verzögerten Sendens (8 s); beim Verlassen sofort ausführen statt verwerfen.
  useEffect(() => {
    if (!rest) return undefined;
    const t = setTimeout(() => {
      if (rest <= 1) sendeAblehnung(ausstehend.current);
      else setRest(rest - 1);
    }, 1000);
    return () => clearTimeout(t);
  });
  useEffect(
    () => () => {
      if (ausstehend.current) sendeAblehnung(ausstehend.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const freigeben = () => {
    setFehler("");
    starte(async () => {
      if (demo) {
        onErledigt?.(eintrag.id, "freigegeben");
        return;
      }
      const r = await freigebenAction({ art: eintrag.freigabeArt, name: eintrag.name, token: eintrag.token });
      if (r?.ok) onErledigt?.(eintrag.id, "freigegeben");
      else setFehler(r?.message || TEXTE.glockeFehler);
    });
  };

  const ablehnenSenden = (e) => {
    e.preventDefault();
    const f = pruefeGrund(grund);
    if (f) return setFehler(f);
    setFehler("");
    ausstehend.current = grund.trim();
    setRest(Math.round(ABLEHNEN_VERZOEGERUNG_MS / 1000));
  };

  const rueckgaengig = () => {
    ausstehend.current = null;
    setRest(0);
  };

  return (
    <article className="bo-schale-freigabe" aria-label={`${eintrag.titel}${betrag ? `, ${betrag}` : ""}`} data-testid="freigabe-eintrag">
      <div className="bo-schale-freigabe__kopf">
        {eintrag.antragsteller ? <Avatar name={eintrag.antragsteller.name} groesse={36} dekorativ /> : <span className="bo-schale-symbol" aria-hidden="true"><Icon name="BadgeCheck" className="size-4" /></span>}
        <div className="min-w-0 flex-1">
          <p className="bo-schale-freigabe__titel">{eintrag.titel}</p>
          <p className="bo-schale-klein">
            {eintrag.antragsteller ? TEXTE.antragVon(eintrag.antragsteller.name) : eintrag.hinweis}
            {eintrag.zeit ? ` · ${relativ(eintrag.zeit)}` : ""}
          </p>
        </div>
        {betrag && <p className="bo-schale-freigabe__betrag">{betrag}</p>}
      </div>
      {(eintrag.objekt || eintrag.grund) && (
        <div className="bo-schale-freigabe__inhalt">
          {eintrag.objekt && (
            <Link href={eintrag.objekt.href} className="bo-schale-chip">
              <Icon name="FileText" className="size-3.5" />
              {eintrag.objekt.titel}
            </Link>
          )}
          {eintrag.grund && <p className="bo-schale-freigabe__grund">{eintrag.grund}</p>}
        </div>
      )}

      {rest > 0 ? (
        <div className="bo-schale-freigabe__warte" role="status">
          <span>{TEXTE.ablehnWird(rest)}</span>
          <Knopf size="s" variant="secondary" onClick={rueckgaengig}>
            {TEXTE.rueckgaengig}
          </Knopf>
        </div>
      ) : ablehnen ? (
        <form className="bo-schale-freigabe__ablehnen" onSubmit={ablehnenSenden}>
          <label htmlFor={grundId} className="bo-schale-klein">
            {TEXTE.ablehnGrund}
          </label>
          <textarea id={grundId} className="bo-input min-h-20" value={grund} onChange={(e) => setGrund(e.target.value)} required aria-invalid={fehler ? "true" : undefined} aria-describedby={satzId} maxLength={500} data-autofokus="" />
          <p id={satzId} className="bo-schale-klein">{TEXTE.ablehnGrundHinweis}</p>
          <div className="bo-schale-freigabe__knoepfe">
            <Knopf size="s" variant="ghost" onClick={() => setAblehnen(false)}>
              {TEXTE.abbrechen}
            </Knopf>
            <Knopf size="s" variant="danger" type="submit">
              {TEXTE.ablehnSenden}
            </Knopf>
          </div>
        </form>
      ) : (
        <div className="bo-schale-freigabe__knoepfe">
          <Knopf size="s" variant="secondary" disabled={eintrag.eigen || laeuft} onClick={() => setAblehnen(true)} aria-describedby={eintrag.eigen ? satzId : undefined}>
            {TEXTE.ablehnen}
          </Knopf>
          <Knopf size="s" variant="primary" laedt={laeuft} disabled={eintrag.eigen} onClick={() => (eintrag.geldwirksam ? setBestaetigen(true) : freigeben())} aria-describedby={eintrag.eigen ? satzId : undefined}>
            {TEXTE.freigeben}
          </Knopf>
        </div>
      )}
      {eintrag.eigen && (
        <p id={satzId} className="bo-schale-klein bo-schale-freigabe__eigen">
          <Icon name="Lock" className="size-3.5" /> {TEXTE.eigenerAntrag}
        </p>
      )}
      {fehler && (
        <p role="alert" className="bo-schale-fehler">
          {fehler}
        </p>
      )}
      {eintrag.geldwirksam && (
        <Bestaetigen
          offen={bestaetigen}
          titel={TEXTE.freigabeFrage(eintrag.titel, betrag)}
          text={eintrag.folge || TEXTE.freigabeFolgeStandard}
          bestaetigen={TEXTE.freigeben}
          abbrechen={TEXTE.abbrechen}
          laeuft={laeuft}
          onAbbrechen={() => setBestaetigen(false)}
          onBestaetigen={() => {
            setBestaetigen(false);
            freigeben();
          }}
        />
      )}
    </article>
  );
}
