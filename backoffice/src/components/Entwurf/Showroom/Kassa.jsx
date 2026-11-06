"use client";

import { useState } from "react";
import {
  Banknote, ChevronLeft, CreditCard, FileText, Gift, Minus, Nfc, PauseCircle, Percent, Plus, ScanBarcode, Search,
  Smartphone, Store, Trash2, UserRoundSearch, X,
} from "lucide-react";
import Link from "next/link";
import { Bild, Ico, Wortmarke } from "./ui";
import { ThemeSwitch } from "./Shell";
import { ARTIKEL, KATEGORIEN, KUNDE_KASSA as K, kasse, zahl } from "./daten";

const START = [{ id: 1, n: 1 }, { id: 2, n: 1 }, { id: 3, n: 2 }];

const METHODEN = [
  { id: "karte", icon: CreditCard, t: "Karte", s: "Terminal 1 · kontaktlos" },
  { id: "mobil", icon: Smartphone, t: "Apple / Google Pay", s: "über Terminal 1" },
  { id: "bar", icon: Banknote, t: "Bar", s: "mit Rückgeld" },
  { id: "rechnung", icon: FileText, t: "Auf Rechnung", s: "Stammkundin · 14 Tage" },
];

function Kachel({ a, imKorb, onAdd }) {
  return (
    <button type="button" className={`sr-prod${imKorb ? " sr-prod--in" : ""}`} onClick={onAdd} aria-label={`${a.t}, ${kasse(a.p)}, hinzufügen`}>
      <span className="sr-prod__media">
        {a.bild ? (
          <Bild src={a.bild} sizes="200px" className="sr-fill" />
        ) : a.kat === "gutschein" ? (
          <span className="sr-prod__gift"><span><Wortmarke className="sr-prod__giftmark" title="Platzhirsch" /><b>250 €</b></span></span>
        ) : (
          <span className="sr-prod__mat"><Ico name={a.icon} /><span>{a.material}</span></span>
        )}
        <span className="sr-prod__stock">{a.lager}</span>
        {imKorb && <span className="sr-prod__qty num" key={imKorb.n}>{imKorb.n}</span>}
      </span>
      <span className="sr-prod__b">
        <span className="sr-prod__brand">{a.marke}</span>
        <span className="sr-prod__t">{a.t}</span>
        <span className="sr-prod__p">
          <span className="num">{kasse(a.p)}</span>
          <span className="sr-prod__add" aria-hidden="true"><Plus /></span>
        </span>
      </span>
    </button>
  );
}

function Bezahlen({ summe, onClose }) {
  const [methode, setMethode] = useState("karte");
  const terminal = methode === "karte" || methode === "mobil";
  return (
    <div className="sr-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sr-sheetdlg" role="dialog" aria-modal="true" aria-labelledby="sr-pay-h">
        <div className="sr-sheetdlg__h">
          <div>
            <div id="sr-pay-h" className="sr-label">Zu bezahlen · {K.name}</div>
            <div className="sr-display sr-sheetdlg__amt num">{kasse(summe)}</div>
          </div>
          <button type="button" className="sr-iconbtn sr-iconbtn--lg" aria-label="Schließen" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <div className="sr-methods" role="radiogroup" aria-label="Zahlungsart">
          {METHODEN.map((m) => (
            <button key={m.id} type="button" role="radio" className="sr-method" aria-checked={methode === m.id} onClick={() => setMethode(m.id)}>
              <span className="sr-method__ic"><m.icon aria-hidden="true" /></span>
              <span><b>{m.t}</b><small>{m.s}</small></span>
            </button>
          ))}
        </div>
        {terminal && (
          <div className="sr-terminal" role="status" aria-live="polite">
            <span className="sr-terminal__ring"><Nfc aria-hidden="true" /></span>
            <span className="sr-terminal__txt">
              <b>Warte auf Karte …</b>
              <small>Betrag an Terminal 1 übertragen. Das Terminal bestätigt die Zahlung selbst.</small>
            </span>
            <button type="button" className="sr-btn sr-btn--ghost">Abbrechen</button>
          </div>
        )}
        {methode === "bar" && (
          <div className="sr-cash">
            <div className="sr-label">Gegeben</div>
            <div className="sr-cash__quick">
              {[...new Set([10, 50, 100, 500].map((r) => Math.ceil(summe / r) * r))].slice(0, 3).map((v) => <button key={v} type="button" className="num">{kasse(v)}</button>)}
              <button type="button">Betrag …</button>
            </div>
            <button type="button" className="sr-pay" onClick={onClose}><Banknote aria-hidden="true" />Rückgeld berechnen</button>
          </div>
        )}
        {methode === "rechnung" && (
          <div className="sr-cash">
            <div className="sr-invoice">Rechnung an <b>Sophie Kalb</b>, Uferweg 12, 88131 Lindau · zahlbar in 14 Tagen</div>
            <button type="button" className="sr-pay" onClick={onClose}><FileText aria-hidden="true" />Rechnung erstellen</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Kassa() {
  const [kat, setKat] = useState("alle");
  const [korb, setKorb] = useState(START);
  const [zahlen, setZahlen] = useState(false);

  const add = (id) => setKorb((k) => (k.some((x) => x.id === id) ? k.map((x) => (x.id === id ? { ...x, n: x.n + 1 } : x)) : [...k, { id, n: 1 }]));
  const step = (id, d) => setKorb((k) => k.map((x) => (x.id === id ? { ...x, n: x.n + d } : x)).filter((x) => x.n > 0));

  const zeilen = korb.map((x) => ({ ...ARTIKEL.find((a) => a.id === x.id), n: x.n }));
  const zwischen = zeilen.reduce((s, z) => s + z.p * z.n, 0);
  const rabatt = Math.round(zwischen * 0.05 * 100) / 100;
  const summe = zwischen - rabatt;
  const ust = summe - summe / 1.2;
  const anzahl = zeilen.reduce((s, z) => s + z.n, 0);
  const artikel = ARTIKEL.filter((a) => (kat === "alle" ? a.beliebt : a.kat === kat));

  return (
    <div className="sr-kiosk">
      <div className="sr-kiosk__left">
        <div className="sr-kiosk__bar">
          <Link href="/entwurf/showroom" className="sr-iconbtn sr-iconbtn--lg sr-iconbtn--surface" aria-label="Zurück zur Zentrale"><ChevronLeft aria-hidden="true" /></Link>
          <Wortmarke className="sr-kiosk__mark" />
          <span className="sr-kiosk__ctx"><Store aria-hidden="true" />Showroom Lochau · Kassa 1 · Selin Aksoy</span>
          <span className="sr-kiosk__tools">
            <ThemeSwitch />
            <button type="button" className="sr-btn sr-btn--soft sr-btn--touch"><PauseCircle aria-hidden="true" />Parken</button>
          </span>
        </div>

        <label className="sr-scan">
          <Search aria-hidden="true" />
          <span className="sr-visually-hidden">Artikel scannen oder suchen</span>
          <input placeholder="Artikel scannen, suchen oder Preis eintippen" />
          <span className="sr-scan__btn"><ScanBarcode aria-hidden="true" />Kamera</span>
        </label>

        <div className="sr-cats" role="group" aria-label="Kategorien">
          {KATEGORIEN.map((c) => (
            <button key={c.id} type="button" aria-pressed={kat === c.id} onClick={() => setKat(c.id)}>
              <Ico name={c.icon} />{c.label}
            </button>
          ))}
        </div>

        <div className="sr-products" key={kat}>
          {artikel.map((a) => (
            <Kachel key={a.id} a={a} imKorb={korb.find((x) => x.id === a.id)} onAdd={() => add(a.id)} />
          ))}
        </div>
      </div>

      <aside className="sr-cart" aria-label="Warenkorb">
        <div className="sr-cart__h">
          <h2 className="sr-display">Warenkorb</h2>
          <span className="num">{anzahl} Artikel</span>
          <button type="button" className="sr-iconbtn sr-iconbtn--lg" aria-label="Warenkorb leeren" onClick={() => setKorb([])}><Trash2 aria-hidden="true" /></button>
        </div>

        <div className="sr-cust">
          <span className="sr-av" data-m={K.m} style={{ "--av": "44px" }}>{K.kurz}</span>
          <div className="sr-cust__txt">
            <div className="sr-cust__n">{K.name}</div>
            <div className="sr-cust__s">{K.ort} · Kundin seit {K.seit}</div>
          </div>
          <button type="button" className="sr-iconbtn sr-iconbtn--lg" aria-label="Andere Kundin wählen"><UserRoundSearch aria-hidden="true" /></button>
        </div>
        <div className="sr-loyal" data-tier={K.stufe}>
          <div className="sr-loyal__row">
            <span className="sr-loyal__tier">Kundenkarte · {K.stufeName}</span>
            <span className="sr-loyal__pts num">{zahl(K.punkte)} Punkte</span>
          </div>
          <div className="sr-loyal__hint">5 % Rabatt aktiv · noch {zahl(K.fehlt)} Punkte bis {K.naechste}</div>
          <div className="sr-loyal__bar"><span style={{ width: `${(K.punkte / (K.punkte + K.fehlt)) * 100}%` }} /></div>
        </div>

        <div className="sr-lines">
          {zeilen.map((z) => (
            <div className="sr-line" key={z.id}>
              {z.bild ? <Bild src={z.bild} sizes="48px" className="sr-line__img" /> : <span className="sr-line__img sr-line__mat"><Ico name={z.icon || "Gift"} /></span>}
              <div className="sr-line__txt">
                <div className="sr-line__t">{z.t}</div>
                <div className="sr-line__s num">{z.n > 1 ? `${z.n} × ${kasse(z.p)}` : z.marke}</div>
              </div>
              <div className="sr-line__r">
                <div className="sr-line__p num">{kasse(z.p * z.n)}</div>
                <div className="sr-step">
                  <button type="button" aria-label={`${z.t}, eins weniger`} onClick={() => step(z.id, -1)}>{z.n === 1 ? <Trash2 aria-hidden="true" /> : <Minus aria-hidden="true" />}</button>
                  <b aria-live="polite" className="num">{z.n}</b>
                  <button type="button" aria-label={`${z.t}, eins mehr`} onClick={() => step(z.id, 1)}><Plus aria-hidden="true" /></button>
                </div>
              </div>
            </div>
          ))}
          {zeilen.length === 0 && <div className="sr-empty">Artikel antippen oder scannen</div>}
        </div>

        <div className="sr-sums">
          <div><span>Zwischensumme</span><span className="num">{kasse(zwischen)}</span></div>
          <div className="sr-sums__disc"><span>Treuerabatt Eiche 5 %</span><span className="num">−{kasse(rabatt)}</span></div>
          <div><span>enthaltene USt. 20 %</span><span className="num">{kasse(ust)}</span></div>
        </div>
        <div className="sr-total"><span>Gesamt</span><b className="sr-display num">{kasse(summe)}</b></div>
        <button type="button" className="sr-pay" disabled={!zeilen.length} onClick={() => setZahlen(true)}><Nfc aria-hidden="true" />Bezahlen</button>
        <div className="sr-pay__sec">
          <button type="button"><Percent aria-hidden="true" />Rabatt</button>
          <button type="button"><Gift aria-hidden="true" />Gutschein</button>
          <button type="button"><FileText aria-hidden="true" />Rechnung</button>
        </div>
      </aside>

      {zahlen && <Bezahlen summe={summe} onClose={() => setZahlen(false)} />}
    </div>
  );
}
