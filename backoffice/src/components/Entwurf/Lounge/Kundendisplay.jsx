"use client";

import Image from "next/image";
import { Check, Gift, Nfc, Sparkles, Truck } from "lucide-react";
import { BILD, PRODUKTE } from "./daten";

// Kundendisplay (Entwurf). Zustände nach Konzept 10 §9: ruhe · einkauf · bezahlen · danke (+ zahlart=bar|karte).
// Datensparsam: keine Namen, keine Kontaktdaten. Kundenkarte nur als Stufe + eingelöste Leistungsvorteile.

const eur = (v) => v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const KORB = [
  { id: 3, n: 1 }, { id: 4, n: 2 }, { id: 5, n: 6 }, { id: 6, n: 1 }, { id: 7, n: 2 },
];
const GUTSCHEIN = 50;
const RUHE_BILDER = ["r-wohnen-sofa.jpg", "r-kueche-eiche.jpg", "r-terrasse-see.jpg"];

/** Dekoratives QR-Muster (Platzhalter, deterministisch) – in der Bauphase echter Code. */
function QR({ label }) {
  const n = 25; const cells = [];
  let x = 1337;
  const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!finder(r, c) && rnd() > 0.52) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
  const F = ({ r, c }) => (<g><rect x={c} y={r} width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1" transform="translate(0.5 0.5) scale(0.857)" style={{ transformBox: "fill-box" }} /><rect x={c + 2} y={r + 2} width="3" height="3" rx="0.8" /></g>);
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="lg-qr" role="img" aria-label={label}>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} rx="2.5" className="lg-qr__bg" />
      <g className="lg-qr__fg">{cells}<F r={0} c={0} /><F r={0} c={n - 7} /><F r={n - 7} c={0} /></g>
    </svg>
  );
}

function Ruhe() {
  return (
    <div className="kd-ruhe">
      <div className="kd-ruhe__bilder" aria-hidden="true">
        {RUHE_BILDER.map((b, i) => (
          <span key={b} className="kd-ruhe__bild" style={{ "--i": i }}><Image src={BILD(b)} alt="" fill sizes="100vw" preload={i === 0} /></span>
        ))}
      </div>
      <div className="kd-ruhe__panel">
        <p className="kd-mark">PLATZHIRSCH</p>
        <p className="kd-ruhe__sub">Home Living · Lochau am Bodensee</p>
        <p className="kd-ruhe__gruss">Schön, dass Sie da sind.</p>
        <div className="kd-ruhe__karten">
          <div className="kd-glass">
            <Sparkles size={28} strokeWidth={1.5} aria-hidden="true" />
            <p><b>Kundenkarte</b> Lieferung frei, Pflege-Service und Vorab-Zugang zu Events – fragen Sie uns gern.</p>
          </div>
          <div className="kd-glass">
            <span className="kd-glass__datum"><b>19</b>Nov</span>
            <p><b>Herbstabend im Showroom</b> Neue Outdoor-Kollektion, ab 18 Uhr</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Einkauf({ zeilen, summe }) {
  const sicht = zeilen.slice(-6);
  return (
    <div className="kd-einkauf">
      <section className="kd-list" aria-label="Ihr Einkauf">
        <p className="kd-gruss">Guten Tag</p>
        <ol>
          {sicht.map((z, i) => (
            <li key={z.id} className={`kd-pos${i === sicht.length - 1 ? " is-new" : ""}`} style={{ "--i": i }}>
              <span className="kd-pos__img"><Image src={BILD(z.bild)} alt="" fill sizes="120px" /></span>
              <span className="kd-pos__txt"><span className="kd-pos__name">{z.name}</span><span className="kd-pos__marke">{z.marke}{z.n > 1 ? ` · ${z.n} × ${eur(z.preis)}` : ""}</span></span>
              <span className="kd-pos__preis">{eur(z.preis * z.n)}</span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="kd-sum">
        <div className="kd-karte">
          <span className="kd-karte__chip" aria-hidden="true">P+</span>
          <span><span className="kd-karte__cap">Kundenkarte erkannt</span><b>Platzhirsch Plus</b></span>
        </div>
        <ul className="kd-vorteile">
          <li><Truck size={24} strokeWidth={1.5} aria-hidden="true" />Lieferung frei<span><Check size={20} strokeWidth={2} aria-hidden="true" />eingelöst</span></li>
          <li><Sparkles size={24} strokeWidth={1.5} aria-hidden="true" />Pflege-Service<span className="is-later">verfügbar</span></li>
        </ul>
        <dl className="kd-rows">
          <div><dt>Zwischensumme</dt><dd>{eur(summe)}</dd></div>
          <div><dt><Gift size={20} strokeWidth={1.5} aria-hidden="true" />Gutschein …4821</dt><dd>− {eur(GUTSCHEIN)}</dd></div>
          <div className="kd-rows__ust"><dt>darin 20 % USt.</dt><dd>{eur((summe - GUTSCHEIN) / 1.2 * 0.2)}</dd></div>
        </dl>
        <div className="kd-total"><span>Gesamt</span><b>{eur(summe - GUTSCHEIN)}</b></div>
      </aside>
    </div>
  );
}

function Bezahlen({ betrag, bar }) {
  return (
    <div className="kd-pay">
      <p className="kd-pay__cap">Zu bezahlen</p>
      <p className="kd-pay__betrag">{eur(betrag)}</p>
      {bar ? (
        <dl className="kd-bar">
          <div><dt>Gegeben</dt><dd>{eur(1200)}</dd></div>
          <div className="is-rueck"><dt>Rückgeld</dt><dd>{eur(1200 - betrag)}</dd></div>
        </dl>
      ) : (
        <div className="kd-terminal">
          <span className="kd-terminal__ico"><Nfc size={56} strokeWidth={1.5} aria-hidden="true" /><i /><i /></span>
          <p>Bitte Karte oder Telefon<br />an das Terminal halten</p>
        </div>
      )}
    </div>
  );
}

function Danke({ betrag, bar }) {
  return (
    <div className="kd-danke">
      <div className="kd-danke__main">
        <svg className="kd-check" viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="33" className="lg-check__ring" />
          <path d="M22 37.5 L32 47 L51 27" className="lg-check__tick" />
        </svg>
        <p className="kd-danke__t">Vielen Dank</p>
        {bar ? <p className="kd-danke__sub">Rückgeld <b>{eur(1200 - betrag)}</b></p> : <p className="kd-danke__sub">Kartenzahlung erhalten · <b>{eur(betrag)}</b></p>}
        <p className="kd-danke__hint">Vorteil „Lieferung frei“ ist auf Ihrem Beleg vermerkt.</p>
      </div>
      <div className="kd-danke__qr">
        <div className="kd-qrkarte">
          <QR label="QR-Code für den digitalen Beleg (Beispiel)" />
          <p><b>Digitaler Beleg</b>Mit der Kamera scannen</p>
        </div>
      </div>
    </div>
  );
}

export default function Kundendisplay({ zustand = "ruhe", zahlart = "karte" }) {
  const zeilen = KORB.map((k) => ({ ...PRODUKTE.find((p) => p.id === k.id), n: k.n }));
  const summe = zeilen.reduce((s, z) => s + z.preis * z.n, 0);
  const bar = zahlart === "bar";
  return (
    <div className="kd" data-zustand={zustand}>
      {zustand === "ruhe" && <Ruhe />}
      {zustand === "einkauf" && <Einkauf zeilen={zeilen} summe={summe} />}
      {zustand === "bezahlen" && <Bezahlen betrag={summe - GUTSCHEIN} bar={bar} />}
      {zustand === "danke" && <Danke betrag={summe - GUTSCHEIN} bar={bar} />}
      {zustand !== "ruhe" && <p className="kd-foot"><span className="kd-mark kd-mark--s">PLATZHIRSCH</span><span>Kassa 1 · Showroom Lochau</span></p>}
    </div>
  );
}
