"use client";
// Hilfe-Panel (G-26, K-24): runder Knopf zwischen Glocke und Benutzer, Taste „?“. Sheet 480 px rechts
// (Telefon: von unten mit Griff) mit dem Artikel der Seite (backoffice/hilfe/**), „Was kann ich hier tun?“
// (Unterbereiche und Aktionen des Bereichs nach Rechten) und den Kürzeln der Seite.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Sheet from "../Overlay/Sheet";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { anzeige } from "@/lib/backoffice/labels";
import { oeffneKuerzelDialog, useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import HilfeArtikel from "./HilfeArtikel";
import { TEXTE } from "./texte";

export const HILFE_EREIGNIS = "ph-bo:hilfe";

/** Hilfe-Panel öffnen (z. B. aus dem Erstbesuch-Band „Mehr“). */
export function oeffneHilfe() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(HILFE_EREIGNIS));
}

export default function HilfePanel({ aus = false }) {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const [daten, setDaten] = useState(null);
  const [fehler, setFehler] = useState(false);

  const laden = useCallback(async () => {
    setFehler(false);
    try {
      const r = await fetch(`/hilfe/inhalt?pfad=${encodeURIComponent(pfad || "/")}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      setDaten({ pfad, ...(await r.json()) });
    } catch {
      setFehler(true);
    }
  }, [pfad]);

  const oeffnen = useCallback(() => {
    if (aus) return;
    setOffen(true);
    if (daten?.pfad !== pfad) laden();
  }, [aus, daten?.pfad, pfad, laden]);

  useKuerzel("global", { "global.hilfe": () => (offen ? setOffen(false) : oeffnen()) }, { aktiv: !aus });
  useEffect(() => {
    window.addEventListener(HILFE_EREIGNIS, oeffnen);
    return () => window.removeEventListener(HILFE_EREIGNIS, oeffnen);
  }, [oeffnen]);

  const geladen = daten && daten.pfad === pfad;
  return (
    <>
      <button type="button" className="bo-rund bo-tip bo-ziel bo-schale-werkzeug" aria-label={TEXTE.hilfe} data-tip={`${TEXTE.hilfe} · ?`} aria-keyshortcuts="?" onClick={oeffnen} data-testid="hilfe-oeffnen" aria-haspopup="dialog" aria-expanded={offen}>
        <Icon name="LifeBuoy" className="size-5" />
      </button>
      <Sheet
        offen={offen}
        onSchliessen={() => setOffen(false)}
        titel={geladen && daten.artikel ? daten.artikel.titel : TEXTE.hilfeTitel}
        unter={geladen && daten.wasTun?.titel ? daten.wasTun.titel : undefined}
        groesse="md"
        testid="hilfe-panel"
        fuss={
          <Knopf href="/hilfe" variant="secondary" onClick={() => setOffen(false)}>
            {TEXTE.hilfeAlle}
          </Knopf>
        }
      >
        {!geladen && !fehler && <p className="bo-schale-leer">{TEXTE.hilfeLaedt}</p>}
        {fehler && <p className="bo-schale-leer">{TEXTE.hilfeFehler}</p>}
        {geladen && (
          <div className="bo-schale-hilfe">
            {daten.artikel ? (
              <HilfeArtikel bloecke={daten.artikel.bloecke} />
            ) : (
              <p className="bo-schale-hilfe__ohne">
                <span className="bo-schale-symbol" aria-hidden="true">
                  <Icon name="LifeBuoy" className="size-4" />
                </span>
                {TEXTE.hilfeKeinArtikel}
              </p>
            )}

            {(daten.wasTun?.seiten?.length > 0 || daten.wasTun?.aktionen?.length > 0) && (
              <section aria-labelledby="bo-hilfe-tun" className="bo-schale-hilfe__abschnitt">
                <h3 id="bo-hilfe-tun" className="bo-schale-gruppentitel">
                  {TEXTE.hilfeWasTun}
                </h3>
                <ul className="bo-schale-hilfe__karte">
                  {[...daten.wasTun.aktionen.map((a) => ({ ...a, icon: /^Neue?[rs]?\s/.test(a.titel) ? "Plus" : "ArrowRight" })), ...daten.wasTun.seiten.map((s) => ({ ...s, icon: "ArrowRight" }))].map((e) => (
                    <li key={`${e.href}-${e.titel}`}>
                      <Link href={e.href} className="bo-schale-zeile" onClick={() => setOffen(false)}>
                        <span className="bo-schale-symbol" aria-hidden="true">
                          <Icon name={e.icon} className="size-4" />
                        </span>
                        <span className="bo-schale-zeile__titel">{anzeige(e.titel)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {daten.kuerzel?.length > 0 && (
              <section aria-labelledby="bo-hilfe-kuerzel" className="bo-schale-hilfe__abschnitt">
                <h3 id="bo-hilfe-kuerzel" className="bo-schale-gruppentitel">
                  {TEXTE.hilfeKuerzel}
                </h3>
                <dl className="bo-schale-hilfe__kuerzel">
                  {daten.kuerzel.map((k) => (
                    <div key={`${k.taste}-${k.titel}`}>
                      <dt>{k.titel}</dt>
                      <dd>
                        <kbd className="bo-schale-kappe">{k.taste}</kbd>
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  className="bo-schale-textknopf"
                  onClick={() => {
                    setOffen(false);
                    oeffneKuerzelDialog();
                  }}
                >
                  {TEXTE.hilfeAlleKuerzel}
                </button>
              </section>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
