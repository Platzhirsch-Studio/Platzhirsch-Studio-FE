"use client";
import { useState } from "react";
import { CalendarPlus, ChevronRight, Ellipsis, FileText, Mail, MapPin, MessageSquare, Phone, Ruler } from "lucide-react";
import Shell from "./Shell";
import { IMG, kunde, positionen, team, vorgang, zeitleiste } from "./data";

const tabs = [
  { k: "ueberblick", label: "Überblick" },
  { k: "zeit", label: "Zeitleiste", n: 42 },
  { k: "planung", label: "Planung", n: 12 },
  { k: "dokumente", label: "Dokumente", n: 18 },
  { k: "betraege", label: "Beträge" },
  { k: "notizen", label: "Notizen", n: 3 },
];

export default function Kundenakte() {
  const [tab, setTab] = useState("ueberblick");
  return (
    <Shell active="kunden" crumbs={["Kunden", kunde.name]}>
      <main className="at-page" style={{ paddingTop: 8 }}>
        <section className="at-client">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="who">
              <span className="at-avatar l t1" aria-hidden="true">{kunde.kurz}</span>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="tier"><i aria-hidden="true" />{kunde.karte} · {kunde.punkte} Punkte</span>
                  <span className="t-small ink-3">{kunde.nr} · {kunde.seit}</span>
                </div>
                <h1 className="t-h1">{kunde.name}</h1>
                <div className="meta">
                  <span><MapPin aria-hidden="true" />{kunde.ort}</span>
                  <span><Phone aria-hidden="true" />{kunde.tel}</span>
                  <span><Mail aria-hidden="true" />{kunde.mail}</span>
                </div>
                <div className="acts">
                  <button type="button" className="at-btn primary"><CalendarPlus aria-hidden="true" />Termin</button>
                  <button type="button" className="at-btn line"><MessageSquare aria-hidden="true" />Nachricht</button>
                  <button type="button" className="at-btn line"><Ruler aria-hidden="true" />Aufmaß</button>
                  <button type="button" className="at-btn ghost" aria-label="Weitere Aktionen"><Ellipsis aria-hidden="true" /></button>
                </div>
              </div>
            </div>
          </div>
          <figure className="at-cover">
            <div className="img"><img src={IMG("wohnraum.jpg")} alt="Rendering Wohnraum, Haus am Pfänderhang" /></div>
          </figure>
        </section>

        <ol className="at-flow" aria-label="Vorgang Haus am Pfänderhang" style={{ "--p": "70%" }}>
          <li className="track" aria-hidden="true"><span className="fill" /><span className="lbl">2 von 4 Teilen</span></li>
          {vorgang.map((v) => (
            <li key={v.k} className={v.st === "done" ? "done" : v.st === "now" ? "now" : ""} aria-current={v.st === "now" ? "step" : undefined}>
              <i aria-hidden="true" />
              <div className="k">{v.k}</div>
              <div className="d">{v.d}</div>
              <div className="x">{v.x}</div>
            </li>
          ))}
        </ol>

        <div className="at-tabs" role="tablist" aria-label="Akte">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}>
              {t.label}{t.n ? <span className="count">{t.n}</span> : null}
            </button>
          ))}
        </div>

        <div className="at-akte">
          <section aria-label="Zeitleiste">
            <ol className="at-tl">
              {zeitleiste.map((z, i) => z.tag ? (
                <li key={`d${i}`} className="day">{z.tag}</li>
              ) : (
                <li key={i} className={z.k ? "k" : ""}>
                  <i aria-hidden="true" />
                  <div className="h"><b>{z.h}</b>{z.wer ? <span className="t-micro ink-3">{team[z.wer].name}</span> : null}<time>{z.t}</time></div>
                  <p>{z.p}</p>
                  {z.bilder ? <div className="imgs">{z.bilder.map((b) => <div key={b}><img src={IMG(b)} alt="" /></div>)}</div> : null}
                  {z.doc ? <span className="doc"><FileText aria-hidden="true" /><b>{z.doc[0]}</b>{z.doc[1]}</span> : null}
                </li>
              ))}
            </ol>
          </section>

          <aside>
            <section className="at-side-block at-money" aria-labelledby="betrag-h">
              <h3 id="betrag-h" className="t-side">Beträge<span className="n">AB-2026-0418 · brutto</span></h3>
              <div className="big">
                <span className="t-display" style={{ fontSize: 38, lineHeight: "42px" }}>186.400 €</span><span className="t-small ink-3">70 % fakturiert</span>
              </div>
              <div className="at-meter" role="img" aria-label="30 Prozent bezahlt, 40 Prozent fällig am 20. November, 30 Prozent nach Übergabe">
                <span style={{ width: "30%", background: "var(--at-ink)" }} />
                <span style={{ width: "40%", background: "var(--at-accent)" }} />
              </div>
              <ul className="at-rows">
                <li><i className="at-swatch" style={{ background: "var(--at-ink)" }} /><span className="l">Anzahlung bezahlt</span><span className="r">55.920 €</span></li>
                <li><i className="at-swatch" style={{ background: "var(--at-accent)" }} /><span className="l">Rate 2 · fällig 20. Nov.</span><span className="r">74.560 €</span></li>
                <li><i className="at-swatch" style={{ background: "var(--at-sunk-2)" }} /><span className="l">Schlussrate nach Übergabe</span><span className="r">55.920 €</span></li>
              </ul>
            </section>

            <section className="at-side-block" aria-labelledby="bez-h">
              <h3 id="bez-h" className="t-side">Bezüge<span className="n">3</span></h3>
              <a href="#" className="at-rel"><span className="ico"><img src={IMG("esszimmer-see.jpg")} alt="" /></span><div><b>Haus am Pfänderhang</b><span>Projekt P-2026-031 · Lena Wachter</span></div><ChevronRight className="chev" aria-hidden="true" /></a>
              <a href="#" className="at-rel"><span className="ico mono">AR</span><div><b>Atelier Rauch Architekten</b><span>Architektin · Mag. arch. Johanna Rauch</span></div><ChevronRight className="chev" aria-hidden="true" /></a>
              <a href="#" className="at-rel"><span className="ico mono">KH</span><div><b>Konstantin Haldner</b><span>Ehepartner · Rechnungsempfänger</span></div><ChevronRight className="chev" aria-hidden="true" /></a>
            </section>

            <section className="at-side-block" aria-labelledby="pos-h">
              <h3 id="pos-h" className="t-side">Im Auftrag<a href="#" className="at-link">Alle 23</a></h3>
              <table className="at-items">
                <tbody>
                  {positionen.slice(0, 6).map((p) => (
                    <tr key={p.n}><td><b>{p.n}</b><span className="s">{p.s}</span></td><td className="r">{p.v}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
