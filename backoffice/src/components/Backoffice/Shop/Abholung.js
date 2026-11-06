"use client";
// Abholung am Packtisch/Kiosk (10-konzept-shop § 9.2; Lounge-Kiosk): Bausteine für die Packtisch-Shell der Logistik
// (Stub statt Warten, MASTER § 5.3 Regel 3) – `CodeTastenfeld`, `AbholungKarte`, `OhneCodeSuche`, `AbholungenHeute`
// und der fertige `AbholungArbeitsplatz`. Übergabe nur bei offen = 0 (E4), sonst „Kunde zur Kassa schicken“ mit großer
// Bestellnummer. Erfolgskarte bleibt bis zum nächsten Scan (kein Timer, WCAG 2.2.1). Physische Tastatur und Scanner
// tippen ins Feld; Ziele ≥ 56 px.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Knopf from "@/components/Backoffice/Knopf";
import { useToast } from "@/components/Backoffice/Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { cent, datum } from "@/lib/backoffice/format";
import { abholungSuchenAction, abholungOhneCodeAction, vormerkenAction } from "@/lib/backoffice/shop/actions";
import { Thumb } from "./Dialoge";
import ShopIcon from "./ShopIcon";

export const ABHOL_ZEICHEN = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

/** Tastenfeld 8 × 4 (32 Zeichen des Abholcode-Alphabets) + Löschen/Leeren; physische Tastatur geht mit. */
export function CodeTastenfeld({ wert, onWert, ergebnis }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, [contenteditable]")) return;
      const k = e.key.toUpperCase();
      if (k === "BACKSPACE") onWert(wert.slice(0, -1));
      else if (k.length === 1 && ABHOL_ZEICHEN.includes(k) && wert.length < 6) onWert(wert + k);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [wert, onWert]);
  return (
    <div className="flex flex-col gap-5" ref={ref}>
      <div className="bo-shop-codefeld" data-ergebnis={ergebnis || undefined} aria-live="polite" aria-label={`Abholcode ${wert.split("").join(" ") || "leer"}`} data-testid="abholcode-feld">
        {Array.from({ length: 6 }, (_, i) => <span key={i}>{wert[i] || ""}</span>)}
      </div>
      <div className="bo-shop-tasten" role="group" aria-label="Tastenfeld">
        {ABHOL_ZEICHEN.map((z) => <button key={z} type="button" onClick={() => wert.length < 6 && onWert(wert + z)} aria-label={z}>{z}</button>)}
      </div>
      <div className="flex gap-2">
        <Knopf size="kiosk" variant="secondary" icon="ArrowLeft" onClick={() => onWert(wert.slice(0, -1))}>Rückschritt</Knopf>
        <Knopf size="kiosk" variant="ghost" onClick={() => onWert("")}>Leeren</Knopf>
      </div>
    </div>
  );
}

/** Karte einer Abholung: Kunde, Positionen, Zahlstand, genau ein Knopf. */
export function AbholungKarte({ b, ohneCode = false, onFertig }) {
  const { starte } = useVerzoegerterCommit();
  const { zeige } = useToast();
  const [ausweis, setAusweis] = useState(false);
  const [kassa, setKassa] = useState(false);
  const [uebergeben, setUebergeben] = useState(false);
  const offen = Number(b.offen_cent) || 0;
  const ueberGeben = async () => {
    const r = await vormerkenAction({ aktion: "uebergeben", name: b.name, args: ohneCode ? { ohneCode: true, ausweis } : {} });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    setUebergeben(true);
    starte(r.text, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: `Übergabe ${b.name}`, onVerworfen: () => setUebergeben(false), onFehler: () => setUebergeben(false) });
  };
  if (kassa) {
    return (
      <div className="bo-kachel flex flex-col gap-4" data-testid="kassa-schicken">
        <p className="text-[17px] font-semibold">Bitte an der Kassa bezahlen</p>
        <p className="text-[13px] text-bo-text-soft">Bestellnummer</p>
        <p className="bo-shop-code bo-shop-code--gross" style={{ fontSize: 32 }}>{b.name}</p>
        <Knopf size="kiosk" variant="primary" onClick={onFertig}>Fertig</Knopf>
      </div>
    );
  }
  return (
    <div className="bo-kachel flex flex-col gap-4" data-testid="abholung-karte">
      <div>
        <p className="text-[22px] leading-7 font-semibold">{b.kunde_name}</p>
        <p className="bo-shop-zelle-nr">{b.name}{b.abholung_bis ? ` · bis ${datum(b.abholung_bis)}` : ""}</p>
      </div>
      {(b.positionen || []).length > 0 && (
        <ul className="flex flex-col gap-2">
          {b.positionen.map((p, i) => <li key={i} className="flex min-h-14 items-center gap-3 text-[16px]"><Thumb bild={p.bild} />{p.menge} × {p.bezeichnung}</li>)}
        </ul>
      )}
      {offen > 0 ? (
        <p className="bo-shop-flaeche flex items-center gap-2 text-[17px] font-semibold" data-ton="warn"><ShopIcon name="CircleX" /> Offen {cent(offen)}</p>
      ) : (
        <p className="bo-shop-flaeche flex items-center gap-2 text-[17px] font-semibold" data-ton="ok"><ShopIcon name="Check" /> Bezahlt</p>
      )}
      {ohneCode && offen === 0 && (
        <>
          <p className="bo-shop-flaeche" data-ton="warn">Ausweis prüfen – kein Abholcode.</p>
          <label className="flex min-h-12 items-center gap-3 text-[17px]"><input type="checkbox" className="size-6" checked={ausweis} onChange={(e) => setAusweis(e.target.checked)} data-testid="ausweis-geprueft" /> Ausweis geprüft</label>
        </>
      )}
      {uebergeben ? (
        <p className="bo-shop-flaeche flex items-center gap-2 text-[17px] font-semibold" data-ton="ok" role="status"><ShopIcon name="CheckCheck" /> Übergeben an {b.kunde_name}</p>
      ) : offen === 0 ? (
        <Knopf size="kiosk" variant="primary" disabled={ohneCode && !ausweis} onClick={ueberGeben} data-testid="uebergeben">Übergeben an {b.kunde_name.split(" ").slice(-1)[0]}</Knopf>
      ) : (
        <Knopf size="kiosk" variant="secondary" onClick={() => setKassa(true)} data-testid="zur-kassa">Kunde zur Kassa schicken</Knopf>
      )}
      {uebergeben && <Knopf size="kiosk" variant="ghost" onClick={onFertig}>Nächster</Knopf>}
    </div>
  );
}

/** Ohne Code: Name oder Bestellnummer suchen (Trefferzeilen 56 px). */
export function OhneCodeSuche({ onWahl }) {
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [, start] = useTransition();
  useEffect(() => {
    const t = setTimeout(() => start(async () => {
      const r = await abholungOhneCodeAction({ q });
      setTreffer(r.ok ? r.ergebnis : []);
    }), 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="flex flex-col gap-3" data-testid="ohne-code">
      <input className="bo-shop-input" style={{ minHeight: 56, fontSize: 18 }} autoFocus placeholder="Name oder Bestellnummer" aria-label="Name oder Bestellnummer" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="flex flex-col gap-2">
        {treffer.map((t) => (
          <li key={t.name}><button type="button" className="bo-shop-zeile w-full text-left" style={{ minHeight: 56 }} onClick={() => onWahl(t)}><span className="bo-shop-zeile__ico"><ShopIcon name="User" /></span><span className="min-w-0"><span className="bo-shop-zeile__titel block">{t.kunde_name}</span><span className="bo-shop-unter">{t.name}</span></span><span className="tabular-nums">{t.offen_cent ? `offen ${cent(t.offen_cent)}` : "bezahlt"}</span></button></li>
        ))}
      </ul>
    </div>
  );
}

/** Kachel „Abholungen heute (n)“ – sortiert nach Abholfrist. */
export function AbholungenHeute({ liste = [], onWahl }) {
  return (
    <div className="bo-kachel" data-testid="abholungen-heute">
      <p className="bo-kachel__titel mb-3">Abholungen heute ({liste.length})</p>
      {liste.length ? (
        <ul className="bo-shop-zeilen">
          {liste.map((b) => <li key={b.name}><button type="button" className="bo-shop-zeile w-full text-left" style={{ minHeight: 56 }} onClick={() => onWahl(b)}><span className="bo-shop-zeile__ico" data-ton={b.offen_cent ? "eiche" : "salbei"}><ShopIcon name="ShoppingBag" /></span><span className="min-w-0"><span className="bo-shop-zeile__titel block truncate">{b.kunde_name}</span><span className="bo-shop-unter">{b.name} · bis {datum(b.abholung_bis)}</span></span><span className="tabular-nums">{b.offen_cent ? `offen ${cent(b.offen_cent)}` : ""}</span></button></li>)}
        </ul>
      ) : <p className="text-[15px] text-bo-text-soft">Keine Abholungen offen.</p>}
    </div>
  );
}

/** Komplett: Code-Eingabe links, Karte bzw. Abholungen rechts. */
export function AbholungArbeitsplatz({ heute = [] }) {
  const [code, setCode] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const [karte, setKarte] = useState(null);
  const [ohne, setOhne] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [, start] = useTransition();
  const suche = useCallback((c) => start(async () => {
    const r = await abholungSuchenAction({ code: c });
    if (!r.ok) {
      setErgebnis("unbekannt");
      setMeldung("Kein Abholcode gefunden.");
      return;
    }
    setErgebnis("erkannt");
    setMeldung("");
    setKarte({ b: { ...r.ergebnis, positionen: r.ergebnis.positionen }, ohneCode: false });
  }), []);
  const wert = (c) => {
    setCode(c);
    setErgebnis(null);
    if (c.length === 6) suche(c);
  };
  const neu = () => {
    setKarte(null);
    setCode("");
    setErgebnis(null);
    setOhne(false);
  };
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2" data-testid="abholung">
      <div className="bo-kachel flex flex-col gap-5">
        <p className="flex items-center gap-2 text-[17px] font-semibold"><ShopIcon name="ScanLine" className="size-5" /> Abholcode scannen oder eingeben</p>
        <CodeTastenfeld wert={code} onWert={wert} ergebnis={ergebnis} />
        <p className="min-h-6 text-[15px] font-medium text-bo-ziegel-text" role="status">{meldung}</p>
        <Knopf size="kiosk" variant="secondary" icon="Search" onClick={() => { setOhne(true); setKarte(null); }} data-testid="ohne-code-knopf">Ohne Code suchen</Knopf>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        {karte ? <AbholungKarte key={karte.b.name} b={karte.b} ohneCode={karte.ohneCode} onFertig={neu} /> : ohne ? <OhneCodeSuche onWahl={(t) => setKarte({ b: { ...t, positionen: [] }, ohneCode: true })} /> : <AbholungenHeute liste={heute} onWahl={(b) => setKarte({ b, ohneCode: true })} />}
      </div>
    </div>
  );
}
