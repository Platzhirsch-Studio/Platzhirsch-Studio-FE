"use client";
// Kassa – Bargeld einlegen/entnehmen (Team B-KAS, Konzept §3.7, A12: 4 Tipps). Eine Zahl „Bargeld in der Lade“
// (Fach-Formel), Segment Einlegen/Entnehmen (zuletzt genutzt vorgewählt), Betrag über die Zahlentasten
// (Komma-Modell), Zweck als Chips, bei „Ausgabe“ Wofür + Projekt (Projektfeld als Fähigkeit – bis dahin im
// Grund vermerkt). Knopf mit Betrag; Rückgängig 6 s, erst danach wird gebucht und die Lade geöffnet.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Delete, Lock, TriangleAlert } from "lucide-react";
import KioskShell from "../Kiosk/KioskShell";
import { useToast } from "../Toast";
import Segment from "../Segment";
import { tasteAnwenden, textZuWert, anzeigeText } from "../Eingabe/betrag";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { pruefeBuchung, zweckeFuer, zweck as zweckVon } from "@/lib/backoffice/kassa/bargeld";
import { KIOSK } from "@/lib/backoffice/kassa/texte";
import { bargeldAction, ladeOeffnenAction } from "@/lib/backoffice/kassa/actions";
import "./kassa.css";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const UNDO_MS = 6000;

export default function BargeldKiosk({ kontext, buchungen, projekte, faehig, benutzer, tagesstart }) {
  return (
    <KioskShell titel={kontext.kasse_doc?.bezeichnung || KIOSK.titel} geraet={{ name: kontext.kasse_doc?.standort || "" }} benutzer={benutzer} kontext={KIOSK.bargeldSeite.titel} zurueckHref="/kassa" hilfe={[]}>
      <Inhalt kontext={kontext} buchungen={buchungen} projekte={projekte} faehig={faehig} tagesstart={tagesstart} />
    </KioskShell>
  );
}

function Inhalt({ kontext, buchungen: start, projekte, faehig, tagesstart }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [art, setArt] = useState("Entnahme");
  const [text, setText] = useState("");
  const [zweck, setZweck] = useState(null);
  const [grund, setGrund] = useState("");
  const [projekt, setProjekt] = useState("");
  const [bestand, setBestand] = useState(kontext.bargeld_bestand_cent);
  const [buchungen, setBuchungen] = useState(start);
  const [laeuft, setLaeuft] = useState(false);
  const ausstehend = useRef(null);
  const betrag = textZuWert(text) || 0;
  const zwecke = zweckeFuer(art);
  const p = pruefeBuchung({ art, betragCent: betrag, zweckId: zweck, grund, bestandCent: bestand, stoppAbBestand: false });
  const z = zweckVon(zweck);

  // Zuletzt genutzte Art vorwählen (A12) – nach dem Einhängen, damit Server und Browser gleich rendern.
  useEffect(() => {
    try {
      const alt = window.localStorage.getItem("ph-kassa-bargeld-art");
      if (alt === "Einlage" || alt === "Entnahme") setArt(alt); // eslint-disable-line react-hooks/set-state-in-effect -- Speicher erst nach dem Einhängen lesbar
    } catch {
      // nur Komfort
    }
  }, []);
  const artWechsel = (a) => {
    setArt(a);
    setZweck(null);
    try {
      window.localStorage.setItem("ph-kassa-bargeld-art", a);
    } catch {
      // nur Komfort
    }
  };

  // Ausstehende Buchung beim Verlassen sofort ausführen (nie still verwerfen).
  useEffect(() => {
    const jetzt = () => ausstehend.current?.sofort();
    window.addEventListener("pagehide", jetzt);
    return () => {
      window.removeEventListener("pagehide", jetzt);
      jetzt();
    };
  }, []);

  const taste = (t) => setText((x) => (t === "×" ? "" : tasteAnwenden(x, t)));
  useEffect(() => {
    const h = (e) => {
      if (e.target?.closest?.("input, textarea")) return;
      if (/^\d$/.test(e.key) || e.key === ",") {
        e.preventDefault();
        taste(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        taste("⌫");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const buchen = () => {
    if (p.fehler || laeuft) return;
    const daten = { kasse: kontext.kasse, art, betragCent: betrag, zweckId: zweck, grund, projekt };
    const vorher = bestand;
    const neu = art === "Einlage" ? bestand + betrag : bestand - betrag;
    setBestand(neu);
    setText("");
    setGrund("");
    setProjekt("");
    const id = setTimeout(() => ausfuehren(), UNDO_MS);
    let fertig = false;
    const ausfuehren = async () => {
      if (fertig) return;
      fertig = true;
      clearTimeout(id);
      ausstehend.current = null;
      setLaeuft(true);
      const r = await bargeldAction(daten);
      setLaeuft(false);
      if (!r.ok) {
        setBestand(vorher);
        zeige(r.message, { art: "fehler" });
        return;
      }
      setBestand(r.daten.bestand_danach_cent ?? neu);
      setBuchungen((b) => [{ name: r.daten.name, art, betrag_cent: betrag, grund: `${z?.titel || ""}${grund ? `: ${grund}` : ""}`, zeitpunkt: new Date().toTimeString().slice(0, 5) }, ...b]);
      ladeOeffnenAction({ kasse: kontext.kasse, grund: z?.titel || art });
    };
    ausstehend.current = { sofort: ausfuehren };
    zeige(KIOSK.bargeldSeite.gebucht(art, euro(betrag)), {
      art: "ok",
      dauer: UNDO_MS,
      aktion: {
        titel: "Rückgängig",
        onClick: () => {
          if (fertig) return;
          fertig = true;
          clearTimeout(id);
          ausstehend.current = null;
          setBestand(vorher);
        },
      },
    });
  };

  return (
    <div className="bo-ka bo-ka-seite" data-testid="kassa-bargeld" style={{ maxWidth: 1120 }}>
      {tagesstart && (
        <div className="bo-ka-band" data-ton="warnung">
          <Lock {...S} />
          <span>Anderer Wechselgeld-Betrag: die Leitung bucht die Korrektur als Einlage oder Entnahme mit Zweck „Wechselgeld“.</span>
        </div>
      )}
      <div className="bo-ka-zwei">
        <section className="bo-ka-kachel flex flex-col gap-4">
          <div>
            <p className="bo-ka-muted text-[13px]">{KIOSK.bargeldSeite.inDerLade}</p>
            <p className="bo-ka-zahlgross" data-testid="bargeld-bestand">{euro(bestand)}</p>
            {!faehig.kassenbuch_barbelege?.an && <p className="bo-ka-grund">{KIOSK.bargeldSeite.unsicher}</p>}
          </div>
          <Segment
            label="Art"
            breit
            wert={art}
            onWechsel={artWechsel}
            optionen={[
              { wert: "Entnahme", titel: KIOSK.bargeldSeite.entnehmen, icon: "ArrowUp", testid: "bargeld-entnehmen" },
              { wert: "Einlage", titel: KIOSK.bargeldSeite.einlegen, icon: "ArrowDown", testid: "bargeld-einlegen" },
            ]}
          />
          <div>
            <p className="bo-ka-label">{KIOSK.bargeldSeite.zweck}</p>
            <div className="bo-ka-chips" role="radiogroup" aria-label={KIOSK.bargeldSeite.zweck}>
              {zwecke.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={zweck === x.id} className="bo-ka-chip" onClick={() => setZweck(x.id)} data-testid="bargeld-zweck">
                  {x.titel}
                </button>
              ))}
            </div>
          </div>
          {z?.id === "ausgabe" && (
            <div className="grid gap-3" data-scan="nein">
              <label>
                <span className="bo-ka-label">{KIOSK.bargeldSeite.grund}</span>
                <input className="bo-ka-eingabe" data-scan="nein" value={grund} onChange={(e) => setGrund(e.target.value)} placeholder={KIOSK.bargeldSeite.grundPlatzhalter} data-testid="bargeld-grund" />
              </label>
              <label>
                <span className="bo-ka-label">{KIOSK.bargeldSeite.projekt}</span>
                <select className="bo-ka-eingabe" value={projekt} onChange={(e) => setProjekt(e.target.value)} data-testid="bargeld-projekt">
                  <option value="">{KIOSK.bargeldSeite.projektKein}</option>
                  {projekte.map((x) => (
                    <option key={x.name} value={x.name}>
                      {x.name} · {x.titel}
                    </option>
                  ))}
                </select>
              </label>
              {!faehig.kassenbuch_projekt?.an && <p className="bo-ka-grund">{KIOSK.bargeldSeite.projektHinweis}</p>}
            </div>
          )}
        </section>

        <aside className="bo-ka-korb">
          <div className="bo-ka-feld" data-scan="nein">
            <span>
              <span className="bo-ka-feld__label block">{KIOSK.bargeldSeite.betrag}</span>
              <output className="bo-ka-feld__wert" data-testid="bargeld-betrag">{text ? `${anzeigeText(text)} €` : "0,00 €"}</output>
            </span>
          </div>
          <div className="bo-ka-tasten" role="group" aria-label="Zahlen">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"].map((k) => (
              <button key={k} type="button" onClick={() => taste(k)} aria-label={k === "⌫" ? "Ziffer löschen" : k === "," ? "Komma" : k}>
                {k === "⌫" ? <Delete {...S} /> : k}
              </button>
            ))}
          </div>
          {p.warnung === "ueberBestand" && (
            <p className="bo-ka-hinweis" data-ton="warnung">
              <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
              {KIOSK.bargeldSeite.ueberBestand}
            </p>
          )}
          <div className="flex-1" />
          <button type="button" className="bo-ka-pay" disabled={!!p.fehler || laeuft} onClick={buchen} data-testid="bargeld-buchen">
            <span className="inline-flex items-center gap-2">{art === "Einlage" ? <ArrowDownToLine {...S} /> : <ArrowUpFromLine {...S} />}{art === "Einlage" ? KIOSK.bargeldSeite.einlegen : KIOSK.bargeldSeite.entnehmen}</span>
            <span className="bo-ka-num">{euro(betrag)}</span>
          </button>
        </aside>
      </div>

      <section className="bo-ka-kachel">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="flex-1">{KIOSK.bargeldSeite.heute}</h2>
          <button type="button" className="bo-ka-zweit" onClick={async () => {
            const r = await ladeOeffnenAction({ kasse: kontext.kasse, grund: KIOSK.bargeldSeite.ladeGrund });
            zeige(r.ok ? KIOSK.bargeldSeite.ladeGeoeffnet : r.message, { art: r.ok ? "ok" : "fehler" });
          }}>
            {KIOSK.bargeldSeite.ladeOeffnen}
          </button>
          <button type="button" className="bo-ka-zweit bo-ka-zweit--rand" onClick={() => router.push("/kassa")}>{KIOSK.titel}</button>
        </div>
        {buchungen.length === 0 ? (
          <p className="bo-ka-muted text-[15px] py-4">{KIOSK.bargeldSeite.leer}</p>
        ) : (
          <div className="bo-ka-tabelle">
            {buchungen.map((b) => (
              <div key={b.name} className="bo-ka-tzeile" style={{ gridTemplateColumns: "72px minmax(0,1fr) auto" }}>
                <span className="bo-ka-tzeile__zeit">{String(b.zeitpunkt).slice(-8, -3) || b.zeitpunkt}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{b.art === "Bareinnahme" ? "Bareinnahme" : b.art === "Barausgabe" ? "Barausgabe" : b.art}</span>
                  <span className="block truncate bo-ka-muted text-[13px]">{b.grund}</span>
                </span>
                <span className="bo-ka-num font-semibold">{euro(["Entnahme", "Barausgabe"].includes(b.art) ? -b.betrag_cent : b.betrag_cent)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
