"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ScanBarcode, Plus, Minus, CreditCard, Banknote, Gift, FileText, ArrowRightLeft, Lock, Trash2, Percent, ChevronLeft, Search,
  ChevronRight, Check, Printer, Mail,
} from "lucide-react";
import { ARTIKEL, KATEGORIEN, WARENKORB, euro } from "./daten";
import { Av } from "./ui";
import { ThemaSchalter } from "./Shell";

const BILD = "/entwurf/praezision/";
const ZAHLARTEN = [
  { id: "karte", label: "Karte", icon: CreditCard, aktion: "Kartenzahlung" },
  { id: "bar", label: "Bar", icon: Banknote, aktion: "Bar kassieren" },
  { id: "gutschein", label: "Gutschein", icon: Gift, aktion: "Gutschein einlösen" },
  { id: "rechnung", label: "Rechnung", icon: FileText, aktion: "Auf Rechnung" },
];
const RABATT = 0.03;

/** Der eine Moment mit Würde: ruhiger Vollbild-Übergang (400 ms) mit Raumbild und Betrag. */
function Abschluss({ betrag, onNeu }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onNeu();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNeu]);
  return (
    <div className="pz-moment" role="dialog" aria-modal="true" aria-labelledby="pz-moment-t">
      {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopie */}
      <img className="pz-moment-img" src={BILD + "minotti-sofa-wohnzimmer.webp"} alt="" />
      <div className="pz-moment-in">
        <span className="pz-moment-check"><Check aria-hidden /></span>
        <span className="pz-moment-kicker">Bon 2026-11-0419 · Kartenzahlung bestätigt · TSE signiert</span>
        <h2 className="pz-moment-title" id="pz-moment-t">Vielen Dank, Frau Brunner</h2>
        <span className="pz-moment-rule" aria-hidden />
        <span className="pz-moment-amt">{euro(betrag, 2)}</span>
        <span className="pz-moment-meta">+ 220 Punkte auf der Kundenkarte Silber · Abholung Kissen ab Freitag</span>
        <div className="pz-moment-act">
          <button type="button"><Printer aria-hidden />Beleg drucken</button>
          <button type="button"><Mail aria-hidden />Beleg per E-Mail</button>
          <button type="button" className="prim" onClick={onNeu}>Neuer Verkauf<ChevronRight aria-hidden /></button>
        </div>
      </div>
    </div>
  );
}

export default function Kassa() {
  const [kat, setKat] = useState("alle");
  const [korb, setKorb] = useState(WARENKORB);
  const [zahlart, setZahlart] = useState("karte");
  const [uhr, setUhr] = useState("14:32");
  const [fertig, setFertig] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Vorführmodus ?abschluss=1
      if (new URL(window.location.href).searchParams.get("abschluss") === "1") setFertig(true);
    } catch {}
    const f = () => setUhr(new Date().toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }));
    const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, []);

  const artikel = kat === "alle" ? ARTIKEL : ARTIKEL.filter((a) => a.kat === kat);
  const zeilen = useMemo(() => korb.map((z) => ({ ...z, a: ARTIKEL.find((a) => a.id === z.id) })), [korb]);
  const zwischen = zeilen.reduce((s, z) => s + z.a.preis * z.menge, 0);
  const rabatt = Math.round(zwischen * RABATT * 100) / 100;
  const gesamt = zwischen - rabatt;
  const mwst = (gesamt / 1.2) * 0.2;
  const stueck = zeilen.reduce((s, z) => s + z.menge, 0);
  const za = ZAHLARTEN.find((z) => z.id === zahlart);
  const ZaIcon = za.icon;

  const add = (id) => setKorb((k) => (k.some((z) => z.id === id) ? k.map((z) => (z.id === id ? { ...z, menge: z.menge + 1 } : z)) : [...k, { id, menge: 1 }]));
  const sub = (id) => setKorb((k) => k.flatMap((z) => (z.id !== id ? [z] : z.menge > 1 ? [{ ...z, menge: z.menge - 1 }] : [])));
  const imKorb = (id) => korb.find((z) => z.id === id)?.menge;

  return (
    <div className="pz-kiosk">
      <header className="pz-kbar">
        <Link href="/entwurf/praezision" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Zurück zur Zentrale"><ChevronLeft /></Link>
        <span className="pz-brand-name">Platzhirsch</span>
        <span className="pz-kbar-sep" aria-hidden />
        <span className="pz-kbar-ctx"><b>Kassa 1</b><span className="pz-hide-k">Showroom Lochau ·</span> Bon 2026-11-0419</span>
        <span className="pz-kbar-right">
          <span className="pz-online">TSE bereit</span>
          <span className="num" style={{ fontWeight: 500 }}>{uhr}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Av kurz="IW" ton={1} size={28} />Ines Walch</span>
          <ThemaSchalter />
          <button type="button" className="pz-btn"><Lock aria-hidden />Sperren</button>
        </span>
      </header>

      <main className="pz-kbody">
        <h1 className="sr">Kassa 1 – Verkauf</h1>
        <section className="pz-kpane" aria-label="Artikel">
          <label className="pz-scan">
            <ScanBarcode aria-hidden />
            <input placeholder="Artikel scannen oder suchen – Name, Marke, EAN" aria-label="Artikel scannen oder suchen" />
            <span className="pz-chip pz-chip--flat" style={{ height: 32, padding: "0 12px" }}><Search aria-hidden />Lager Lochau</span>
          </label>
          <div className="pz-kcats" role="group" aria-label="Kategorie">
            {KATEGORIEN.map((k) => (
              <button key={k.id} type="button" className="pz-kcat" aria-pressed={kat === k.id} onClick={() => setKat(k.id)}>{k.label}</button>
            ))}
          </div>
          <div className="pz-kgrid">
            {artikel.map((a) => (
              <button key={a.id} type="button" className="pz-prod" onClick={() => add(a.id)} aria-label={`${a.marke} ${a.name}, ${euro(a.preis, 2)}${a.bestand < 3 ? ", Bestand knapp" : ""} – hinzufügen`}>
                <span className="pz-prod-img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien */}
                  <img src={BILD + a.bild} alt="" />
                  {imKorb(a.id) ? <span className="pz-prod-in" key={imKorb(a.id)}>{imKorb(a.id)} im Korb</span> : null}
                  <span className="pz-prod-add" aria-hidden><Plus /></span>
                </span>
                <span className="pz-prod-txt">
                  <small>{a.marke}</small>
                  <b>{a.name}</b>
                  <span className="pz-prod-var">{a.var}</span>
                  <span className="pz-prod-row">
                    <span className="num">{euro(a.preis, 0)}</span>
                    <span className="pz-stock" data-knapp={a.bestand < 3 ? "" : undefined}>{a.bestand} lagernd</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="pz-kpane" aria-label="Warenkorb">
          <div className="pz-cust">
            <Av kurz="VB" ton={3} size={44} />
            <div className="pz-cust-txt">
              <b>Valerie Brunner</b>
              <span className="pz-tier"><i className="pz-mini-card" data-stufe="silber" aria-hidden />Silber · 1.240 Punkte</span>
            </div>
            <button type="button" className="pz-btn"><ArrowRightLeft aria-hidden />Wechseln</button>
          </div>
          <div className="pz-cart">
            <div className="pz-sec-head">
              <h2 className="pz-h2">Warenkorb</h2>
              <span className="pz-count num">{stueck} Artikel</span>
              <span className="pz-sec-act"><button type="button" className="pz-btn pz-btn--ghost" style={{ height: 44 }}><Trash2 aria-hidden />Leeren</button></span>
            </div>
            {zeilen.map((z) => (
              <div key={z.id} className="pz-cart-row">
                {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien */}
                <img src={BILD + z.a.bild} alt="" />
                <div style={{ minWidth: 0 }}>
                  <b>{z.a.marke} {z.a.name}</b>
                  <small>{z.a.var} · {euro(z.a.preis, 2)}</small>
                </div>
                <div className="pz-cart-end">
                  <span className="num">{euro(z.a.preis * z.menge, 2)}</span>
                  <span className="pz-qty">
                    <button type="button" onClick={() => sub(z.id)} aria-label={`${z.a.name}: Menge verringern`}><Minus /></button>
                    <span aria-live="polite">{z.menge}</span>
                    <button type="button" onClick={() => add(z.id)} aria-label={`${z.a.name}: Menge erhöhen`}><Plus /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="pz-sum">
            <div className="pz-sum-row"><span>Zwischensumme</span><span className="num">{euro(zwischen, 2)}</span></div>
            <div className="pz-sum-row"><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Percent size={12} aria-hidden />Kundenkarte Silber 3 %</span><span className="num">−{euro(rabatt, 2)}</span></div>
            <div className="pz-sum-row meta"><span>darin 20 % USt.</span><span className="num">{euro(mwst, 2)}</span></div>
            <div className="pz-sum-total"><b>Gesamt</b><span className="num">{euro(gesamt, 2)}</span></div>
          </div>
          <div className="pz-pay">
            <div className="pz-pay-methods" role="group" aria-label="Zahlart">
              {ZAHLARTEN.map((z) => {
                const Icon = z.icon;
                return (
                  <button key={z.id} type="button" className="pz-pay-m" aria-pressed={zahlart === z.id} onClick={() => setZahlart(z.id)}><Icon aria-hidden />{z.label}</button>
                );
              })}
            </div>
            <button type="button" className="pz-paybtn" onClick={() => setFertig(true)}>
              <span className="pz-paybtn-l"><ZaIcon aria-hidden />{za.aktion}</span>
              <span className="pz-paybtn-amt">{euro(gesamt, 2)}</span>
            </button>
          </div>
        </section>
      </main>
      {fertig && <Abschluss betrag={gesamt} onNeu={() => setFertig(false)} />}
    </div>
  );
}
