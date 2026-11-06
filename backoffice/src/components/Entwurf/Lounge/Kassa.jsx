"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowLeftRight, Banknote, Check, ChevronLeft, CreditCard, FileText, Gift, Lock, Minus, MoreHorizontal, Plus,
  Receipt, ScanLine, Search, Truck, Sparkles, Ticket,
} from "lucide-react";
import { ThemeKnopf } from "./Shell";
import { BASIS, BILD, KATEGORIEN, KUNDE_KASSA, LAGER, PRODUKTE, WARENKORB_START } from "./daten";
import { Av, Ico, Rund, Schalter, Segment, Wortmarke } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const VORTEIL_ICON = { lieferung: Truck, pflege: Sparkles, event: Ticket };
const eur = (v) => v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function Statuszeile() {
  return (
    <header className="lg-kbar">
      <div className="lg-kbar__l">
        <a href={BASIS} className="lg-round lg-round--s" aria-label="Zur Zentrale"><ChevronLeft {...S} /></a>
        <Wortmarke sub={false} />
        <span className="lg-kbar__sep" aria-hidden="true" />
        <span className="lg-kbar__ctx"><b>Kassa 1</b> · Showroom Lochau · Bon K1-000124</span>
      </div>
      <div className="lg-kbar__r">
        <span className="lg-kbar__ok"><i aria-hidden="true" />Bereit</span>
        <span className="lg-kbar__uhr lg-num">14:32</span>
        <span className="lg-kbar__op"><Av kurz="EK" size={32} ring={false} />Elif</span>
        <Rund label="Belege" groesse="s"><Receipt {...s16} /></Rund>
        <ThemeKnopf />
        <Rund label="Weitere Funktionen" groesse="s"><MoreHorizontal {...s16} /></Rund>
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--s"><Lock {...s16} />Sperren</button>
      </div>
    </header>
  );
}

function Erfolg({ betrag, onWeiter }) {
  const [mail, setMail] = useState(true);
  return (
    <div className="lg-sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="erfolg-t">
      <div className="lg-sheet">
        <span className="lg-sheet__grip" aria-hidden="true" />
        <svg className="lg-check" viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="33" className="lg-check__ring" />
          <path d="M22 37.5 L32 47 L51 27" className="lg-check__tick" />
        </svg>
        <p className="lg-cap">Kartenzahlung · Beleg K1-000124</p>
        <h2 id="erfolg-t" className="lg-sheet__betrag lg-num">{eur(betrag)}</h2>
        <p className="lg-sheet__sub">Bezahlt. Vorteil „Lieferung frei“ eingelöst ✓</p>
        <div className="lg-sheet__opts">
          <Schalter an={mail} onChange={setMail} label="Beleg per E-Mail an m.koehler@…" />
          <Schalter an={false} label="Beleg drucken" />
        </div>
        <button type="button" className="lg-btn lg-btn--ink lg-btn--xl" onClick={onWeiter}>Nächster Kunde</button>
      </div>
    </div>
  );
}

export default function Kassa() {
  const [kat, setKat] = useState("alle");
  const [korb, setKorb] = useState(WARENKORB_START);
  const [vorteil, setVorteil] = useState("lieferung");
  const [zahlart, setZahlart] = useState("karte");
  const [bezahlt, setBezahlt] = useState(false);

  const produkte = kat === "alle" ? PRODUKTE : PRODUKTE.filter((p) => p.kat === kat);
  const zeilen = korb.map((k) => ({ ...PRODUKTE.find((p) => p.id === k.id), n: k.n }));
  const summe = useMemo(() => zeilen.reduce((s, z) => s + z.preis * z.n, 0), [zeilen]);
  const ust = summe / 1.2 * 0.2;
  const anzahl = zeilen.reduce((s, z) => s + z.n, 0);
  const menge = (id) => korb.find((k) => k.id === id)?.n || 0;
  const aendern = (id, d) => setKorb((k) => {
    const da = k.find((x) => x.id === id);
    if (!da) return d > 0 ? [...k, { id, n: 1 }] : k;
    return k.map((x) => (x.id === id ? { ...x, n: Math.max(0, x.n + d) } : x)).filter((x) => x.n > 0);
  });
  const vt = KUNDE_KASSA.vorteile.find((v) => v.id === vorteil);

  return (
    <div className="lg-kassa">
      <Statuszeile />
      <div className="lg-kassa__body">
        <section className="lg-kassa__sort" aria-label="Sortiment">
          <div className="lg-kassa__search">
            <label className="lg-search lg-search--l">
              <ScanLine {...S} />
              <input type="search" placeholder="Artikel scannen, suchen oder Preis eintippen" aria-label="Artikel scannen oder suchen" />
            </label>
            <Rund label="Suchen"><Search {...S} /></Rund>
          </div>
          <nav className="lg-kat" aria-label="Kategorien">
            {KATEGORIEN.map((k) => (
              <button key={k.id} type="button" className={`lg-kat__i${kat === k.id ? " is-on" : ""}`} aria-pressed={kat === k.id} onClick={() => setKat(k.id)}>
                <span className="lg-kat__ico"><Ico name={k.icon} size={24} /></span>
                <span className="lg-kat__label">{k.label}</span>
              </button>
            ))}
          </nav>
          <ul className="lg-prods">
            {produkte.map((p, i) => {
              const n = menge(p.id);
              return (
                <li key={p.id} className="lg-prod" style={{ "--i": i }}>
                  <div className="lg-prod__img">
                    {p.gutschein ? (
                      <span className="lg-gutschein" aria-hidden="true"><span>PLATZHIRSCH</span><b>250 €</b></span>
                    ) : (
                      <Image src={BILD(p.bild)} alt="" fill sizes="220px" />
                    )}
                    {LAGER[p.id] != null && <span className="lg-prod__lager">{LAGER[p.id]} im Lager</span>}
                    {n > 0 && <span className="lg-prod__n" role="img" aria-label={`${n} im Warenkorb`}>{n}</span>}
                  </div>
                  <div className="lg-prod__txt">
                    <p className="lg-prod__marke">{p.marke}</p>
                    <p className="lg-prod__name">{p.name}</p>
                    <div className="lg-prod__foot">
                      <span className="lg-prod__preis lg-num">{eur(p.preis)}</span>
                      <button type="button" className="lg-plus" aria-label={`${p.name} hinzufügen`} onClick={() => aendern(p.id, 1)}><Plus {...S} /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="lg-cart" aria-label="Warenkorb">
          <div className="lg-cart__kunde">
            <Av kurz={KUNDE_KASSA.kurz} m={KUNDE_KASSA.m} size={44} name={KUNDE_KASSA.name} ring={false} />
            <div className="lg-cart__kname">
              <p className="lg-strong">{KUNDE_KASSA.name}</p>
              <p className="lg-cart__stufe"><span className="lg-karte__chip lg-karte__chip--s" aria-hidden="true">P+</span>{KUNDE_KASSA.stufe}</p>
            </div>
            <Rund label="Kunde wechseln" groesse="s"><ArrowLeftRight {...s16} /></Rund>
          </div>
          <div className="lg-vorteile" role="group" aria-label="Leistungsvorteile der Kundenkarte">
            {KUNDE_KASSA.vorteile.map((v) => {
              const I = VORTEIL_ICON[v.id];
              const on = vorteil === v.id;
              return (
                <button key={v.id} type="button" className={`lg-vchip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setVorteil(on ? null : v.id)}>
                  {on ? <Check {...s16} /> : <I {...s16} />}{v.kurz}
                </button>
              );
            })}
          </div>

          <div className="lg-cart__head">
            <h2 className="lg-h3">Warenkorb</h2>
            <span className="lg-muted">{anzahl} Artikel</span>
          </div>
          <ul className="lg-cart__list">
            {zeilen.map((z) => (
              <li key={z.id} className="lg-line">
                <span className="lg-line__img"><Image src={BILD(z.bild)} alt="" fill sizes="48px" /></span>
                <span className="lg-line__txt">
                  <span className="lg-block lg-strong">{z.name}</span>
                  <span className="lg-block lg-muted">{z.marke}{z.n > 1 ? ` · ${z.n} × ${eur(z.preis)}` : ""}</span>
                </span>
                <span className="lg-line__r">
                  <span className="lg-num lg-strong">{eur(z.preis * z.n)}</span>
                  <span className="lg-step-ctl" role="group" aria-label={`Menge ${z.name}`}>
                    <button type="button" aria-label="Weniger" onClick={() => aendern(z.id, -1)}><Minus {...s16} /></button>
                    <span className="lg-num" aria-live="polite">{z.n}</span>
                    <button type="button" aria-label="Mehr" onClick={() => aendern(z.id, 1)}><Plus {...s16} /></button>
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="lg-cart__sum">
            <div className="lg-sumrow"><span>Zwischensumme</span><span className="lg-num">{eur(summe)}</span></div>
            <div className="lg-sumrow lg-muted"><span>darin 20 % USt.</span><span className="lg-num">{eur(ust)}</span></div>
            {vt && <div className="lg-sumrow lg-sumrow--vorteil"><span><Gift {...s16} />Vorteil {vt.label} · steht am Bon</span><span>inklusive</span></div>}
            <div className="lg-sumrow lg-sumrow--total"><span>Gesamt</span><span className="lg-num">{eur(summe)}</span></div>
          </div>
          <Segment label="Zahlart" gross optionen={[
            { id: "karte", label: "Karte", icon: <CreditCard {...s16} /> },
            { id: "bar", label: "Bar", icon: <Banknote {...s16} /> },
            { id: "gutschein", label: "Gutschein", icon: <Gift {...s16} /> },
            { id: "rechnung", label: "Rechnung", icon: <FileText {...s16} /> },
          ]} wert={zahlart} onChange={setZahlart} />
          <button type="button" className="lg-pay-btn" onClick={() => setBezahlt(true)}>
            <span>Bezahlen</span><span className="lg-num">{eur(summe)}</span>
          </button>
        </aside>
      </div>
      {bezahlt && <Erfolg betrag={summe} onWeiter={() => { setBezahlt(false); setKorb([]); }} />}
    </div>
  );
}
