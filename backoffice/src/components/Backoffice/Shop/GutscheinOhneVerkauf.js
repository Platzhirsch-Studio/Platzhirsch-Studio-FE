"use client";
// S5 „Gutschein ohne Verkauf“ (10-konzept-shop § 6.4, E2; nur Leitung): Wert-Kacheln, Pflichtgrund, Motiv, Für,
// Grußtext, Vorschau. Art fest Mehrzweck, Gültigkeit aus den Einstellungen. Ergebnis: Code einmalig sichtbar.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/Backoffice/Overlay";
import Knopf from "@/components/Backoffice/Knopf";
import BetragFeld from "@/components/Backoffice/Eingabe/BetragFeld";
import { cent } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/shop/texte";
import { gutscheinOhneVerkaufAction } from "@/lib/backoffice/shop/actions";
import { EinmalCode, idem } from "./Dialoge";

const WERTE = [2500, 5000, 10000, 20000, 50000];

export default function GutscheinOhneVerkauf({ basis = "/shop/gutscheine", min = 1000, max = 100000 }) {
  const router = useRouter();
  const [wert, setWert] = useState(10000);
  const [grund, setGrund] = useState("");
  const [bezug, setBezug] = useState("");
  const [motiv, setMotiv] = useState("seelicht");
  const [fuer, setFuer] = useState("");
  const [gruss, setGruss] = useState("");
  const [mehr, setMehr] = useState(false);
  const [senden, setSenden] = useState("");
  const [test, setTest] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [laeuft, start] = useTransition();
  const schluessel = useMemo(() => idem(), []);
  const g = [grund, bezug.trim()].filter(Boolean).join(" – ");
  const grenzFehler = wert < min || wert > max ? `Wert zwischen ${cent(min)} und ${cent(max)}` : null;
  const ausstellen = () =>
    start(async () => {
      setFehler(null);
      const r = await gutscheinOhneVerkaufAction({ wert_cent: wert, grund: g, motiv, empfaenger: fuer, grusstext: gruss, senden_an: senden, test, idempotency: schluessel });
      if (!r.ok) setFehler(r.message);
      else setErgebnis(r.ergebnis);
    });
  if (ergebnis) return <EinmalCode code={ergebnis.code} betrag={ergebnis.wert_cent} gutschein={ergebnis.gutschein} onFertig={() => router.push(`/shop/gutscheine/${encodeURIComponent(ergebnis.gutschein)}`)} />;
  return (
    <Dialog offen titel={T.dialoge.s5} groesse="lg" onSchliessen={() => router.replace(basis, { scroll: false })} testid="dialog-s5"
      fuss={<div className="flex w-full flex-wrap justify-end gap-2"><Knopf variant="ghost" onClick={() => router.replace(basis, { scroll: false })}>Abbrechen</Knopf><Knopf variant="primary" onClick={ausstellen} laedt={laeuft} disabled={!grund || !!grenzFehler} kuerzel="Strg+Enter" data-testid="s5-ausstellen">Ausstellen</Knopf></div>}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col gap-5">
          <div className="bo-shop-feld">
            <span className="bo-shop-label">Wert *</span>
            <div className="bo-shop-wahl" role="radiogroup" aria-label="Wert">
              {WERTE.map((w) => <button key={w} type="button" role="radio" aria-checked={wert === w} onClick={() => setWert(w)}>{cent(w).replace(",00", "")}</button>)}
            </div>
            <BetragFeld value={wert} onChange={(c) => setWert(c ?? 0)} aria-label="anderer Betrag" />
            {grenzFehler && <p className="bo-shop-fehler">{grenzFehler}</p>}
          </div>
          <div className="bo-shop-feld">
            <span className="bo-shop-label">Grund *</span>
            <div className="bo-shop-wahl" role="radiogroup" aria-label="Grund">
              {T.gruende.ohneVerkauf.map((w) => <button key={w} type="button" role="radio" aria-checked={grund === w} onClick={() => setGrund(w)}>{w}</button>)}
            </div>
            <input className="bo-shop-input" placeholder="Bezug, z. B. Servicefall …" aria-label="Bezug" value={bezug} onChange={(e) => setBezug(e.target.value)} maxLength={100} />
          </div>
          <div className="bo-shop-feld">
            <span className="bo-shop-label">Motiv</span>
            <div className="bo-shop-wahl" role="radiogroup" aria-label="Motiv">
              {[["schlicht", "Schlicht"], ["seelicht", "Seelicht"], ["geweih", "Geweih"]].map(([w, t]) => <button key={w} type="button" role="radio" aria-checked={motiv === w} onClick={() => setMotiv(w)}>{t}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="bo-shop-feld"><span className="bo-shop-label">Für</span><input className="bo-shop-input" value={fuer} onChange={(e) => setFuer(e.target.value)} maxLength={80} /></label>
            <label className="bo-shop-feld"><span className="bo-shop-label">Grußtext <span className="font-normal text-bo-text-faint">{gruss.length}/300</span></span><input className="bo-shop-input" value={gruss} onChange={(e) => setGruss(e.target.value)} maxLength={300} /></label>
          </div>
          <button type="button" className="self-start text-[13px] font-medium text-bo-text-soft hover:text-bo-text" aria-expanded={mehr} onClick={() => setMehr((x) => !x)}>{mehr ? "▾" : "▸"} Weitere Angaben</button>
          {mehr && (
            <div className="flex flex-col gap-3">
              <label className="bo-shop-feld"><span className="bo-shop-label">Senden an (E-Mail)</span><input className="bo-shop-input" type="email" value={senden} onChange={(e) => setSenden(e.target.value)} /></label>
              <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} /> Testgutschein</label>
            </div>
          )}
          <p className="bo-shop-hinweis">Art Mehrzweck, Gültigkeit laut Einstellungen. Gutscheine verkaufen: an der Kassa.</p>
          {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
        </div>
        <div className="bo-shop-gutschein bo-anim-fade" data-motiv={motiv} key={motiv} aria-label="Vorschau">
          <span className="bo-wortmarke text-[12px]">PLATZHIRSCH</span>
          <span>
            <span className="block text-[13px] text-bo-text-soft">Gutschein{fuer ? ` für ${fuer}` : ""}</span>
            <span className="block text-[34px] font-light tabular-nums">{cent(wert)}</span>
          </span>
          <span className="bo-shop-code" style={{ fontSize: 15 }}>····-····</span>
        </div>
      </div>
    </Dialog>
  );
}
