"use client";

import { useState } from "react";
import {
  Building2, CalendarPlus, Check, ChevronRight, FileText, FolderOpen, Hammer, Inbox, Mail, MapPin, MoreHorizontal,
  PencilRuler, Phone, Ruler, Truck, Wrench,
} from "lucide-react";
import Shell from "./Shell";
import { Av, Bild, Ico } from "./ui";
import { POSITIONEN, ZEITLEISTE, euro } from "./daten";

const FLOW = [
  { name: "Anfrage", icon: Inbox, d: ["12. September", "über Empfehlung"], st: "done" },
  { name: "Planung", icon: PencilRuler, d: ["Variante B", "freigegeben 24.10."], st: "done" },
  { name: "Auftrag", icon: Check, d: ["148.320 €", "30 % angezahlt"], st: "done" },
  { name: "Lieferung", icon: Truck, d: ["Donnerstag, 6. Nov.", "8–10 Uhr, Tour 2"], st: "now" },
  { name: "Service", icon: Wrench, d: ["Pflegetermin", "ab Mai 2027"], st: "next" },
];

const TABS = [
  { id: "ueberblick", label: "Überblick" },
  { id: "vorgaenge", label: "Vorgänge", n: 6 },
  { id: "planung", label: "Planung und Renderings", n: 14 },
  { id: "dokumente", label: "Dokumente", n: 23 },
  { id: "service", label: "Service" },
];

const BEZUEGE = [
  { icon: Building2, t: "Hollenstein Architekten", s: "Architektin · Mag. Eva Hollenstein" },
  { icon: Hammer, t: "Villa Pfänderblick", s: "Projekt · Wohnen, Essen, Terrasse" },
  { icon: Ruler, t: "Aufmaß vom 18.09.", s: "Miriam Ostler · 6 Räume" },
  { icon: FolderOpen, t: "Muster und Stoffe", s: "Bouclé Sand, Leder Cognac, Eiche geölt" },
];

export default function Kundenakte() {
  const [tab, setTab] = useState("ueberblick");
  const nowIdx = FLOW.findIndex((f) => f.st === "now");
  return (
    <Shell crumbs={["Kunden", "Wendlinger"]}>
      <div className="sr-enter">
        <div className="sr-cover">
          <Bild src="wohnen-loft.jpg" sizes="(max-width: 1279px) 100vw, 1104px" preload className="sr-fill" alt="Rendering Variante B, Wohnbereich Villa Pfänderblick" />
          <div className="sr-cover__cap">
            <span className="sr-glass"><PencilRuler aria-hidden="true" />Rendering Variante B</span>
            <span className="sr-glass"><MapPin aria-hidden="true" />Villa Pfänderblick, Lochau</span>
          </div>
          <div className="sr-cover__actions">
            <button type="button" className="sr-glass sr-glass--btn"><Phone aria-hidden="true" /><span className="sr-btn-label">Anrufen</span></button>
            <button type="button" className="sr-glass sr-glass--btn"><Mail aria-hidden="true" /><span className="sr-btn-label">E-Mail</span></button>
            <button type="button" className="sr-btn sr-btn--light"><CalendarPlus aria-hidden="true" />Termin</button>
            <button type="button" className="sr-glass sr-glass--icon" aria-label="Weitere Aktionen"><MoreHorizontal aria-hidden="true" /></button>
          </div>
        </div>

        <div className="sr-acct">
          <span className="sr-acct__av" aria-hidden="true">KW</span>
          <div className="sr-acct__main">
            <h1 className="sr-display sr-acct__name">Katharina &amp; Matthias Wendlinger</h1>
            <div className="sr-acct__line">
              <span className="sr-tier" data-tier="eiche">Kundenkarte Eiche</span>
              <span>Kundin seit 2019</span><span className="sr-acct__dot" />
              <span>Lochau</span><span className="sr-acct__dot" />
              <span className="sr-acct__by">Betreut von <Av kurz="LH" size={20} /> Lena Hartmann</span>
            </div>
          </div>
        </div>

        <ol className="sr-flow" aria-label="Vorgang Villa Pfänderblick" style={{ "--done": nowIdx }}>
          <span className="sr-flow__rail" aria-hidden="true"><span className="sr-flow__railon" style={{ width: `${(nowIdx / (FLOW.length - 1)) * 100}%` }} /></span>
          {FLOW.map((f) => (
            <li key={f.name} className={`sr-flow__step sr-flow__step--${f.st}`} aria-current={f.st === "now" ? "step" : undefined}>
              <span className="sr-flow__node">{f.st === "done" ? <Check aria-hidden="true" /> : <f.icon aria-hidden="true" />}</span>
              <span className="sr-flow__name">{f.name}{f.st === "now" && <span className="sr-flow__live">läuft</span>}</span>
              <span className="sr-flow__d"><span>{f.d[0]}</span><span>{f.d[1]}</span></span>
            </li>
          ))}
        </ol>

        <div className="sr-tabs" role="tablist" aria-label="Bereiche der Kundenakte">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" className="sr-tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}{t.n ? <span className="num">{t.n}</span> : null}
            </button>
          ))}
        </div>

        <div className="sr-grid sr-acct-grid" role="tabpanel" aria-label={TABS.find((t) => t.id === tab).label}>
          <section aria-label="Zeitleiste" className="sr-span-8 sr-tl" key={tab}>
            {ZEITLEISTE.map((g) => (
              <div key={g.tag} className="sr-tl__group">
                <div className="sr-tl__day">{g.tag}</div>
                {g.items.map((it) => (
                  <div className="sr-tl__item" key={it.t}>
                    <span className="sr-tl__node" data-m={it.m}><Ico name={it.icon} /></span>
                    <div className="sr-tl__main">
                      <div className="sr-tl__h">
                        <span className="sr-tl__t">{it.t}</span>
                        <time className="sr-tl__time num">{it.zeit}</time>
                      </div>
                      <div className={`sr-tl__d${it.zitat ? " sr-tl__d--quote" : ""}`}>{it.d}</div>
                      {it.bilder && (
                        <div className="sr-tl__imgs">
                          {it.bilder.map(([b, alt]) => <Bild key={b} src={b} alt={alt} sizes="220px" />)}
                        </div>
                      )}
                      {it.datei && (
                        <a href="#pdf" className="sr-file"><span className="sr-file__ic"><FileText aria-hidden="true" /></span><span>{it.datei.name}<small>PDF · {it.datei.gr}</small></span></a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <aside className="sr-span-4 sr-aside" aria-label="Beträge und Bezüge">
            <div className="sr-sheet sr-money">
              <div className="sr-aside__h">Beträge<a href="#faktura">Faktura <ChevronRight aria-hidden="true" /></a></div>
              <div className="sr-display sr-money__big num">148.320 €</div>
              <div className="sr-money__sub">Auftrag A-2610-0094 · brutto · 11 Positionen</div>
              <div className="sr-paybar" role="img" aria-label="30 % bezahlt, 60 % bei Lieferung fällig, 10 % nach Montage">
                <span style={{ width: "30%", background: "var(--st-salbei-dot)" }} />
                <span style={{ width: "60%", background: "var(--st-eiche-dot)" }} />
                <span style={{ width: "10%", background: "var(--fill-3)" }} />
              </div>
              <div className="sr-moneyrows">
                <div><i style={{ background: "var(--st-salbei-dot)" }} />Anzahlung bezahlt<b className="num">44.496 €</b></div>
                <div><i style={{ background: "var(--st-eiche-dot)" }} />Fällig bei Lieferung 6.11.<b className="num">88.992 €</b></div>
                <div><i style={{ background: "var(--fill-3)" }} />Nach Montage-Abnahme<b className="num">14.832 €</b></div>
              </div>
              <div className="sr-money__life">Lifetime-Umsatz seit 2019<b className="num">212.640 €</b></div>
            </div>

            <section className="sr-aside__sec" aria-labelledby="h-pos">
              <div className="sr-aside__h" id="h-pos">Größte Positionen<a href="#auftrag">Auftrag <ChevronRight aria-hidden="true" /></a></div>
              {POSITIONEN.map((p) => (
                <div className="sr-pos" key={p.t}>
                  <Bild src={p.bild} sizes="44px" />
                  <div className="sr-pos__txt"><div className="sr-pos__t">{p.t}</div><div className="sr-pos__s">{p.s}</div></div>
                  <div className="sr-pos__a num">{euro(p.a)}</div>
                </div>
              ))}
            </section>

            <section className="sr-aside__sec" aria-labelledby="h-rel">
              <div className="sr-aside__h" id="h-rel">Bezüge</div>
              {BEZUEGE.map((b) => (
                <a key={b.t} href="#bezug" className="sr-rel">
                  <span className="sr-rel__ic"><b.icon aria-hidden="true" /></span>
                  <span className="sr-rel__txt"><span className="sr-rel__t">{b.t}</span><span className="sr-rel__s">{b.s}</span></span>
                  <ChevronRight aria-hidden="true" className="sr-rel__go" />
                </a>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
