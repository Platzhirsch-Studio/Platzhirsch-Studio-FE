"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock, FileText, Mail, MapPin, Phone, Plus, Share,
} from "lucide-react";
import Shell from "./Shell";
import { AKTE, BEZUEGE, POSITIONEN, REISE, TABS, TEAM, ZAHLUNGEN, ZEITLEISTE } from "./daten";
import { Av, AvReihe, Bild, Ico, Oeffnen, Pille, Rund, Segment, Zahl } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

/* ------------------------------------------------------------------ Hero mit Glas-Kacheln */
function Hero() {
  return (
    <section className="lg-hero" aria-labelledby="akte-t">
      <Bild src="r-hero-essraum.jpg" sizes="1300px" preload alt="Planung Essraum mit Gartenblick, Variante B" className="lg-hero__img" />
      <div className="lg-hero__scrim" aria-hidden="true" />
      <div className="lg-hero__top">
        <span className="lg-glass-chip"><FileText {...s16} />{AKTE.nr}</span>
        <span className="lg-glass-chip"><MapPin {...s16} />{AKTE.ort}</span>
      </div>
      <div className="lg-hero__actions">
        <button type="button" className="lg-glass-pill"><Phone {...s16} />Anrufen</button>
        <button type="button" className="lg-glass-pill"><Mail {...s16} />E-Mail</button>
        <button type="button" className="lg-glass-pill lg-glass-pill--solid"><CalendarDays {...s16} />Termin</button>
      </div>
      <div className="lg-hero__title">
        <p className="lg-hero__kunde">{AKTE.kunde}</p>
        <h1 id="akte-t">{AKTE.projekt}</h1>
        <p className="lg-hero__ber">{AKTE.bereiche}</p>
      </div>
      <div className="lg-hero__glass">
        <div className="lg-glass">
          <p className="lg-glass__cap">Auftragswert</p>
          <p className="lg-glass__big lg-num">148.600 €</p>
          <p className="lg-glass__sub">brutto · 11 Positionen</p>
        </div>
        <div className="lg-glass">
          <p className="lg-glass__cap">Bezahlt</p>
          <p className="lg-glass__big lg-num">59.440 €</p>
          <span className="lg-glass__bar" role="img" aria-label="40 Prozent bezahlt"><span style={{ width: "40%" }} /></span>
        </div>
        <div className="lg-glass">
          <div className="lg-glass__row">
            <p className="lg-glass__cap">Nächster Termin</p>
            <Av kurz={AKTE.termin.wer} size={28} ring={false} />
          </div>
          <p className="lg-glass__mid">{AKTE.termin.wann}</p>
          <p className="lg-glass__sub">{AKTE.termin.was}</p>
        </div>
        <div className="lg-glass">
          <p className="lg-glass__cap">Lieferung Küche</p>
          <p className="lg-glass__big">KW 49</p>
          <p className="lg-glass__sub">Poliform · bestätigt</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Kundenreise mit Knoten */
function Kundenreise() {
  const wrap = useRef(null);
  const [linien, setLinien] = useState({ w: 0, h: 0, p: [] });

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const messen = () => {
      const box = el.getBoundingClientRect();
      const cols = [...el.querySelectorAll("[data-col]")];
      const p = [];
      for (let i = 0; i < cols.length - 1; i++) {
        const a = cols[i].getBoundingClientRect();
        const b = cols[i + 1].getBoundingClientRect();
        const stepsA = [...cols[i].querySelectorAll("[data-step]")];
        const stepsB = [...cols[i + 1].querySelectorAll("[data-step]")];
        const vonIdx = stepsA.findLastIndex((s) => s.dataset.s !== "offen");
        const von = stepsA[vonIdx >= 0 ? vonIdx : stepsA.length - 1].getBoundingClientRect();
        const nach = stepsB[0].getBoundingClientRect();
        const x1 = a.right - box.left, y1 = von.top + von.height / 2 - box.top;
        const x2 = b.left - box.left, y2 = nach.top + nach.height / 2 - box.top;
        const offen = stepsB[0].dataset.s === "offen";
        p.push({ x1, y1, x2, y2, offen });
      }
      setLinien({ w: box.width, h: box.height, p });
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const erledigt = REISE.flatMap((r) => r.steps).filter((s) => s.s === "fertig").length;
  const gesamt = REISE.flatMap((r) => r.steps).length;

  return (
    <section className="lg-tile lg-reise" aria-labelledby="reise-t">
      <header className="lg-tile__head">
        <div className="lg-reise__head">
          <h2 id="reise-t" className="lg-h2">Kundenreise</h2>
          <AvReihe leute={AKTE.team} max={5} size={36} />
          <span className="lg-muted"><b className="lg-num">{erledigt}</b> von {gesamt} Schritten erledigt</span>
        </div>
        <div className="lg-tile__tools">
          <Rund label="Schritt hinzufügen" groesse="s"><Plus {...s16} /></Rund>
          <Rund label="Teilen" groesse="s"><Share {...s16} /></Rund>
          <Rund label="Termine" groesse="s"><CalendarDays {...s16} /></Rund>
        </div>
      </header>
      <div className="lg-reise__wrap" ref={wrap}>
        <svg className="lg-reise__svg" width={linien.w} height={linien.h} aria-hidden="true">
          {linien.p.map((l, i) => {
            const dx = (l.x2 - l.x1) * 0.75;
            const d = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`;
            return (
              <g key={i} className={l.offen ? "is-open" : ""}>
                <path d={d} className="lg-reise__line" />
                <circle cx={l.x1} cy={l.y1} r="4" className="lg-reise__node" />
                <circle cx={l.x2} cy={l.y2} r="4" className="lg-reise__node" />
              </g>
            );
          })}
        </svg>
        <ol className="lg-reise__cols">
          {REISE.map((st, i) => {
            const fertig = st.steps.every((s) => s.s === "fertig");
            return (
              <li key={st.id} className="lg-reise__col" style={{ "--i": i }}>
                <div className={`lg-stage${st.aktiv ? " is-now" : ""}${fertig ? " is-done" : ""}`} data-col>
                  {st.steps.map((s) => (
                    <div key={s.t} className="lg-step" data-step data-s={s.s}>
                      <div className="lg-step__top">
                        {s.p ? <Av kurz={s.p} size={32} ring={false} /> : <span className="lg-step__plus"><Plus {...s16} /></span>}
                        <span className="lg-step__st" role="img" aria-label={s.s === "fertig" ? "erledigt" : s.s === "aktiv" ? "in Arbeit" : "offen"}>
                          {s.s === "fertig" ? <CheckCheck {...s16} /> : s.s === "aktiv" ? <Clock {...s16} /> : <CalendarDays {...s16} />}
                        </span>
                      </div>
                      <p className="lg-step__t">{s.t}</p>
                      {s.d && <p className="lg-step__d">{s.d}</p>}
                    </div>
                  ))}
                </div>
                <p className="lg-reise__label">
                  {fertig && <Check {...s16} />}
                  {st.titel}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Zeitleiste */
function Zeitleiste() {
  return (
    <section className="lg-tile lg-zeit" aria-labelledby="zeit-t">
      <header className="lg-tile__head">
        <div>
          <h2 id="zeit-t" className="lg-h3">Verlauf</h2>
          <p className="lg-sub">Gespräche, Belege und Planstände an einem Ort</p>
        </div>
        <Oeffnen label="Ganzen Verlauf öffnen" />
      </header>
      {ZEITLEISTE.map((tag) => (
        <div key={tag.tag} className="lg-zeit__tag">
          <p className="lg-zeit__datum">{tag.tag}</p>
          <ol>
            {tag.eintraege.map((e) => (
              <li key={e.titel} className="lg-zeit__e">
                <span className="lg-zeit__ico" data-ton={e.ton}><Ico name={e.icon} size={16} /></span>
                <div className="lg-zeit__body">
                  <div className="lg-zeit__row">
                    <p className="lg-strong">{e.titel}</p>
                    <span className="lg-muted lg-num">{e.zeit}</span>
                  </div>
                  {e.text && <p className="lg-zeit__text">{e.text}</p>}
                  {e.zitat && <blockquote className="lg-zeit__zitat">{e.zitat}</blockquote>}
                  {e.beleg && (
                    <a href="#beleg" className="lg-beleg">
                      <span className="lg-beleg__ico"><FileText {...S} /></span>
                      <span><span className="lg-block lg-strong">{e.beleg.name}</span><span className="lg-block lg-muted">{e.beleg.info}</span></span>
                    </a>
                  )}
                  {e.bilder && (
                    <div className="lg-zeit__bilder">
                      {e.bilder.map((b) => <Bild key={b} src={b} sizes="220px" className="lg-zeit__bild" />)}
                    </div>
                  )}
                  {e.wer && <p className="lg-zeit__wer"><Av kurz={e.wer} size={20} ring={false} />{TEAM[e.wer].name}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function Betraege() {
  return (
    <section className="lg-tile lg-betrag" aria-labelledby="betrag-t">
      <header className="lg-tile__head">
        <h2 id="betrag-t" className="lg-h3">Beträge</h2>
        <a href="#faktura" className="lg-link">Faktura</a>
      </header>
      <p className="lg-betrag__big"><Zahl wert={148600} /> <small>€</small></p>
      <p className="lg-muted">Auftrag A-2610-0094 · brutto · 11 Positionen</p>
      <div className="lg-paybar" role="img" aria-label="Zahlungsplan: 40 % bezahlt, 50 % vor Lieferung, 10 % nach Abnahme">
        <span data-ton="salbei" style={{ flex: 40 }} />
        <span data-ton="eiche" style={{ flex: 50 }} />
        <span data-ton="stein" style={{ flex: 10 }} />
      </div>
      <ul className="lg-pay">
        {ZAHLUNGEN.map((z) => (
          <li key={z.titel}>
            <span className="lg-pay__dot" data-ton={z.ton} />
            <span className="lg-pay__t">{z.titel}<span className="lg-muted"> · {z.wann}</span></span>
            <span className="lg-num lg-strong">{z.betrag}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Positionen() {
  return (
    <section className="lg-tile lg-pos" aria-labelledby="pos-t">
      <header className="lg-tile__head">
        <h2 id="pos-t" className="lg-h3">Größte Positionen</h2>
        <a href="#auftrag" className="lg-link">Auftrag</a>
      </header>
      <ul className="lg-pos__list">
        {POSITIONEN.map((p) => (
          <li key={p.titel} className="lg-pos__i">
            <Bild src={p.bild} className="lg-thumb" sizes="56px" />
            <span className="lg-pos__txt"><span className="lg-block lg-strong">{p.titel}</span><span className="lg-block lg-muted">{p.info}</span></span>
            <span className="lg-num lg-strong">{p.betrag}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bezuege() {
  return (
    <section className="lg-tile lg-bez" aria-labelledby="bez-t">
      <header className="lg-tile__head"><h2 id="bez-t" className="lg-h3">Bezüge</h2></header>
      <ul className="lg-bez__list">
        {BEZUEGE.map((b) => (
          <li key={b.titel}>
            <a href="#bezug" className="lg-bez__i">
              <span className="lg-bez__ico"><Ico name={b.icon} size={20} /></span>
              <span className="lg-bez__txt"><span className="lg-block lg-strong">{b.titel}</span><span className="lg-block lg-muted">{b.info}</span></span>
              <ChevronRight {...s16} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Kundenakte() {
  const [tab, setTab] = useState("Reise");
  return (
    <Shell bereich="projekte">
      <div className="lg-akte-kopf">
        <div className="lg-akte-kopf__l">
          <Rund label="Zurück zu Projekte"><ChevronLeft {...S} /></Rund>
          <nav className="lg-crumbs" aria-label="Pfad"><span>Projekte</span><ChevronRight {...s16} /><b aria-current="page">{AKTE.projekt}</b></nav>
        </div>
        <span className="lg-karte" title="Kundenkarte – Stufe und Leistungsvorteile, kein Geldwert">
          <span className="lg-karte__chip" aria-hidden="true">P+</span>
          Platzhirsch Plus <span className="lg-muted">· Kundin seit 2019</span>
        </span>
      </div>
      <Hero />
      <div className="lg-akte-tabs">
        <Segment label="Bereiche der Akte" optionen={TABS.map((t) => ({ id: t, label: t, n: t === "Planung" ? 14 : t === "Dokumente" ? 23 : undefined }))} wert={tab} onChange={setTab} />
        <Pille ton="eiche">Stufe 5 von 7 · Bestellung & Lieferung</Pille>
      </div>
      <Kundenreise />
      <div className="lg-bento lg-bento--akte">
        <div className="k-zeit"><Zeitleiste /></div>
        <div className="k-betrag"><Betraege /></div>
        <div className="k-pos"><Positionen /></div>
        <div className="k-bez"><Bezuege /></div>
      </div>
    </Shell>
  );
}
