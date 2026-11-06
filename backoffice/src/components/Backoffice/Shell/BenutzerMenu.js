"use client";
// Benutzermenü v2 (G-26): eigener Avatar unten in der Leiste (Telefon: in der Tab-Kapsel) öffnet ein
// schwebendes Material-Panel – Name, Rollen; Arbeitsplätze (Ziffer 1–5, bei offenem Menü als Taste);
// Dieses Gerät; PIN ändern (Dialog, ph_core set_pin); Darstellung Hell · Dunkel · System; Dichte;
// Einzeltasten-Kürzel (iOS-Schalter); Tastenkürzel; Abmelden über POST /auth/microsoft/abmelden
// (beendet Backoffice + Frappe und bei Microsoft-Anmeldung auch die Microsoft-Sitzung).

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import Avatar from "../Avatar";
import Popover from "../Overlay/Popover";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import Segment, { useDichte } from "../Segment";
import { Icon } from "../icons";
import { rollenLabel } from "@/lib/backoffice/labels";
import { arbeitsplatzWaehlenAction } from "@/lib/backoffice/actions";
import { oeffneKuerzelDialog, useEinzeltasten } from "@/lib/backoffice/kuerzel/useKuerzel";
import { vorliebeSpeichernAction } from "@/lib/backoffice/auth/vorlieben-aktion";
import { pinSetzenAction } from "./aktionen";
import { ALS_VORLIEBE, useThema } from "./Thema";
import { TEXTE } from "./texte";

/**
 * @param {{name:string, user:string, roles:string[], arbeitsplaetze:Array<{slug:string,titel:string,icon:string,ziffer:number}>,
 *   arbeitsplatz:string, platzierung?:string, groesse?:number}} props
 */
export default function BenutzerMenu({ name, user, roles = [], arbeitsplaetze = [], arbeitsplatz, platzierung = "rechts-ende", groesse = 40 }) {
  const [offen, setOffen] = useState(false);
  const [pin, setPin] = useState(false);
  const [thema, setzeThemaLokal] = useThema();
  const [einzeltasten, setzeEinzeltastenLokal] = useEinzeltasten();
  const [dichte, setzeDichteLokal] = useDichte();
  // Sofort lokal umschalten, dann je Person merken (P0-8 Vorlieben; Fehler sind nicht störend – lokal gilt weiter).
  const merke = (patch) => vorliebeSpeichernAction(patch).catch(() => null);
  const setThema = (w) => {
    setzeThemaLokal(w);
    merke({ theme: ALS_VORLIEBE[w] });
  };
  const setDichte = (w) => {
    setzeDichteLokal(w);
    merke({ dichte: w });
  };
  const setEinzeltasten = (an) => {
    setzeEinzeltastenLokal(an);
    merke({ einzeltasten: !!an });
  };
  const anzeigeName = String(name || user || "").split(" (")[0];

  // Ziffern 1–5 wählen bei offenem Menü einen Arbeitsplatz (R-11, Kontext „arbeitsplatz“ im Register).
  useEffect(() => {
    if (!offen || arbeitsplaetze.length < 2) return undefined;
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(input|textarea|select)$/i.test(e.target?.tagName || "")) return;
      const ap = arbeitsplaetze.find((a) => String(a.ziffer) === e.key);
      if (!ap) return;
      e.preventDefault();
      document.getElementById(`bo-ap-${ap.slug}`)?.click();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [offen, arbeitsplaetze]);

  return (
    <>
      <Popover
        label={TEXTE.benutzermenu(anzeigeName)}
        platzierung={platzierung}
        breite={320}
        offen={offen}
        onOffen={setOffen}
        testid="benutzer-panel"
        ausloeser={(p) => (
          <button {...p} type="button" className="bo-schale-ich bo-ziel" aria-label={TEXTE.benutzermenu(anzeigeName)} data-testid="benutzer-menu">
            <Avatar name={anzeigeName || user} groesse={groesse} dekorativ />
          </button>
        )}
      >
        <div className="bo-schale-menu">
          <div className="bo-schale-menu__ich">
            <Avatar name={anzeigeName || user} groesse={44} ring={false} dekorativ />
            <div className="min-w-0">
              <p className="bo-schale-menu__name">{anzeigeName}</p>
              <p className="bo-schale-klein truncate">{user}</p>
            </div>
          </div>
          {roles.length > 0 && (
            <ul className="bo-schale-menu__rollen" aria-label={TEXTE.rollen}>
              {roles.map((r) => (
                <li key={r} className="bo-schale-chip bo-schale-chip--ruhig">
                  {rollenLabel(r)}
                </li>
              ))}
            </ul>
          )}

          {arbeitsplaetze.length > 1 && (
            <section className="bo-schale-menu__abschnitt" aria-label={TEXTE.arbeitsplatz}>
              <h3 className="bo-schale-gruppentitel">{TEXTE.arbeitsplatz}</h3>
              {arbeitsplaetze.map((a) => (
                <form key={a.slug} action={arbeitsplatzWaehlenAction}>
                  <input type="hidden" name="arbeitsplatz" value={a.slug} />
                  <button id={`bo-ap-${a.slug}`} type="submit" className="bo-schale-zeile bo-schale-zeile--knopf" aria-current={a.slug === arbeitsplatz ? "true" : undefined} aria-keyshortcuts={String(a.ziffer)}>
                    <span className="bo-schale-symbol" aria-hidden="true">
                      <Icon name={a.icon} className="size-4" />
                    </span>
                    <span className="bo-schale-zeile__titel flex-1">{a.titel}</span>
                    {a.slug === arbeitsplatz ? <span className="bo-schale-klein">{TEXTE.arbeitsplatzAktiv}</span> : <kbd className="bo-schale-kappe">{a.ziffer}</kbd>}
                  </button>
                </form>
              ))}
            </section>
          )}

          <section className="bo-schale-menu__abschnitt">
            <Link href="/geraet" className="bo-schale-zeile" onClick={() => setOffen(false)}>
              <span className="bo-schale-symbol" aria-hidden="true">
                <Icon name="Monitor" className="size-4" />
              </span>
              <span className="bo-schale-zeile__titel">{TEXTE.dieserGeraet}</span>
            </Link>
            <button
              type="button"
              className="bo-schale-zeile bo-schale-zeile--knopf"
              onClick={() => {
                setOffen(false);
                setPin(true);
              }}
              data-testid="pin-aendern"
            >
              <span className="bo-schale-symbol" aria-hidden="true">
                <Icon name="Lock" className="size-4" />
              </span>
              <span className="bo-schale-zeile__titel">{TEXTE.pinAendern}</span>
            </button>
            <button
              type="button"
              className="bo-schale-zeile bo-schale-zeile--knopf"
              onClick={() => {
                setOffen(false);
                oeffneKuerzelDialog();
              }}
            >
              <span className="bo-schale-symbol" aria-hidden="true">
                <Icon name="Keyboard" className="size-4" />
              </span>
              <span className="bo-schale-zeile__titel flex-1">{TEXTE.tastenkuerzel}</span>
              <kbd className="bo-schale-kappe">Strg /</kbd>
            </button>
          </section>

          <section className="bo-schale-menu__abschnitt bo-schale-menu__einstellungen">
            <h3 className="bo-schale-gruppentitel">{TEXTE.darstellung}</h3>
            <Segment
              label={TEXTE.darstellung}
              wert={thema}
              onWechsel={setThema}
              breit
              groesse="s"
              testid="thema-schalter"
              optionen={[
                { wert: "light", titel: TEXTE.thema.light, testid: "thema-hell" },
                { wert: "dark", titel: TEXTE.thema.dark, testid: "thema-dunkel" },
                { wert: "system", titel: TEXTE.thema.system, testid: "thema-system" },
              ]}
            />
            <h3 className="bo-schale-gruppentitel">{TEXTE.dichte}</h3>
            <Segment
              label={TEXTE.dichte}
              wert={dichte}
              onWechsel={setDichte}
              breit
              groesse="s"
              testid="dichte-schalter"
              optionen={[
                { wert: "auto", titel: TEXTE.dichteWerte.auto, testid: "dichte-auto" },
                { wert: "kompakt", titel: TEXTE.dichteWerte.kompakt, testid: "dichte-kompakt" },
                { wert: "komfortabel", titel: TEXTE.dichteWerte.komfortabel, testid: "dichte-komfortabel" },
              ]}
            />
            <Schalter label={TEXTE.einzeltasten} beschreibung={TEXTE.einzeltastenHinweis} an={einzeltasten} onWechsel={setEinzeltasten} groesse="s" testid="einzeltasten-schalter" />
          </section>

          <form method="post" action="/auth/microsoft/abmelden" className="bo-schale-menu__abschnitt">
            <button type="submit" className="bo-schale-zeile bo-schale-zeile--knopf" data-testid="abmelden">
              <span className="bo-schale-symbol" aria-hidden="true">
                <Icon name="LogOut" className="size-4" />
              </span>
              <span className="bo-schale-zeile__titel">{TEXTE.abmelden}</span>
            </button>
          </form>
        </div>
      </Popover>
      <PinDialog offen={pin} onSchliessen={() => setPin(false)} />
    </>
  );
}

function PinDialog({ offen, onSchliessen }) {
  const [zustand, senden, laeuft] = useActionState(pinSetzenAction, null);
  const id = useId();
  const fertig = zustand?.ok;
  useEffect(() => {
    if (!fertig) return undefined;
    const t = setTimeout(onSchliessen, 1200);
    return () => clearTimeout(t);
  }, [fertig, onSchliessen]);
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={TEXTE.pinTitel}
      text={TEXTE.pinText}
      sperren={laeuft}
      testid="pin-dialog"
    >
      <form action={senden} className="flex flex-col gap-3" id={`${id}-form`}>
        <label className="flex flex-col gap-1.5">
          <span className="bo-schale-klein">{TEXTE.pinNeu}</span>
          <input name="pin" type="password" inputMode="numeric" autoComplete="new-password" pattern="\d{4,6}" minLength={4} maxLength={6} required className="bo-input" data-autofokus="" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="bo-schale-klein">{TEXTE.pinWiederholen}</span>
          <input name="pin2" type="password" inputMode="numeric" autoComplete="new-password" pattern="\d{4,6}" minLength={4} maxLength={6} required className="bo-input" />
        </label>
        {zustand && !zustand.ok && (
          <p role="alert" className="bo-schale-fehler">
            {zustand.message}
          </p>
        )}
        {fertig && (
          <p role="status" className="bo-schale-ok">
            <Icon name="Check" className="size-4" /> {TEXTE.pinGespeichert}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Knopf variant="ghost" onClick={onSchliessen}>
            {TEXTE.abbrechen}
          </Knopf>
          <Knopf variant="primary" type="submit" laedt={laeuft}>
            {TEXTE.pinSpeichern}
          </Knopf>
        </div>
      </form>
    </Dialog>
  );
}
