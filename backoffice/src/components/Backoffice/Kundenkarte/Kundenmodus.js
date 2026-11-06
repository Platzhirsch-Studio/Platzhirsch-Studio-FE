"use client";
// Kundenmodus (Konzept §3.12): Vollbild ohne Leiste/Palette/Kürzel, Sie-Form, 18 px, Schalter 44 px, voller
// Einwilligungstext mit Version, Unterschrift mit dem Finger. Rückkehr nur über Langdruck (800 ms) auf die
// Wortmarke + PIN der Beraterin; Zurück-Geste bleibt im Modus; nach 2 min ohne Eingabe → PIN-Abfrage.

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import { Dialog } from "../Overlay";
import Unterschrift from "../Eingabe/Unterschrift";
import { kundenmodusBeendenAction } from "../Shell/aktionen";
import { kundenmodusBestaetigenAction } from "@/lib/backoffice/kundenkarte/actions";
import { DATENSCHUTZINFO_VERSION, EINWILLIGUNG_TEXT, EINWILLIGUNG_TEXTVERSION, T } from "@/lib/backoffice/kundenkarte/texte";

const LANGDRUCK = 800;
const IDLE = 2 * 60 * 1000;

export default function Kundenmodus({ sitzung, name = "", zweck = "einwilligung", zurueck = "/kundenkarte", bestaetigt: bestaetigtStart = null, schalter: schalterStart = {} }) {
  const router = useRouter();
  const [schalter, setSchalter] = useState({ auswertung: zweck === "einwilligung" ? true : Boolean(schalterStart.auswertung), newsletter: Boolean(schalterStart.newsletter) });
  const [bestaetigt, setBestaetigt] = useState(bestaetigtStart);
  const [drueckt, setDrueckt] = useState(false);
  const [pinOffen, setPinOffen] = useState(false);
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const timer = useRef(null);
  const idle = useRef(null);

  // Zurück-Geste abfangen, Idle-Zeit überwachen
  useEffect(() => {
    window.history.pushState({ kundenmodus: true }, "");
    const pop = () => window.history.pushState({ kundenmodus: true }, "");
    window.addEventListener("popstate", pop);
    const neu = () => {
      clearTimeout(idle.current);
      idle.current = setTimeout(() => setPinOffen(true), IDLE);
    };
    neu();
    for (const e of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(e, neu, { passive: true });
    document.documentElement.setAttribute("data-bo-kundenmodus", "an");
    return () => {
      window.removeEventListener("popstate", pop);
      for (const e of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(e, neu);
      clearTimeout(idle.current);
      document.documentElement.removeAttribute("data-bo-kundenmodus");
    };
  }, []);

  const start = () => {
    clearTimeout(timer.current);
    setDrueckt(true);
    timer.current = setTimeout(() => {
      setDrueckt(false);
      setPinOffen(true);
    }, LANGDRUCK);
  };
  const stopp = () => {
    clearTimeout(timer.current);
    setDrueckt(false);
  };
  const pruefen = (e) => {
    e.preventDefault();
    setFehler("");
    starte(async () => {
      const r = await kundenmodusBeendenAction({ pin });
      if (r?.ok) {
        setPinOffen(false);
        router.push(zurueck);
      } else setFehler(r?.message || "PIN stimmt nicht.");
    });
  };

  return (
    <main className="bo-kk-km" data-testid="kk-kundenmodus">
      <div className="bo-kk-km__innen">
        <button
          type="button"
          className="bo-kk-km__marke bo-wortmarke"
          data-drueckt={drueckt ? "" : undefined}
          aria-label={T.kundenmodus.rueckkehr}
          onPointerDown={start}
          onPointerUp={stopp}
          onPointerLeave={stopp}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && start()}
          onKeyUp={stopp}
          data-testid="kk-km-marke"
        >
          <span className="bo-kk-km__ring" aria-hidden="true" />
          PLATZHIRSCH
        </button>
        <header className="text-center">
          <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.022em]">{T.kundenmodus.titel}</h1>
          {name && <p className="mt-1 text-bo-text-soft">{name}</p>}
          <p className="mt-3 text-bo-text-soft">{T.kundenmodus.einleitung}</p>
        </header>

        {bestaetigt ? (
          <section className="bo-kachel items-center text-center" data-testid="kk-km-danke">
            <p className="text-[22px] font-semibold">{T.kundenmodus.bestaetigt}</p>
            <p className="mt-2 text-[15px] text-bo-text-soft">Bestätigt um {new Date(bestaetigt).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</p>
          </section>
        ) : (
          <>
            <section className="bo-kachel" aria-labelledby="kk-km-text">
              <h2 id="kk-km-text" className="text-[20px] font-semibold">
                Auswertung Ihrer Einkäufe
              </h2>
              <p className="mt-3">{EINWILLIGUNG_TEXT}</p>
              <p className="mt-2 text-[14px] text-bo-text-soft">
                Text {EINWILLIGUNG_TEXTVERSION} · Datenschutzinformation {DATENSCHUTZINFO_VERSION}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Schalter label="Ja, meine Einkäufe dürfen für die Stufe ausgewertet werden" an={schalter.auswertung} onWechsel={(a) => setSchalter((x) => ({ ...x, auswertung: a }))} testid="kk-km-auswertung" />
                {zweck === "neu" && <Schalter label="Ja, ich möchte den Newsletter erhalten (Bestätigung per E-Mail)" an={schalter.newsletter} onWechsel={(a) => setSchalter((x) => ({ ...x, newsletter: a }))} />}
              </div>
            </section>
            <section className="bo-kachel" aria-labelledby="kk-km-unterschrift">
              <h2 id="kk-km-unterschrift" className="mb-3 text-[20px] font-semibold">
                {T.kundenmodus.unterschrift}
              </h2>
              <Unterschrift
                erklaerung="Ich habe den Text gelesen und bestätige meine Auswahl."
                name={name}
                disabled={!schalter.auswertung && zweck === "einwilligung"}
                aktion={async (ergebnis) => {
                  const r = await kundenmodusBestaetigenAction({ sitzung, schalter, unterschrift: { pruefwert: ergebnis.pruefwert } });
                  if (r?.ok) setBestaetigt(r.zeit);
                  return r?.ok ? { ok: true } : { ok: false, fehler: r?.message };
                }}
                testid="kk-km-unterschrift-feld"
              />
            </section>
          </>
        )}
        <Knopf size="l" variant={bestaetigt ? "primary" : "secondary"} className="self-center" onClick={() => setPinOffen(true)} data-testid="kk-km-fertig">
          {T.kundenmodus.fertig}
        </Knopf>
      </div>
      <Dialog offen={pinOffen} onSchliessen={() => setPinOffen(false)} titel="PIN der Beratung" text="Nur die Beraterin oder der Berater beendet den Kundenmodus." groesse="sm" testid="kk-km-pin">
        <form onSubmit={pruefen} className="flex flex-col gap-3">
          <label htmlFor="kk-km-pin-feld" className="bo-kk-label">
            PIN
          </label>
          <input id="kk-km-pin-feld" className="bo-kk-feld text-center text-[22px] tracking-[0.4em]" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          {fehler && <p className="bo-kk-fehler">{fehler}</p>}
          <Knopf type="submit" variant="primary" laedt={laeuft} disabled={pin.length < 4}>
            Zur Beratung zurück
          </Knopf>
        </form>
      </Dialog>
    </main>
  );
}
