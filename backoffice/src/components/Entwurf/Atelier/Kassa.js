"use client";
import { useMemo, useState } from "react";
import { Banknote, CreditCard, FileText, Minus, Plus, ScanBarcode, UserRound, X } from "lucide-react";
import { UserMenu } from "./ThemeRoot";
import { Wortmarke } from "./Shell";
import { IMG, kategorien, produkte } from "./data";

const eur = (v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);

// Produktbild: freigestelltes Foto auf Mulde. Ohne Foto: Marke und Name, Materialpunkt.
function Bild({ p, small }) {
  if (p.img) return <img src={IMG(p.img)} alt="" />;
  const [marke] = p.b.split(" · ");
  return (
    <div className="type">
      {small ? null : <span><b>{marke}</b>{p.n}</span>}
      <i style={{ background: p.dot }} />
    </div>
  );
}

export default function Kassa() {
  const [kat, setKat] = useState("Alle");
  const [cart, setCart] = useState({ p1: 1, p3: 2, p6: 1 });
  const [last, setLast] = useState(null);
  const [zahl, setZahl] = useState("karte");
  const [kunde, setKunde] = useState(true);

  const liste = kat === "Alle" ? produkte : produkte.filter((p) => p.kat === kat);
  const zeilen = Object.entries(cart).filter(([, n]) => n > 0).map(([id, q]) => ({ ...produkte.find((p) => p.id === id), q }));
  const summe = useMemo(() => zeilen.reduce((s, z) => s + z.p * z.q, 0), [zeilen]);
  const rabatt = kunde ? Math.round(summe * 0.05 * 100) / 100 : 0;
  const total = summe - rabatt;
  const mwst = total - total / 1.2;
  const stueck = zeilen.reduce((s, z) => s + z.q, 0);

  function add(id, d = 1) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
    if (d > 0) setLast(id);
  }

  return (
    <div className="at-kiosk" data-kiosk="">
      <header className="at-kbar">
        <Wortmarke />
        <span className="place">Kassa 1 · Showroom Lochau</span>
        <div className="right">
          <span className="online">Verbunden</span>
          <span className="num">Mi 4. Nov. · 10:40</span>
          <UserMenu short="Lena W." sub={null} up={false} />
        </div>
      </header>

      <div className="at-kbody">
        <section className="at-kleft" aria-label="Artikel">
          <label className="at-scan">
            <ScanBarcode aria-hidden="true" />
            <span className="sr">Artikel scannen oder suchen</span>
            <input placeholder="Artikel scannen oder suchen" inputMode="search" />
            <span className="hint"><i aria-hidden="true" />Scanner bereit</span>
          </label>
          <div className="at-cats" role="group" aria-label="Kategorie">
            {kategorien.map((k) => (
              <button key={k} type="button" aria-pressed={kat === k} onClick={() => setKat(k)}>{k}</button>
            ))}
          </div>
          <div className="at-prods-wrap">
            <div className="at-prods">
              {liste.map((p) => (
                <button key={p.id} type="button" className="at-prod" onClick={() => add(p.id)} aria-label={`${p.n}, ${eur(p.p)}, in den Warenkorb${cart[p.id] ? `, bereits ${cart[p.id]}` : ""}`}>
                  <div className="img"><Bild p={p} /></div>
                  <div className="n">{p.n}</div>
                  <div className="b">{p.t}</div>
                  <div className="foot"><span className="p">{eur(p.p)}</span>{cart[p.id] ? <span className="in">{cart[p.id]} im Korb</span> : null}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="at-kright" aria-label="Warenkorb">
          {kunde ? (
            <div className="at-kcust">
              <span className="at-avatar t1 m" aria-hidden="true">VH</span>
              <div><b>Valerie Haldner</b><span className="tier"><i aria-hidden="true" />Kundenkarte Gold · 5 % Vorteil</span></div>
              <div className="card"><span className="serif">4.860</span><span>Punkte</span></div>
              <button type="button" className="at-iconbtn" aria-label="Kundin entfernen" onClick={() => setKunde(false)}><X aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="at-kcust">
              <span className="at-avatar m" aria-hidden="true"><UserRound size={18} /></span>
              <div><b>Laufkundschaft</b><span>Kundenkarte scannen oder Kunde suchen</span></div>
              <button type="button" className="at-btn line" style={{ marginLeft: "auto", height: 44 }} onClick={() => setKunde(true)}>Kunde zuordnen</button>
            </div>
          )}

          <ul className="at-cart">
            {zeilen.map((z) => (
              <li key={z.id} className={last === z.id ? "added" : ""}>
                <div className="th"><Bild p={z} small /></div>
                <div>
                  <b>{z.n}</b>
                  <span className="s">{z.b}</span>
                  <div>
                    <span className="at-qty">
                      <button type="button" aria-label={`${z.n} eins weniger`} onClick={() => add(z.id, -1)}><Minus aria-hidden="true" /></button>
                      <span aria-live="polite">{z.q}</span>
                      <button type="button" aria-label={`${z.n} eins mehr`} onClick={() => add(z.id, 1)}><Plus aria-hidden="true" /></button>
                    </span>
                  </div>
                </div>
                <div className="r"><span className="serif">{eur(z.p * z.q)}</span>{z.q > 1 ? <span className="each">je {eur(z.p)}</span> : null}</div>
              </li>
            ))}
            {!zeilen.length ? <li className="empty">Noch leer – Artikel scannen oder antippen.</li> : null}
          </ul>

          <div className="at-sum">
            <div className="row"><span>Zwischensumme · {stueck} Artikel</span><span>{eur(summe)}</span></div>
            {kunde ? <div className="row"><span>Kundenkarte Gold −5 %</span><span>−{eur(rabatt)}</span></div> : null}
            <div className="row"><span>enthaltene MwSt. 20 %</span><span>{eur(mwst)}</span></div>
            <div className="total"><span>Zu bezahlen</span><span className="serif">{eur(total)}</span></div>
            <div className="at-paym" role="group" aria-label="Zahlart">
              <button type="button" aria-pressed={zahl === "karte"} onClick={() => setZahl("karte")}><CreditCard aria-hidden="true" />Karte</button>
              <button type="button" aria-pressed={zahl === "bar"} onClick={() => setZahl("bar")}><Banknote aria-hidden="true" />Bar</button>
              <button type="button" aria-pressed={zahl === "rechnung"} onClick={() => setZahl("rechnung")}><FileText aria-hidden="true" />Rechnung</button>
            </div>
            <button type="button" className="at-pay" disabled={!zeilen.length}>
              <span>{zahl === "karte" ? "Am Terminal bezahlen" : zahl === "bar" ? "Bar kassieren" : "Auf Rechnung buchen"}</span>
              <span className="serif">{eur(total)}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
