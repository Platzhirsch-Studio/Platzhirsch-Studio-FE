"use client";
// Kopfzeile v2 (G-26, Lounge § 4/6): 88 hoch, sticky, durchscheinend; ab 8 px Scroll wird sie zu
// Material (blur 32, saturate 180 %, Haarlinie). Links Wortmarke (Bodoni, gesperrt) mit Unterzeile,
// Mitte Pillen-Reiter, rechts Kopfzeilen-Slot (z. B. Stempelpille, Kundenmodus-Knopf) und runde
// Knöpfe Suche · Glocke · Neu · Hilfe. Im Kundenmodus nur die Wortmarke (Langdruck = Rückkehr).

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import cx from "../cx";
import { useKundenmodus } from "../Kundenmodus/Kontext";
import BedienerRueckkehr from "../Kundenmodus/BedienerRueckkehr";
import Reiter from "./Reiter";
import Glocke from "./Glocke";
import NeuMenu from "./NeuMenu";
import HilfePanel from "./HilfePanel";
import { oeffnePalette } from "./Befehlspalette";
import { TEXTE } from "./texte";

function useGescrollt() {
  const [s, setS] = useState(false);
  useEffect(() => {
    const f = () => setS(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return s;
}

function Wortmarke() {
  return (
    <span className="bo-schale-marke">
      <span className="bo-schale-marke__wort bo-wortmarke">{TEXTE.marke}</span>
      <span className="bo-schale-marke__unter">{TEXTE.markeUnter}</span>
    </span>
  );
}

/**
 * @param {{bereiche:Array, glocke:object, neu:Array, slot?:React.ReactNode, aufgabenHref?:string|null}} props
 */
export default function Kopfzeile({ bereiche, glocke, neu, slot, aufgabenHref }) {
  const gescrollt = useGescrollt();
  const { an: kundenmodus } = useKundenmodus();
  return (
    <header className={cx("bo-schale-kopf", gescrollt && "is-gescrollt")} data-testid="kopfzeile">
      {kundenmodus ? (
        <BedienerRueckkehr>
          <Wortmarke />
        </BedienerRueckkehr>
      ) : (
        <Link href="/" className="bo-schale-kopf__marke" aria-label={TEXTE.markeLabel}>
          <span className="bo-schale-kopf__monogramm" aria-hidden="true">
            P
          </span>
          <Wortmarke />
        </Link>
      )}
      {!kundenmodus && <Reiter bereiche={bereiche} />}
      {!kundenmodus && (
        <div className="bo-schale-kopf__werkzeuge">
          {slot && <div className="bo-schale-kopf__slot">{slot}</div>}
          <button type="button" className="bo-rund bo-tip bo-ziel bo-schale-werkzeug" aria-label={`${TEXTE.suche} (${TEXTE.sucheKuerzel})`} data-tip={`${TEXTE.suche} · ${TEXTE.sucheKuerzel}`} aria-keyshortcuts="Control+K" onClick={() => oeffnePalette()} data-testid="palette-oeffnen">
            <Icon name="Search" className="size-5" />
          </button>
          <Glocke start={glocke} aufgabenHref={aufgabenHref} />
          <NeuMenu eintraege={neu} bereich={null} />
          <HilfePanel />
        </div>
      )}
    </header>
  );
}

