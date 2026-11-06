"use client";
// Dialoge des Shops (10-konzept-shop § 6.4, S1–S10 + Hilfsdialoge) im Lounge-Stil: Overlay-Dialog (Material,
// Radius 32), Felder als eingelassene Flächen, eine Primäraktion in Tinte mit dem Betrag im Text, Live-Satz
// (aria-live) statt zweiter Rückfrage. Geld nie bar/Karte (E1) – stattdessen „An der Kassa kassieren“.
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/Backoffice/Overlay";
import Knopf from "@/components/Backoffice/Knopf";
import BetragFeld from "@/components/Backoffice/Eingabe/BetragFeld";
import Datumsfeld from "@/components/Backoffice/Formular/Datumsfeld";
import Schalter from "@/components/Backoffice/Schalter";
import { cent } from "@/lib/backoffice/format";
import { zahlungVorschau, einloesBetrag, erstattungRechnen, wegSatz, satzText, brauchtFreigabe } from "@/lib/backoffice/shop/geld";
import { hinsendekosten } from "@/lib/backoffice/shop/fristen";
import { T } from "@/lib/backoffice/shop/texte";
import { kanalText } from "@/lib/backoffice/shop/status";
import { aktionAction, erstattungVorschauAction, gutscheinPruefenAction, bestellSucheAction } from "@/lib/backoffice/shop/actions";
import ShopIcon from "./ShopIcon";
import KassaHinweis from "./KassaHinweis";

export const idem = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Fuß mit Abbrechen + Primär (⌘↵ löst aus). */
function Fuss({ onAbbrechen, primaer, onPrimaer, laeuft, deaktiviert, gefaehrlich, grund, testid }) {
  return (
    <div className="flex w-full flex-col gap-2">
      {grund && <p className="bo-shop-hinweis text-right">{grund}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Knopf variant="ghost" onClick={onAbbrechen} disabled={laeuft}>
          Abbrechen
        </Knopf>
        <Knopf variant={gefaehrlich ? "danger-solid" : "primary"} onClick={onPrimaer} laedt={laeuft} disabled={deaktiviert} kuerzel="Strg+Enter" data-testid={testid}>
          {primaer}
        </Knopf>
      </div>
    </div>
  );
}

function useStrgEnter(aktiv, fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (!aktiv) return;
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ref.current?.();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aktiv]);
}

function Feld({ label, fehler, hinweis, children, id }) {
  return (
    <div className="bo-shop-feld">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {fehler ? <p className="bo-shop-fehler" role="alert">{fehler}</p> : hinweis ? <p className="bo-shop-hinweis">{hinweis}</p> : null}
    </div>
  );
}

function Chips({ werte, wert, onWahl, label }) {
  return (
    <div className="bo-shop-wahl" role="radiogroup" aria-label={label}>
      {werte.map((w) => (
        <button key={w} type="button" role="radio" aria-checked={wert === w} onClick={() => onWahl(w)} className="bo-druck">
          {w}
        </button>
      ))}
    </div>
  );
}

function useAusfuehren(onFertig) {
  const [laeuft, start] = useTransition();
  const [fehler, setFehler] = useState(null);
  const key = useMemo(() => idem(), []);
  const los = (aktion, name, args, { doctype } = {}) =>
    start(async () => {
      setFehler(null);
      const r = await aktionAction({ aktion, name, doctype, args, idempotency: key });
      if (!r.ok) setFehler(r.message);
      else onFertig?.(r.ergebnis, r);
    });
  return { laeuft, fehler, setFehler, los };
}

// ------------------------------------------------------------------ S1 Zahlung erfassen --

export function ZahlungErfassen({ doc, darfKassa, onSchliessen, onFertig }) {
  const offen = Number(doc.offen_cent) || 0;
  const [betrag, setBetrag] = useState(offen);
  const [referenz, setReferenz] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e));
  const v = zahlungVorschau(doc, betrag);
  const id = useId();
  const gesperrt = doc.waehrung && doc.waehrung !== "EUR" ? T.baender.fremd : doc.status === "abholbereit" && offen > 0 ? "Noch nicht verfügbar – an der Kassa kassieren" : null;
  const senden = () => !gesperrt && v.gueltig && referenz.trim() && los("zahlung-erfassen", doc.name, { kanal: "Ueberweisung", betrag_cent: betrag, referenz });
  useStrgEnter(!ergebnis, senden);
  const statusDanach = v.vollDanach ? (doc.lieferart === "abholung" && doc.status === "reserviert" ? "Bezahlt" : "Bezahlt") : `bleibt „${doc.statusAnzeige || doc.status}“`;
  return (
    <Dialog offen titel={`${T.dialoge.s1} · ${doc.name}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-zahlung"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={`${cent(v.betrag)} buchen`} onPrimaer={senden} laeuft={laeuft} deaktiviert={!!gesperrt || !v.gueltig || !referenz.trim()} grund={gesperrt} testid="zahlung-buchen" />}>
      {ergebnis ? (
        <div className="bo-shop-flaeche flex flex-col gap-2" data-ton="ok" role="status">
          <p className="font-semibold">Zahlung {String(ergebnis.name || "")} über {cent(v.betrag)} gebucht</p>
          <p className="text-sm">{v.vollDanach ? "Vollständig bezahlt – nächster Schritt in der Akte." : `Offen danach ${cent(v.offenDanach)}.`}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[15px]">
            Offen <strong className="tabular-nums">{cent(offen)}</strong>
            {Number(doc.betrag_bezahlt_cent) > 0 && <span className="text-bo-text-soft"> · bezahlt {cent(doc.betrag_bezahlt_cent)}</span>}
          </p>
          <div className="bo-shop-flaeche text-sm">Weg: <strong>Überweisung eingegangen</strong>. Zahlungslink senden: über „Zahlungslink“ in der Akte.</div>
          <Feld label="Betrag" id={`${id}-b`} hinweis="Teilbetrag möglich">
            <BetragFeld id={`${id}-b`} value={betrag} onChange={(c) => setBetrag(c ?? 0)} maxCent={offen} />
          </Feld>
          <Feld label="Referenz *" id={`${id}-r`} hinweis="Verwendungszweck oder Bankreferenz, Bankdatum gern dazu">
            <input id={`${id}-r`} className="bo-shop-input" value={referenz} onChange={(e) => setReferenz(e.target.value)} maxLength={140} autoComplete="off" required />
          </Feld>
          <p className="bo-shop-livesatz" aria-live="polite">
            Bucht {cent(v.betrag)} · offen danach {cent(v.offenDanach)} · Status {statusDanach}
          </p>
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
          <KassaHinweis darf={darfKassa} beleg={doc.name} kunde={doc.kontakt} />
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ S2 Gutschein einlösen --

export function GutscheinEinloesen({ doc, gutschein, onSchliessen, onFertig, darfKassa }) {
  // doc = Bestellung (aus der Akte) oder null (aus der Gutscheinakte → erst Bestellung wählen)
  const [bestellung, setBestellung] = useState(doc || null);
  const [code, setCode] = useState("");
  const [zeigen, setZeigen] = useState(false);
  const [karte, setKarte] = useState(null);
  const [pruefFehler, setPruefFehler] = useState(null);
  const [pruefend, startPruefen] = useTransition();
  const [betrag, setBetrag] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e));
  const id = useId();
  const offen = Number(bestellung?.offen_cent) || 0;
  const pruefe = (c) =>
    startPruefen(async () => {
      setPruefFehler(null);
      setKarte(null);
      const r = await gutscheinPruefenAction({ code: c });
      if (!r.ok) setPruefFehler(r.message);
      else {
        setKarte(r.ergebnis);
        setBetrag(einloesBetrag({ rest: r.ergebnis.rest_cent, offenCent: offen }));
      }
    });
  void gutschein;
  const b = karte ? einloesBetrag({ rest: karte.rest_cent, offenCent: offen, wunsch: betrag }) : 0;
  const senden = () => karte && bestellung && b > 0 && los("gutschein-einloesen", bestellung.name, { code, betrag_cent: b });
  useStrgEnter(!ergebnis, senden);
  const sauber = code.replace(/[\s-]/g, "").toUpperCase();
  return (
    <Dialog offen titel={`${T.dialoge.s2}${bestellung ? ` · ${bestellung.name}` : ""}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-gutschein"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={`${cent(b)} einlösen`} onPrimaer={senden} laeuft={laeuft} deaktiviert={!karte || !bestellung || b <= 0} testid="gutschein-einloesen" />}>
      {ergebnis ? (
        <div className="flex flex-col gap-3">
          <div className="bo-shop-flaeche" data-ton="ok" role="status">
            <p className="font-semibold">{cent(ergebnis.betrag_cent)} eingelöst</p>
            <p className="text-sm">Rest Gutschein {cent(ergebnis.rest_cent)} · offen danach {cent(ergebnis.offen_cent)}</p>
          </div>
          {Number(ergebnis.offen_cent) > 0 && <KassaHinweis darf={darfKassa} beleg={bestellung?.name} />}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!bestellung && <BestellWahl onWahl={setBestellung} />}
          {bestellung && <p className="text-[15px]">Offen <strong className="tabular-nums">{cent(offen)}</strong> · {bestellung.kunde_name}</p>}
          <Feld label="Gutschein-Code" id={`${id}-c`} fehler={pruefFehler} hinweis="Scannen oder tippen – Leerzeichen und Bindestriche egal">
            <div className="flex gap-2">
              <input id={`${id}-c`} className="bo-shop-input bo-shop-code" style={{ fontSize: 17 }} type={zeigen || !karte ? "text" : "password"} value={code} data-scan="ja" autoComplete="off" spellCheck={false} autoCapitalize="characters"
                onChange={(e) => {
                  setCode(e.target.value);
                  const s = e.target.value.replace(/[\s-]/g, "");
                  if (s.length >= 6 && s.length % 4 === 0) pruefe(s);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    pruefe(sauber);
                  }
                }} aria-invalid={pruefFehler ? "true" : undefined} />
              {karte && <Knopf variant="ghost" icon="Eye" label={zeigen ? "Code verbergen" : "Code anzeigen"} onClick={() => setZeigen((x) => !x)} />}
              {!karte && <Knopf onClick={() => pruefe(sauber)} laedt={pruefend} disabled={sauber.length < 4}>Prüfen</Knopf>}
            </div>
          </Feld>
          {karte && (
            <div className="bo-shop-flaeche flex items-center justify-between gap-3" data-ton="ok">
              <span className="font-semibold">Rest {cent(karte.rest_cent)} · gültig{karte.gueltig_bis ? ` bis ${karte.gueltig_bis.split("-").reverse().join(".")}` : ""} · Mehrzweck</span>
              <span className="bo-shop-code" style={{ fontSize: 15 }}>····-{karte.letzte4}</span>
            </div>
          )}
          {karte && (
            <Feld label="Betrag" id={`${id}-b`} hinweis={`Höchstens ${cent(Math.min(karte.rest_cent, offen))}`}>
              <BetragFeld id={`${id}-b`} value={b} onChange={(c) => setBetrag(c ?? 0)} maxCent={Math.min(karte.rest_cent, offen)} />
            </Feld>
          )}
          {karte && <p className="bo-shop-livesatz" aria-live="polite">Löst {cent(b)} ein · Rest Gutschein danach {cent(karte.rest_cent - b)} · offen danach {cent(offen - b)} · gebucht und gesperrt</p>}
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

/** Bestellsuche (nur offene Beträge) – für „Auf Bestellung anrechnen“ und „Zahlung erfassen“ aus der Liste. */
export function BestellWahl({ onWahl }) {
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [, start] = useTransition();
  const id = useId();
  useEffect(() => {
    const t = setTimeout(() => start(async () => {
      const r = await bestellSucheAction({ q });
      setTreffer(r.ok ? r.ergebnis : []);
    }), 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Feld label="Bestellung" id={id}>
      <input id={id} className="bo-shop-input" placeholder="Nummer oder Name" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {treffer.length > 0 && (
        <div className="bo-shop-treffer" role="listbox" aria-label="Bestellungen mit offenem Betrag">
          {treffer.map((b) => (
            <button key={b.name} type="button" role="option" aria-selected="false" onClick={() => onWahl({ ...b, kunde_name: b.kunde })}>
              <span className="bo-shop-zelle-nr">{b.name}</span>
              <span className="min-w-0 flex-1 truncate">{b.kunde}</span>
              <span className="tabular-nums text-bo-text-soft">offen {cent(b.offen_cent)}</span>
            </button>
          ))}
        </div>
      )}
    </Feld>
  );
}

// ------------------------------------------------------------------ S3 Stornieren --

export function Stornieren({ doc, onSchliessen, onFertig, darfKassa }) {
  const [grund, setGrund] = useState("");
  const [frei, setFrei] = useState("");
  const [vorschau, setVorschau] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const bezahlt = Number(doc.betrag_bezahlt_cent) > 0;
  const bar = doc.sperre === "bar";
  const rechnung = doc.sperre === "rechnung";
  const [erstatten, setErstatten] = useState(bezahlt && !bar);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e || {}));
  useEffect(() => {
    if (!bezahlt) return;
    let ab = false;
    erstattungVorschauAction({ name: doc.name, zeilen: Object.fromEntries((doc.positionen || []).map((p) => [String(p.idx), Number(p.menge) - Number(p.zurueck_menge || 0)])), versand_cent: Number(doc.versand_cent) || 0 }).then((r) => !ab && r.ok && setVorschau(r.ergebnis));
    return () => {
      ab = true;
    };
  }, [doc, bezahlt]);
  const g = grund === "Sonstiges" ? frei.trim() : grund;
  const offenErst = Number(doc.betrag_bezahlt_cent) - Number(doc.erstattet_cent || 0);
  const ueberGrenze = erstatten && brauchtFreigabe(offenErst, doc.vierAugenCent ?? 100000);
  const senden = () => g && !rechnung && los("stornieren", doc.name, { grund: g, erstatten, ohneErstattung: bar && !erstatten });
  useStrgEnter(!ergebnis, senden);
  return (
    <Dialog offen titel={`${T.dialoge.s3} · ${doc.name}`} groesse="lg" onSchliessen={onSchliessen} testid="dialog-storno"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={erstatten && bezahlt ? `Stornieren · ${cent(offenErst)} erstatten` : "Stornieren"} onPrimaer={senden} laeuft={laeuft} deaktiviert={!g || rechnung} gefaehrlich grund={rechnung ? "Erst Gutschrift in Faktura anlegen" : null} testid="storno-senden" />}>
      {ergebnis ? (
        <div className="bo-shop-flaeche" data-ton="ok" role="status">
          <p className="font-semibold">{doc.name} storniert</p>
          {(ergebnis.zahlungen || []).some((z) => z.angefordert) ? <p className="text-sm">Erstattung über der Grenze – Freigabe der Geschäftsführung angefordert.</p> : erstatten && bezahlt ? <p className="text-sm">Erstattung gebucht{(ergebnis.zahlungen || []).some((z) => z.simuliert) ? " (Stripe-Simulation aktiv)" : ""}.</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Feld label="Grund *">
            <Chips werte={[...T.gruende.storno, "Sonstiges"]} wert={grund} onWahl={setGrund} label="Grund" />
            {grund === "Sonstiges" && <input className="bo-shop-input mt-2" value={frei} onChange={(e) => setFrei(e.target.value)} placeholder="Grund" maxLength={140} aria-label="Grund in eigenen Worten" />}
          </Feld>
          {bezahlt && (
            <div className="flex flex-col gap-3">
              <Schalter label="Zahlung erstatten" an={erstatten} onWechsel={setErstatten} deaktiviert={bar} beschreibung={bar ? T.kassa.auszahlen : undefined} />
              {bar && <KassaHinweis darf={darfKassa} beleg={doc.name} variante="erstattung" />}
              {erstatten && vorschau && (
                <ul className="bo-shop-posten" aria-label="Erstattung">
                  {(vorschau.verteilung || []).map((t) => (
                    <li key={t.name}>
                      <span><span className="bo-shop-zelle-nr mr-2">{t.name}</span>{kanalText(t.kanal)} – {wegSatz(t.kanal)}</span>
                      <strong className="tabular-nums">{cent(t.betrag_cent ?? t.offen_cent)}</strong>
                    </li>
                  ))}
                  <li><span className="font-semibold">Summe</span><strong className="tabular-nums">{cent(offenErst)}</strong></li>
                </ul>
              )}
              {doc.lieferschein && <p className="bo-shop-hinweis">Lieferschein {doc.lieferschein} → Aufgabe „in Logistik stornieren“.</p>}
              {ueberGrenze && <div className="bo-shop-flaeche" data-ton="warn">Über der Grenze – die Erstattung wartet auf die Freigabe der Geschäftsführung.</div>}
            </div>
          )}
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ S4 Erstatten (Zahlung) --

export function ErstattenZahlung({ zahlung, onSchliessen, onFertig, darfKassa }) {
  const max = Number(zahlung.betrag_cent) - Number(zahlung.erstattet_cent || 0);
  const [betrag, setBetrag] = useState(max);
  const [grund, setGrund] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e || {}));
  const kassa = ["Bar", "Karte extern", "Stripe Terminal"].includes(zahlung.kanal);
  const id = useId();
  const senden = () => !kassa && grund && betrag > 0 && betrag <= max && los("rueckerstatten", zahlung.name, { betrag_cent: betrag, grund });
  useStrgEnter(!ergebnis, senden);
  return (
    <Dialog offen titel={`${T.dialoge.s4} · ${zahlung.name}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-erstatten"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={`${cent(betrag)} erstatten`} onPrimaer={senden} laeuft={laeuft} deaktiviert={kassa || !grund || betrag <= 0 || betrag > max} testid="erstatten-senden" />}>
      {ergebnis ? (
        <div className="bo-shop-flaeche" data-ton="ok" role="status">
          {ergebnis.angefordert ? <p className="font-semibold">Freigabe der Geschäftsführung angefordert</p> : <p className="font-semibold">Erstattung {ergebnis.gegenbuchung} gebucht{ergebnis.simuliert ? " (Stripe-Simulation aktiv)" : ""}</p>}
        </div>
      ) : kassa ? (
        <KassaHinweis darf={darfKassa} beleg={zahlung.bezug} variante="erstattung" flaeche />
      ) : (
        <div className="flex flex-col gap-4">
          <Feld label="Betrag" id={`${id}-b`} hinweis={`zwischen 0,01 € und ${cent(max)}`}>
            <BetragFeld id={`${id}-b`} value={betrag} onChange={(c) => setBetrag(c ?? 0)} maxCent={max} />
          </Feld>
          <Feld label="Grund *">
            <Chips werte={T.gruende.erstattung} wert={grund} onWahl={setGrund} label="Grund" />
          </Feld>
          <p className="bo-shop-livesatz" aria-live="polite">
            {String(zahlung.kanal).startsWith("Stripe") ? "Erstattung über Stripe auf die Zahlungsart des Kunden" : zahlung.kanal === "Gutschein" ? "Restwert zurück auf den Gutschein" : "Gegenbuchung – Rücküberweisung bitte im Bankprogramm ausführen"}
            {brauchtFreigabe(betrag, zahlung.vierAugenCent ?? 100000) ? " · über der Grenze: Freigabe der Geschäftsführung" : ""}
          </p>
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ S9 Teilerstattung / Teilstorno --

export function Teilerstattung({ doc, teilstorno = false, onSchliessen, onFertig, mitVersand = true }) {
  const pos = doc.positionen || [];
  const [auswahl, setAuswahl] = useState({});
  const [versand, setVersand] = useState(false);
  const [kulanz, setKulanz] = useState(0);
  const [grund, setGrund] = useState("");
  const [vorschau, setVorschau] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e || {}));
  const unbezahlt = Number(doc.betrag_bezahlt_cent || 0) === 0;
  const lokal = erstattungRechnen(pos, auswahl, { versand_cent: versand ? Number(doc.versand_cent) || 0 : 0, kulanz_cent: kulanz });
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!Object.values(auswahl).some((x) => x > 0) && !versand && !kulanz) return setVorschau(null);
      const r = await erstattungVorschauAction({ name: doc.name, zeilen: auswahl, versand_cent: versand ? Number(doc.versand_cent) || 0 : 0, kulanz_cent: kulanz });
      if (r.ok) setVorschau(r.ergebnis);
    }, 300);
    return () => clearTimeout(t);
  }, [auswahl, versand, kulanz, doc]);
  const v = vorschau || lokal;
  const anzahl = Object.values(auswahl).filter((x) => x > 0).length;
  const primaer = unbezahlt ? `${anzahl} ${anzahl === 1 ? "Position" : "Positionen"} stornieren` : `${cent(v.betrag_cent || 0)} erstatten`;
  const senden = () => {
    if (!grund || (!(v.betrag_cent > 0))) return;
    if (unbezahlt) onFertig({ undo: "teilstorno-unbezahlt", args: { zeilen: auswahl, grund } });
    else los("teilerstatten", doc.name, { zeilen: auswahl, versand_cent: versand ? Number(doc.versand_cent) || 0 : 0, kulanz_cent: kulanz, grund, teilstorno });
  };
  useStrgEnter(!ergebnis, senden);
  return (
    <Dialog offen titel={`${teilstorno ? T.dialoge.s9storno : T.dialoge.s9} · ${doc.name}`} groesse="lg" onSchliessen={onSchliessen} testid="dialog-teilerstattung"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={primaer} onPrimaer={senden} laeuft={laeuft} deaktiviert={!grund || !(v.betrag_cent > 0)} gefaehrlich={unbezahlt} testid="teilerstattung-senden" />}>
      {ergebnis ? (
        <div className="bo-shop-flaeche" data-ton="ok" role="status">
          <p className="font-semibold">{ergebnis.angefordert ? "Freigabe der Geschäftsführung angefordert" : `${cent(ergebnis.betrag_cent)} erstattet`}</p>
          {ergebnis.ust_cent ? <p className="text-sm">enthält {cent(ergebnis.ust_cent)} USt</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <table className="w-full text-sm" aria-label="Positionen">
            <thead>
              <tr className="text-left text-[12px] text-bo-text-soft">
                <th className="pb-2 font-medium">Artikel</th>
                <th className="pb-2 text-right font-medium">Summe</th>
                <th className="pb-2 text-right font-medium">Menge zurück</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((p) => {
                const offenM = Number(p.menge) - Number(p.zurueck_menge || 0);
                const m = auswahl[String(p.idx)] || 0;
                const setze = (n) => setAuswahl((a) => ({ ...a, [String(p.idx)]: Math.max(0, Math.min(offenM, n)) }));
                return (
                  <tr key={p.idx} className="align-middle">
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <Thumb bild={p.bild} />
                        <span className="min-w-0">
                          <span className="block font-medium">{p.bezeichnung}</span>
                          <span className="bo-shop-unter">{p.menge} × {cent(p.einzel_cent)} · USt {satzText(p.ust_satz_promille || 2000)}{Number(p.zurueck_menge) ? ` · ${p.zurueck_menge} zurück` : ""}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{cent(p.summe_cent)}</td>
                    <td className="py-2 text-right">
                      <span className="bo-shop-stepper" role="group" aria-label={`Menge ${p.bezeichnung}`}>
                        <button type="button" onClick={() => setze(m - 1)} disabled={m <= 0} aria-label="weniger"><ShopIcon name="Minus" /></button>
                        <output aria-live="polite">{m}</output>
                        <button type="button" onClick={() => setze(m + 1)} disabled={m >= offenM} aria-label="mehr"><ShopIcon name="Plus" /></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!unbezahlt && mitVersand && Number(doc.versand_cent) > 0 && <Schalter label={`Versandanteil ${cent(doc.versand_cent)}`} an={versand} onWechsel={setVersand} />}
          {!unbezahlt && !teilstorno && (
            <Feld label="Kulanzbetrag (ohne Rücknahme)">
              <BetragFeld value={kulanz} onChange={(c) => setKulanz(c ?? 0)} />
            </Feld>
          )}
          <Feld label="Grund *">
            <Chips werte={teilstorno ? ["Kundenwunsch", "nicht lieferbar", "Preisfehler"] : T.gruende.erstattung} wert={grund} onWahl={setGrund} label="Grund" />
          </Feld>
          <div className="bo-shop-flaeche" aria-live="polite">
            {unbezahlt ? (
              <p className="text-sm">Nur Forderung – kein Geld fließt. Offener Zahlungslink passt danach nicht mehr – neuer Link nötig.</p>
            ) : (
              <>
                <p className="font-semibold tabular-nums">Erstattung {cent(v.betrag_cent || 0)}</p>
                <p className="text-sm tabular-nums">{(v.posten || []).map((x) => `enth. ${cent(x.ust_cent)} USt ${satzText(x.satz_promille)}`).join(" · ") || "–"}</p>
                {(v.verteilung || []).length > 0 && <p className="text-sm">{v.verteilung.map((t) => `${kanalText(t.kanal)} ${cent(t.betrag_cent ?? t.offen_cent)}`).join(" · ")}</p>}
              </>
            )}
          </div>
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

export function Thumb({ bild, klein = false, alt = "" }) {
  return (
    <span className={`bo-shop-thumb${klein ? " bo-shop-thumb--s" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {bild ? <img src={bild} alt={alt} loading="lazy" /> : <span className="bo-shop-thumb__ico"><ShopIcon name="Package" /></span>}
    </span>
  );
}

// ------------------------------------------------------------------ S10 Ersatz liefern --

export function ErsatzLiefern({ doc, onSchliessen, onFertig }) {
  const pos = doc.positionen || [];
  const [auswahl, setAuswahl] = useState(() => Object.fromEntries(pos.map((p) => [String(p.idx), Number(p.menge)])));
  const [grund, setGrund] = useState("");
  const [frei, setFrei] = useState("");
  const [lieferart, setLieferart] = useState(doc.lieferart || "versand");
  const g = grund === "Sonstiges" ? frei.trim() : grund;
  const senden = () => g && Object.values(auswahl).some((x) => x > 0) && onFertig({ undo: "ersatz", args: { zeilen: auswahl, grund: g, lieferart } });
  useStrgEnter(true, senden);
  return (
    <Dialog offen titel={`${T.dialoge.s10} · ${doc.name}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-ersatz"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer="Ersatz anlegen" onPrimaer={senden} deaktiviert={!g} />}>
      <div className="flex flex-col gap-4">
        {pos.map((p) => (
          <div key={p.idx} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-3"><Thumb bild={p.bild} klein /><span className="truncate">{p.bezeichnung}</span></span>
            <span className="bo-shop-stepper" role="group" aria-label={`Menge ${p.bezeichnung}`}>
              <button type="button" aria-label="weniger" onClick={() => setAuswahl((a) => ({ ...a, [p.idx]: Math.max(0, (a[p.idx] || 0) - 1) }))}><ShopIcon name="Minus" /></button>
              <output>{auswahl[p.idx] || 0}</output>
              <button type="button" aria-label="mehr" onClick={() => setAuswahl((a) => ({ ...a, [p.idx]: Math.min(Number(p.menge), (a[p.idx] || 0) + 1) }))}><ShopIcon name="Plus" /></button>
            </span>
          </div>
        ))}
        <Feld label="Grund *">
          <Chips werte={[...T.gruende.ersatz, "Sonstiges"]} wert={grund} onWahl={setGrund} label="Grund" />
          {grund === "Sonstiges" && <input className="bo-shop-input mt-2" value={frei} onChange={(e) => setFrei(e.target.value)} aria-label="Grund in eigenen Worten" maxLength={140} />}
        </Feld>
        <Feld label="Lieferart">
          <Chips werte={["versand", "abholung"]} wert={lieferart} onWahl={setLieferart} label="Lieferart" />
        </Feld>
        <p className="bo-shop-hinweis">Neue Bestellung über 0 €, Status bezahlt, ohne Bestätigungsmail. Mangel und Transportschaden gehören nicht in die Retoure.</p>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Hilfsdialoge --

/** Soll/Ist (Als geprüft übernehmen, Leitung). */
export function SollIst({ doc, onSchliessen, onFertig }) {
  const { laeuft, fehler, los } = useAusfuehren(() => onFertig());
  const senden = () => los("geprueft", doc.name, {});
  useStrgEnter(true, senden);
  return (
    <Dialog offen titel={`${T.dialoge.sollIst} · ${doc.name}`} groesse="sm" onSchliessen={onSchliessen} testid="dialog-sollist"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer="Übernehmen" onPrimaer={senden} laeuft={laeuft} />}>
      <dl className="bo-shop-fakten">
        <div><dt>Soll (Bestellung)</dt><dd>{cent(doc.gesamt_cent)}</dd></div>
        <div><dt>Ist (Stripe)</dt><dd>{cent(doc.betrag_bezahlt_cent)}</dd></div>
        <div><dt>Abweichung</dt><dd>{cent(Number(doc.betrag_bezahlt_cent) - Number(doc.gesamt_cent))}</dd></div>
      </dl>
      <p className="bo-shop-hinweis mt-4">Danach gilt die Bestellung als bezahlt. Bei Unklarheit stattdessen stornieren und erstatten.</p>
      {fehler && <p className="bo-shop-fehler mt-2" role="alert">{fehler}</p>}
    </Dialog>
  );
}

/** Versendet melden: Sendungsnummer und Versanddienst vorbefüllt, dann Undo (Mail an Kunden). */
export function VersendetMini({ doc, onSchliessen, onFertig }) {
  const [awb, setAwb] = useState(doc.awb || "");
  const [carrier, setCarrier] = useState(doc.carrier || "DHL");
  const id = useId();
  const senden = () => onFertig({ undo: "versendet", args: { awb, carrier } });
  useStrgEnter(true, senden);
  return (
    <Dialog offen titel={`${T.dialoge.versendet} · ${doc.name}`} groesse="sm" onSchliessen={onSchliessen} testid="dialog-versendet"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer="Versendet melden" onPrimaer={senden} testid="versendet-senden" />}>
      <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), senden())}>
        <Feld label="Sendungsnummer" id={`${id}-a`}>
          <input id={`${id}-a`} className="bo-shop-input tabular-nums" value={awb} onChange={(e) => setAwb(e.target.value)} data-scan="ja" autoComplete="off" />
        </Feld>
        <Feld label="Versanddienst" id={`${id}-c`}>
          <input id={`${id}-c`} className="bo-shop-input" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        </Feld>
        <p className="bo-shop-hinweis">Der Kunde erhält eine Versandmail mit der Sendungsnummer – 8 Sekunden lang zurücknehmbar.</p>
      </form>
    </Dialog>
  );
}

/** Pflichtgrund (Ablehnen, Übergabe zurücknehmen, Ankündigung stornieren, Entsperren …). */
export function GrundDialog({ titel, text, chips = [], min = 1, bestaetigen = "Bestätigen", gefaehrlich = false, onSchliessen, onGrund, laeuft, fehler, extra, erlaubt = () => true }) {
  const [grund, setGrund] = useState("");
  const [chip, setChip] = useState("");
  const id = useId();
  const voll = [chip, grund.trim()].filter(Boolean).join(" – ");
  const ok = voll.length >= min && erlaubt(chip);
  const senden = () => ok && onGrund(voll, chip);
  useStrgEnter(true, senden);
  return (
    <Dialog offen titel={titel} groesse="sm" onSchliessen={onSchliessen} testid="dialog-grund"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer={bestaetigen} onPrimaer={senden} laeuft={laeuft} deaktiviert={!ok} gefaehrlich={gefaehrlich} testid="grund-senden" />}>
      <div className="flex flex-col gap-4">
        {text && <p className="text-[15px] text-bo-text-soft">{text}</p>}
        {chips.length > 0 && <Chips werte={chips} wert={chip} onWahl={setChip} label="Grund" />}
        {chip && !erlaubt(chip) && <p className="bo-shop-fehler">„{chip}“ nur mit bekannter Zustellung und nachweisbarer Belehrung.</p>}
        <Feld label={chips.length ? "Ergänzung" : "Grund *"} id={id} hinweis={min > 1 ? `mindestens ${min} Zeichen` : undefined}>
          <textarea id={id} className="bo-shop-input" rows={3} value={grund} onChange={(e) => setGrund(e.target.value)} maxLength={500} />
        </Feld>
        {extra}
        {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
      </div>
    </Dialog>
  );
}

/** Widerruf erfassen (Brief/Telefon/Showroom/E-Mail) → Undo 8 s vor Anlage. */
export function WiderrufErfassen({ doc, onSchliessen, onFertig }) {
  const [kanal, setKanal] = useState("E-Mail");
  const [text, setText] = useState("");
  const id = useId();
  const senden = () => onFertig({ undo: "widerruf-erfassen", args: { kanal, text } });
  useStrgEnter(true, senden);
  return (
    <Dialog offen titel={`${T.dialoge.widerruf} · ${doc.name}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-widerruf"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer="Widerruf anlegen" onPrimaer={senden} />}>
      <div className="flex flex-col gap-4">
        <Feld label="Eingang über"><Chips werte={["E-Mail", "Brief", "Telefon", "Showroom"]} wert={kanal} onWahl={setKanal} label="Kanal" /></Feld>
        <Feld label="Erklärung des Kunden" id={id}><textarea id={id} className="bo-shop-input" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} /></Feld>
        <p className="bo-shop-hinweis">Der Server sendet bei der Anlage die Eingangsbestätigung an {doc.kunde_email || "die Bestell-E-Mail"}.</p>
      </div>
    </Dialog>
  );
}

/** Retoure: Prüfung abschließen (Wertminderung nur mit Belehrung, Betrag explizit). */
export function PruefungAbschliessen({ retoure, onSchliessen, onFertig, leitung }) {
  const [wm, setWm] = useState(Number(retoure.wertminderung_cent) || 0);
  const [belehrung, setBelehrung] = useState(false);
  const { laeuft, fehler, los } = useAusfuehren(() => onFertig());
  const basis = Number(retoure.basis_cent ?? retoure.erstattungsbetrag_cent) || 0;
  const senden = () => los("pruefung-abschliessen", retoure.name, { wertminderung_cent: wm, belehrungBestaetigt: belehrung, basis_cent: basis });
  useStrgEnter(true, senden);
  const wmErlaubt = leitung && retoure.widerruf && retoure.belehrungNachweisbar;
  return (
    <Dialog offen titel={`Prüfung abschließen · ${retoure.name}`} groesse="md" onSchliessen={onSchliessen} testid="dialog-pruefung"
      fuss={<Fuss onAbbrechen={onSchliessen} primaer={`Prüfung abschließen · ${cent(Math.max(basis - wm, 0))}`} onPrimaer={senden} laeuft={laeuft} deaktiviert={wm > 0 && !belehrung} />}>
      <div className="flex flex-col gap-4">
        <dl className="bo-shop-fakten">
          <div><dt>Zurückgegebene Positionen</dt><dd>{cent(basis)}</dd></div>
          <div><dt>Erstattungsbetrag danach</dt><dd>{cent(Math.max(basis - wm, 0))}</dd></div>
        </dl>
        <Feld label="Wertminderung" hinweis={wmErlaubt ? "nur bei Widerruf mit nachweisbarer Belehrung (§ 15 FAGG)" : "Ohne Belehrung keine Wertminderung (§ 15 FAGG)"}>
          <BetragFeld value={wm} onChange={(c) => setWm(c ?? 0)} maxCent={basis} disabled={!wmErlaubt} />
        </Feld>
        {wm > 0 && <Schalter label="Belehrung über Wertersatz lag vor" an={belehrung} onWechsel={setBelehrung} />}
        {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
      </div>
    </Dialog>
  );
}

/** Widerruf erstatten (E10): Positionen-Stepper, Hinsendekosten (§ 14 FAGG), Vorschau, Betrag im Knopf. */
export function WiderrufErstatten({ widerruf, bestellung, onSchliessen, onFertig, nachweis }) {
  const pos = bestellung.positionen || [];
  const [auswahl, setAuswahl] = useState(() => Object.fromEntries(pos.map((p) => [String(p.idx), (widerruf.positionen || []).some((w) => w.slug === p.slug || w.bezeichnung === p.bezeichnung) ? Number(p.menge) - Number(p.zurueck_menge || 0) : 0])));
  const versand = hinsendekosten(bestellung, auswahl);
  const v = erstattungRechnen(pos, auswahl, { versand_cent: versand });
  const [ergebnis, setErgebnis] = useState(null);
  const { laeuft, fehler, los } = useAusfuehren((e) => setErgebnis(e || {}));
  const senden = () => v.betrag_cent > 0 && los("widerruf-erstatten", widerruf.name, { zeilen: auswahl, versand_cent: versand, betrag_cent: v.betrag_cent, nachweis });
  useStrgEnter(!ergebnis, senden);
  return (
    <Dialog offen titel={`Widerruf erstatten · ${widerruf.name}`} groesse="lg" onSchliessen={onSchliessen} testid="dialog-widerruf-erstatten"
      fuss={ergebnis ? <div className="flex w-full justify-end"><Knopf variant="primary" onClick={() => onFertig()}>Schließen</Knopf></div> : <Fuss onAbbrechen={onSchliessen} primaer={`${cent(v.betrag_cent)} erstatten`} onPrimaer={senden} laeuft={laeuft} deaktiviert={!(v.betrag_cent > 0)} />}>
      {ergebnis ? (
        <div className="bo-shop-flaeche" data-ton="ok" role="status">
          <p className="font-semibold">{ergebnis.angefordert ? "Freigabe der Geschäftsführung angefordert" : `${cent(ergebnis.betrag_cent)} erstattet`}</p>
          {ergebnis.ueberBestellung && <p className="text-sm">{T.baender.widerrufGebucht}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pos.map((p) => {
            const offenM = Number(p.menge) - Number(p.zurueck_menge || 0);
            const m = auswahl[String(p.idx)] || 0;
            return (
              <div key={p.idx} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3"><Thumb bild={p.bild} /><span className="min-w-0"><span className="block font-medium">{p.bezeichnung}</span><span className="bo-shop-unter">{p.menge} × {cent(p.einzel_cent)}</span></span></span>
                <span className="bo-shop-stepper" role="group" aria-label={`Menge ${p.bezeichnung}`}>
                  <button type="button" aria-label="weniger" disabled={m <= 0} onClick={() => setAuswahl((a) => ({ ...a, [p.idx]: m - 1 }))}><ShopIcon name="Minus" /></button>
                  <output>{m}</output>
                  <button type="button" aria-label="mehr" disabled={m >= offenM} onClick={() => setAuswahl((a) => ({ ...a, [p.idx]: m + 1 }))}><ShopIcon name="Plus" /></button>
                </span>
              </div>
            );
          })}
          <div className="bo-shop-flaeche text-sm" aria-live="polite">
            <p>Hinsendekosten {cent(versand)} {versand ? "(Vollwiderruf)" : "(Teilwiderruf)"} · Rücksendekosten trägt der Kunde, wenn die Belehrung nachweisbar ist</p>
            <p className="mt-1 font-semibold tabular-nums">Erstattung {cent(v.betrag_cent)} {(v.posten || []).map((x) => `(enth. ${cent(x.ust_cent)} USt ${satzText(x.satz_promille)})`).join(" ")}</p>
          </div>
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

/** Datum ändern (Gültigkeit eines Gutscheins, Abholfrist). */
export function DatumDialog({ titel, wert, hinweis, bestaetigen = "Speichern", onSchliessen, onDatum, laeuft, fehler }) {
  const [d, setD] = useState(wert || "");
  const id = useId();
  return (
    <Dialog offen titel={titel} groesse="sm" onSchliessen={onSchliessen} fuss={<Fuss onAbbrechen={onSchliessen} primaer={bestaetigen} onPrimaer={() => d && onDatum(d)} laeuft={laeuft} deaktiviert={!d} />}>
      <div className="flex flex-col gap-3">
        <span id={`${id}-l`} className="bo-shop-label text-[13px] font-medium text-bo-text-soft">Datum</span>
        <Datumsfeld value={d} onChange={setD} aria-label="Datum" />
        {hinweis && <p className="bo-shop-hinweis">{hinweis}</p>}
        {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
      </div>
    </Dialog>
  );
}

/** Einmaliger Code (Ersetzen, S5): Schließen nur über „Fertig“, Rückfrage ohne Drucken/Senden. */
export function EinmalCode({ code, betrag, gutschein, onFertig }) {
  const [genutzt, setGenutzt] = useState(false);
  const [frage, setFrage] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  return (
    <Dialog offen titel="Neuer Gutschein-Code" groesse="md" sperren onSchliessen={() => {}} testid="einmal-code"
      fuss={<div className="flex w-full flex-wrap justify-end gap-2">
        <Knopf icon="Printer" onClick={() => (setGenutzt(true), window.print())}>Drucken</Knopf>
        <Knopf variant="primary" onClick={() => (genutzt ? onFertig() : setFrage(true))} data-testid="einmal-fertig">Fertig</Knopf>
      </div>}>
      <div className="flex flex-col gap-4">
        <div className="bo-shop-gutschein" data-motiv="seelicht">
          <span className="bo-wortmarke text-[13px]">PLATZHIRSCH</span>
          <span>
            <span className="block text-[13px] text-bo-text-soft">Gutschein {gutschein}</span>
            <span className="block text-[34px] font-light tabular-nums">{cent(betrag)}</span>
          </span>
          <span className="bo-shop-code" data-testid="einmal-code-wert">{code}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Knopf onClick={async () => { try { await navigator.clipboard.writeText(code); } catch { /* ohne Zwischenablage */ } setKopiert(true); setGenutzt(true); }}><ShopIcon name="Copy" /> Kopieren</Knopf>
          <span className="text-sm text-bo-text-soft" aria-live="polite">{kopiert ? T.toast.codeKopiert : ""}</span>
        </div>
        <p className="bo-shop-hinweis">{T.dialoge.einmalCode}</p>
        {frage && (
          <div className="bo-shop-flaeche flex flex-col gap-3" data-ton="warn" role="alertdialog" aria-label="Rückfrage">
            <p>{T.dialoge.einmalCodeFrage}</p>
            <div className="flex justify-end gap-2"><Knopf variant="ghost" onClick={() => setFrage(false)}>Zurück</Knopf><Knopf variant="danger-solid" onClick={onFertig}>Trotzdem schließen</Knopf></div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
