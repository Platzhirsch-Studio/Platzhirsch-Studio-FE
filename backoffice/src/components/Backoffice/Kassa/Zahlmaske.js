"use client";
// Kassa – Zahlmaske (Team B-KAS, Konzept §3.3, Lounge §7.4): ersetzt den Korb in der rechten Spalte.
// Ein Betragsmodell (Komma wie am Taschenrechner); „Gegeben“ mit dem Rest vorbelegt und markiert – die erste
// Ziffer überschreibt. Jeder Schnellbetrag bucht sofort. Karte startet das Terminal sofort; ab Start ist der Bon
// gesperrt, „Kartenzahlung abbrechen“ in voller Breite; nach „bezahlt“ führt nur Kassieren weiter.
// Gutschein: Code scannen/tippen → Restwert → einlösen; ein Rest wird mit Karte oder Bar bezahlt (Split).

import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, Check, ChevronLeft, CreditCard, Delete, Gift, Nfc, TriangleAlert, X } from "lucide-react";
import Segment from "../Segment";
import { useEingabesperre } from "../Kiosk/hooks";
import { anzeigeText, tasteAnwenden, textZuWert } from "../Eingabe/betrag";
import { euro, schnellbetraege } from "@/lib/backoffice/kassa/betraege";
import { zahlstand } from "@/lib/backoffice/kassa/bon";
import { KIOSK } from "@/lib/backoffice/kassa/texte";
import { gutscheinPruefenAction, terminalAbbruchAction, terminalSimulierenAction, terminalStartAction, terminalStatusAction } from "@/lib/backoffice/kassa/actions";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const ICON = { bar: Banknote, karte: CreditCard, gutschein: Gift };

/**
 * @param {object} p
 * @param {number} p.gesamt
 * @param {string} p.start            Zahlart beim Öffnen (bar|karte|gutschein)
 * @param {object} p.kontext          Kassa-Kontext (kasse, terminals, einstellungen)
 * @param {(zeilen:object[], opt?:{gegeben?:number}) => void} p.onBuchen
 * @param {() => void} p.onZurueck
 * @param {(stand:object) => void} p.onStand   Zustand für Display/Scan-Sperre
 * @param {boolean} p.bucht
 * @param {string|null} [p.scanGutschein] gescannter Gutschein-Code (von außen)
 */
export default function Zahlmaske({ gesamt, start = "bar", kontext, onBuchen, onZurueck, onStand, bucht, scanGutschein, zahlarten, ansagen, zeige }) {
  const [zeilen, setZeilen] = useState([]);
  const [art, setArt] = useState(start);
  const [gegeben, setGegeben] = useState({ text: "", markiert: true });
  const [karte, setKarte] = useState({ zustand: "aus" });
  const [gs, setGs] = useState({ code: "", pruefung: null, laedt: false });
  const pollRef = useRef(null);
  const terminal = kontext.terminals?.[0]?.reader_id || null;
  const testmodus = !!kontext.terminals?.[0]?.testmodus || !!kontext.einstellungen?.terminal_testmodus;

  const gedeckt = zeilen.reduce((a, z) => a + (z.art === "karte" && !z.bezahlt ? 0 : z.betrag_cent), 0);
  const offen = Math.max(0, gesamt - gedeckt);
  const gegebenCent = gegeben.text === "" ? offen : textZuWert(gegeben.text) ?? 0;
  const rueckgeld = art === "bar" ? Math.max(0, gegebenCent - offen) : 0;
  const stand = zahlstand(gesamt, art === "bar" && offen > 0 ? [...zeilen, { art: "bar", betrag_cent: offen, gegeben_cent: gegebenCent }] : zeilen);
  const sperrSchluessel = `${art}:${karte.zustand}:${zeilen.length}`;
  const gesperrt = useEingabesperre(sperrSchluessel, 300);
  const karteLaeuft = ["startet", "wartet"].includes(karte.zustand);
  const kannKassieren = !bucht && !karteLaeuft && (stand.fertig || (art === "bar" && offen > 0 && gegebenCent >= offen) || (offen === 0 && zeilen.length > 0));

  useEffect(() => {
    onStand?.({ art, karte: karte.zustand, gegeben: art === "bar" ? gegebenCent : null, rueckgeld, offen });
  }, [art, karte.zustand, gegebenCent, rueckgeld, offen, onStand]);

  // ------------------------------------------------------------------- Karte
  const stopPoll = () => {
    clearTimeout(pollRef.current);
    pollRef.current = null;
  };
  // Hinweis: pollGen (unten) verwirft Antworten älterer Schleifen.
  useEffect(() => () => stopPoll(), []);

  const pollGen = useRef(0);
  const poll = useCallback(
    (pi, betrag) => {
      stopPoll();
      const gen = ++pollGen.current; // nur die jüngste Abfrage-Schleife darf den Zustand ändern
      const runde = async () => {
        const r = await terminalStatusAction({ paymentIntent: pi, terminal });
        if (gen !== pollGen.current) return;
        if (!r.ok) {
          pollRef.current = setTimeout(runde, 2000);
          return;
        }
        const s = r.daten;
        if (s.bezahlt) {
          setKarte({ zustand: "bezahlt", pi, betrag });
          setZeilen((z) => [...z.filter((x) => !(x.art === "karte" && (!x.bezahlt || x.terminal_payment_intent === pi))), { art: "karte", betrag_cent: betrag, bezahlt: true, terminal_payment_intent: pi, terminal }]);
          ansagen?.(KIOSK.ansage.karteBezahlt);
          return;
        }
        if (s.status === "canceled" || s.zeit === "abgebrochen") {
          setKarte({ zustand: "fehler", text: KIOSK.karte.abgebrochen });
          setZeilen((z) => z.filter((x) => !(x.art === "karte" && !x.bezahlt)));
          return;
        }
        setKarte((k) => ({ ...k, langsam: s.zeit === "warnung" }));
        pollRef.current = setTimeout(runde, 2000);
      };
      pollRef.current = setTimeout(runde, 1200);
    },
    [terminal, ansagen]
  );

  const startet = useRef(false);
  const karteStarten = useCallback(
    async (betrag) => {
      if (startet.current) return; // nie zwei Zahlungen gleichzeitig (auch nicht bei doppeltem Effekt im Strict Mode)
      if (!terminal) {
        setKarte({ zustand: "fehler", text: KIOSK.karte.keinTerminal });
        return;
      }
      startet.current = true;
      setKarte({ zustand: "startet", betrag });
      const r = await terminalStartAction({ kasse: kontext.kasse, terminal, betragCent: betrag });
      startet.current = false;
      if (!r.ok) {
        setKarte({ zustand: "fehler", text: r.message });
        return;
      }
      setKarte({ zustand: "wartet", pi: r.daten.payment_intent, betrag });
      setZeilen((z) => [...z.filter((x) => !(x.art === "karte" && !x.bezahlt)), { art: "karte", betrag_cent: betrag, bezahlt: false, terminal_payment_intent: r.daten.payment_intent, terminal }]);
      ansagen?.(KIOSK.ansage.karteWartet);
      poll(r.daten.payment_intent, betrag);
    },
    [terminal, kontext.kasse, poll, ansagen]
  );

  // Karte startet sofort beim Wählen (Konzept §0.1).
  useEffect(() => {
    if (art === "karte" && karte.zustand === "aus" && offen > 0) karteStarten(offen); // eslint-disable-line react-hooks/set-state-in-effect -- startet das Terminal (externes System)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art]);

  // Automatisch buchen nach „bezahlt“ (Einstellung karte_automatisch_buchen).
  useEffect(() => {
    if (karte.zustand === "bezahlt" && kontext.einstellungen?.karte_automatisch_buchen && offen === 0) onBuchen(zeilen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [karte.zustand]);

  const karteAbbrechen = async () => {
    if (karte.pi) await terminalAbbruchAction({ paymentIntent: karte.pi, terminal });
    stopPoll();
    setZeilen((z) => z.filter((x) => !(x.art === "karte" && !x.bezahlt)));
    setKarte({ zustand: "aus" });
    setArt("bar");
    setGegeben({ text: "", markiert: true });
  };

  const simulieren = async (ok = true) => {
    const r = await terminalSimulierenAction({ terminal, erfolgreich: ok });
    if (!r.ok) zeige?.(r.message, { art: "fehler" });
    else if (!ok) setKarte((k) => ({ ...k, abgelehnt: true }));
    if (karte.pi) poll(karte.pi, karte.betrag);
  };

  // --------------------------------------------------------------- Gutschein
  const pruefen = useCallback(
    async (code) => {
      const c = String(code || gs.code).trim().toUpperCase();
      if (!c) return;
      setGs({ code: c, pruefung: null, laedt: true });
      const r = await gutscheinPruefenAction({ code: c });
      setGs({ code: c, pruefung: r.ok ? r.daten : { gueltig: false, grund: "unbekannt" }, laedt: false });
    },
    [gs.code]
  );
  useEffect(() => {
    if (!scanGutschein) return;
    setArt("gutschein"); // eslint-disable-line react-hooks/set-state-in-effect -- Scan von außen (Kassa-Scanner)
    pruefen(scanGutschein);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanGutschein]);

  const gutscheinEinloesen = () => {
    const p = gs.pruefung;
    if (!p?.gueltig) return;
    const betrag = Math.min(p.rest_cent, offen);
    const neu = [...zeilen.filter((z) => !(z.art === "gutschein" && z.code === p.code)), { art: "gutschein", betrag_cent: betrag, gutschein: p.gutschein, code: p.code, rest_cent: p.rest_cent }];
    setZeilen(neu);
    setGs({ code: "", pruefung: null, laedt: false });
    if (betrag >= offen) onBuchen(neu);
    else {
      setArt("karte" === start && terminal ? "karte" : "bar");
      setGegeben({ text: "", markiert: true });
    }
  };

  // -------------------------------------------------------------------- Bar
  const taste = (t) => {
    setGegeben((g) => {
      if (t === "×") return { text: "", markiert: false };
      const basis = g.markiert && t !== "⌫" ? "" : g.text;
      return { text: tasteAnwenden(basis, t), markiert: false };
    });
  };
  useEffect(() => {
    if (art !== "bar") return;
    const h = (e) => {
      if (e.target?.closest?.("input, textarea, [data-scan='nein']")) return;
      if (/^\d$/.test(e.key) || e.key === "," || e.key === ".") {
        e.preventDefault();
        taste(e.key === "." ? "," : e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        taste("⌫");
      } else if (e.key === "Delete") {
        e.preventDefault();
        taste("×");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [art]);

  const kassieren = (gegebenOverride) => {
    if (bucht || gesperrt) return;
    if (art === "bar" && offen > 0) {
      const g = gegebenOverride ?? gegebenCent;
      if (g < offen) return;
      onBuchen([...zeilen, { art: "bar", betrag_cent: offen, gegeben_cent: g }], { gegeben: g });
    } else if (offen === 0 && zeilen.length) onBuchen(zeilen);
  };

  const wechsle = (neu) => {
    if (karteLaeuft || karte.zustand === "bezahlt") return;
    setArt(neu);
    setGegeben({ text: "", markiert: true });
    if (neu !== "karte") setKarte({ zustand: "aus" });
  };

  // Tasten der Zahlmaske: F12/Strg+Enter kassieren, Esc zurück (nicht bei Karte bezahlt).
  useEffect(() => {
    const h = (e) => {
      if (e.key === "F12" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        kassieren();
      } else if (e.key === "Enter" && art === "bar" && !e.target?.closest?.("button, input")) {
        e.preventDefault();
        kassieren();
      } else if (e.key === "Escape" && !e.defaultPrevented) {
        if (karte.zustand === "bezahlt") {
          e.preventDefault();
          zeige?.(KIOSK.zahlung.erstKassieren, { art: "info" });
        } else if (!karteLaeuft) {
          e.preventDefault();
          onZurueck();
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const zurueckGesperrt = karteLaeuft || karte.zustand === "bezahlt" || bucht;
  const verfuegbar = zahlarten.filter((z) => ["bar", "karte", "gutschein"].includes(z.wert));

  return (
    <aside className="bo-ka-korb bo-ka-zahl" aria-label={KIOSK.zahlung.titel} data-testid="kassa-zahlmaske">
      <div className="bo-ka-zahl__kopf">
        <button type="button" className="bo-ka-rund bo-ka-rund--s" aria-label={KIOSK.zahlung.zurueck} onClick={onZurueck} disabled={zurueckGesperrt} data-testid="kassa-zahl-zurueck">
          <ChevronLeft {...s16} />
        </button>
        <h2>{KIOSK.zahlung.titel}</h2>
      </div>
      <div className="bo-ka-zahl__gesamt">
        <span className="bo-ka-muted">{offen < gesamt && offen > 0 ? KIOSK.zahlung.offen : KIOSK.korb.gesamt}</span>
        <b data-testid="kassa-zahl-offen">{euro(offen < gesamt && offen > 0 ? offen : gesamt)}</b>
      </div>

      {(zeilen.length > 1 || zeilen.some((z) => z.art === "gutschein")) && (
        <div className="flex flex-col gap-2" data-testid="kassa-split">
          {zeilen.map((z, i) => {
            const I = ICON[z.art] || CreditCard;
            const ok = z.art !== "karte" || z.bezahlt;
            return (
              <div key={i} className="bo-ka-splitzeile" data-ok={ok ? "true" : undefined}>
                <span className="bo-ka-splitzeile__ico">{ok ? <Check {...s16} /> : <I {...s16} />}</span>
                <span className="truncate">{z.art === "gutschein" ? `${KIOSK.zahlung.gutscheinCode} …${String(z.code).slice(-4)}` : z.art === "karte" ? (z.bezahlt ? KIOSK.karte.bezahlt : KIOSK.karte.wartetKurz) : "Bar"}</span>
                <span className="bo-ka-num bo-ka-strong">{euro(z.betrag_cent)}</span>
                {z.art === "gutschein" ? (
                  <button type="button" className="bo-ka-rund bo-ka-rund--s" style={{ width: 32, height: 32, boxShadow: "none" }} aria-label="Zahlung entfernen" onClick={() => setZeilen((x) => x.filter((_, j) => j !== i))} disabled={bucht}>
                    <X {...s16} />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </div>
      )}

      {offen > 0 && !karteLaeuft && karte.zustand !== "bezahlt" && (
        <Segment label={KIOSK.zahlart} breit wert={art} onWechsel={wechsle} optionen={verfuegbar.map((z) => ({ wert: z.wert, titel: z.titel, icon: z.icon, deaktiviert: z.deaktiviert, testid: `kassa-zm-${z.wert}` }))} testid="kassa-zm-art" />
      )}

      <div className="bo-ka-zahl__karte">
        {art === "bar" && offen > 0 && (
          <>
            <div className="bo-ka-feld" data-markiert={gegeben.markiert ? "true" : undefined} data-scan="nein">
              <span>
                <span className="bo-ka-feld__label block">{KIOSK.zahlung.gegeben}</span>
                <output className="bo-ka-feld__wert" aria-live="polite" data-testid="kassa-gegeben">
                  {gegeben.text === "" ? euro(offen) : `${anzeigeText(gegeben.text)} €`}
                </output>
              </span>
              {gegeben.text !== "" && (
                <button type="button" className="bo-ka-rund bo-ka-rund--s" aria-label="Betrag löschen" onClick={() => taste("×")}>
                  <X {...s16} />
                </button>
              )}
            </div>
            <div className="bo-ka-schnell" role="group" aria-label="Schnellbeträge">
              {schnellbetraege(offen).map((b, i) => (
                <button key={b} type="button" onClick={() => kassieren(b)} disabled={bucht || gesperrt} data-testid={i === 0 ? "kassa-passend" : "kassa-schnellbetrag"}>
                  {i === 0 ? KIOSK.zahlung.passend : euro(b).replace(",00", "")}
                </button>
              ))}
            </div>
            <div className="bo-ka-tasten" role="group" aria-label="Zahlen">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"].map((z) => (
                <button key={z} type="button" onClick={() => taste(z)} aria-label={z === "⌫" ? "Ziffer löschen" : z === "," ? "Komma" : z}>
                  {z === "⌫" ? <Delete {...S} /> : z}
                </button>
              ))}
            </div>
            <div className={gegebenCent >= offen ? "bo-ka-feld bo-ka-feld--rueck" : "bo-ka-feld bo-ka-feld--fehlt"}>
              <span className="bo-ka-feld__label">{gegebenCent >= offen ? KIOSK.zahlung.rueckgeld : KIOSK.zahlung.fehlt(euro(offen - gegebenCent))}</span>
              <span className="bo-ka-feld__wert" data-testid="kassa-rueckgeld">{gegebenCent >= offen ? euro(rueckgeld) : ""}</span>
            </div>
          </>
        )}

        {art === "karte" && (offen > 0 || karte.zustand === "bezahlt") && (
          <div className="bo-ka-terminal" data-zustand={karte.zustand === "bezahlt" ? "bezahlt" : karte.zustand === "fehler" ? "fehler" : "wartet"} data-testid="kassa-terminal" role="status">
            <span className="bo-ka-terminal__ico">
              {karte.zustand === "bezahlt" ? <Check size={36} strokeWidth={2} aria-hidden="true" /> : karte.zustand === "fehler" ? <TriangleAlert size={32} strokeWidth={1.75} aria-hidden="true" /> : <Nfc size={36} strokeWidth={1.5} aria-hidden="true" />}
              <i />
              <i />
            </span>
            <p>{karte.zustand === "bezahlt" ? KIOSK.karte.bezahlt : karte.zustand === "fehler" ? karte.text : karte.abgelehnt ? KIOSK.karte.abgelehnt : KIOSK.karte.wartet}</p>
            <small className="bo-ka-num">{euro(karte.betrag || offen)}{karte.langsam ? ` · ${KIOSK.karte.langsam}` : ""}</small>
            {karteLaeuft && <p className="bo-ka-grund">{KIOSK.karte.bonGesperrt}</p>}
            {karte.zustand === "wartet" && testmodus && (
              <div className="bo-ka-reihe">
                <button type="button" className="bo-ka-zweit" onClick={() => simulieren(true)} data-testid="kassa-terminal-simulieren">
                  {KIOSK.karte.simulieren}
                </button>
              </div>
            )}
            {karte.zustand === "fehler" && (
              <button type="button" className="bo-ka-zweit bo-ka-zweit--voll" onClick={() => karteStarten(offen)}>
                {KIOSK.karte.starten}
              </button>
            )}
          </div>
        )}

        {art === "gutschein" && offen > 0 && (
          <div className="flex flex-col gap-2.5" data-scan="nein">
            <label className="bo-ka-label" htmlFor="kassa-gscode">{KIOSK.zahlung.gutscheinScannen}</label>
            <div className="bo-ka-gscode">
              <input id="kassa-gscode" value={gs.code} onChange={(e) => setGs({ code: e.target.value, pruefung: null, laedt: false })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), pruefen())} placeholder="PH-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} data-testid="kassa-gscode" data-scan="nein" />
              <button type="button" className="bo-ka-zweit" onClick={() => pruefen()} disabled={!gs.code || gs.laedt}>
                {KIOSK.zahlung.gutscheinPruefen}
              </button>
            </div>
            {gs.pruefung && !gs.pruefung.gueltig && (
              <p className="bo-ka-hinweis" data-ton="gefahr" role="alert">
                <TriangleAlert {...s16} />
                {gs.pruefung.grund === "abgelaufen" ? KIOSK.zahlung.gutscheinAbgelaufen : gs.pruefung.grund === "eingeloest" ? KIOSK.zahlung.gutscheinLeer : KIOSK.zahlung.gutscheinUngueltig}
              </p>
            )}
            {gs.pruefung?.gueltig && (
              <>
                <div className="bo-ka-feld">
                  <span className="bo-ka-feld__label">{KIOSK.zahlung.gutscheinRest(euro(gs.pruefung.rest_cent))}</span>
                  <span className="bo-ka-feld__wert">…{String(gs.pruefung.code).slice(-4)}</span>
                </div>
                <button type="button" className="bo-ka-primaer" onClick={gutscheinEinloesen} data-testid="kassa-gs-einloesen">
                  {KIOSK.zahlung.gutscheinUebernehmen(euro(Math.min(gs.pruefung.rest_cent, offen)))}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {karteLaeuft ? (
        <button type="button" className="bo-ka-zweit bo-ka-zweit--voll bo-ka-zweit--gefahr" style={{ height: 64, borderRadius: 20 }} onClick={karteAbbrechen} data-testid="kassa-karte-abbrechen">
          <X {...S} />
          {KIOSK.karte.abbrechen}
        </button>
      ) : (
        <button type="button" className="bo-ka-pay" onClick={() => kassieren()} disabled={!kannKassieren} style={gesperrt ? { pointerEvents: "none" } : undefined} data-testid="kassa-zahl-kassieren">
          <span className="inline-flex items-center gap-2">
            {KIOSK.zahlung.kassieren} <kbd>F12</kbd>
          </span>
          <span className="bo-ka-num">{art === "bar" && rueckgeld > 0 ? `${KIOSK.zahlung.rueckgeld} ${euro(rueckgeld)}` : euro(gesamt)}</span>
        </button>
      )}
    </aside>
  );
}

