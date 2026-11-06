"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarPlus, ChevronDown, Columns3, Ellipsis, List, ListFilter, Mail, Phone, Search, X } from "lucide-react";
import Shell from "./Shell";
import { Avatar } from "./Avatar";
import { anfragen, bereiche, IMG, statusGruppen, team } from "./data";

const ansichten = [
  { k: "offen", label: "Alle offenen", n: 15 },
  { k: "mir", label: "Mir zugewiesen", n: 6 },
  { k: "objekt", label: "Hotel & Objekt", n: 5 },
  { k: "gewonnen", label: "Gewonnen", n: 38 },
];

const tsd = (v) => new Intl.NumberFormat("de-AT").format(Math.round(v / 1000));

function Bereich({ k }) {
  const b = bereiche[k];
  return <span className="at-tag"><i className="at-swatch" style={{ background: b.swatch }} aria-hidden="true" />{b.label}</span>;
}

// Miniatur der ersten PDF-Seite: Grundriss in Haarlinien.
function Plan() {
  return (
    <svg className="plan" viewBox="0 0 120 90" aria-hidden="true">
      <rect x="16" y="14" width="88" height="62" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 44 H50 M50 14 V30 M50 38 V76 M50 56 H74 M82 56 H104 M74 14 V34 M74 34 H88" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M50 30 a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <path d="M22 68 H44 M22 64 H44 M22 60 H44" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <rect x="82" y="62" width="14" height="9" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <path d="M16 82 H104" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

function Vorschau({ a, onClose }) {
  const g = statusGruppen.find((s) => s.key === a.status);
  return (
    <aside className="at-preview enter" aria-label={`Vorschau ${a.name}`}>
      <div className="swap" key={a.id}>
        <div className="head">
          <span className={`at-status ${g.cls}`}>{g.label}</span>
          <span className="id">{a.id}</span>
          <div className="sp">
            <button type="button" className="at-iconbtn" aria-label="Weitere Aktionen"><Ellipsis aria-hidden="true" /></button>
            <button type="button" className="at-iconbtn" aria-label="Vorschau schließen" onClick={onClose}><X aria-hidden="true" /></button>
          </div>
        </div>
        <h2 className="t-h2 at-preview-h">{a.name}</h2>
        <div className="sub">{a.org}</div>
        <blockquote className="at-quote">{a.nachricht}<footer>{a.kontakt} · {a.eingang}</footer></blockquote>
        <dl className="at-dl">
          <dt>Wunsch</dt><dd>{a.titel}</dd>
          <dt>Bereich</dt><dd><Bereich k={a.bereich} /></dd>
          <dt>Budget</dt><dd>{a.budget}</dd>
          <dt>Telefon</dt><dd>{a.tel}</dd>
          <dt>Quelle</dt><dd>{a.quelle}</dd>
          <dt>Zuständig</dt><dd className="who"><Avatar k={a.wer} />{team[a.wer].name}</dd>
        </dl>
        <div className="at-side-h"><span>Anhänge</span><span className="n">{a.anh.length}</span></div>
        <div className="at-attach">
          {a.anh.map((f) => (
            <figure key={f.t}>
              {f.img ? <div className="img"><img src={IMG(f.img)} alt="" /></div> : <div className="file"><Plan /></div>}
              <figcaption><b>{f.t}</b><span>{f.m}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="at-next">
          <div className="t">Nächster Schritt</div>
          <b>{a.wunsch}</b>
          <div className="btns">
            <button type="button" className="at-btn primary"><CalendarPlus aria-hidden="true" />Termin vorschlagen</button>
            <button type="button" className="at-btn line"><Phone aria-hidden="true" />Anrufen</button>
            <button type="button" className="at-btn line icon" aria-label="E-Mail schreiben"><Mail aria-hidden="true" /></button>
          </div>
        </div>
        <Link href="/entwurf/atelier/kunde" className="at-link" style={{ marginTop: 20 }}>Ganze Akte öffnen <ArrowRight aria-hidden="true" /></Link>
      </div>
    </aside>
  );
}

export default function Anfragen() {
  const [view, setView] = useState("liste");
  const [ansicht, setAnsicht] = useState("offen");
  const [sel, setSel] = useState("ANF-2611");
  const [q, setQ] = useState("");
  const [filterKueche, setFilterKueche] = useState(false);

  const rows = useMemo(() => {
    let r = anfragen;
    if (ansicht === "mir") r = r.filter((a) => a.wer === "LW");
    if (ansicht === "objekt") r = r.filter((a) => a.bereich === "hotel" || a.bereich === "yacht");
    if (filterKueche) r = r.filter((a) => a.bereich === "kueche" || a.bereich === "bad");
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((a) => `${a.name} ${a.org} ${a.titel} ${a.id}`.toLowerCase().includes(s));
    }
    return r;
  }, [ansicht, filterKueche, q]);

  const current = anfragen.find((a) => a.id === sel);
  const open = view === "liste" && current;

  return (
    <Shell active="anfragen" crumbs={["Vertrieb", "Anfragen"]} wide={!!open}>
      <main className={`at-page at-page-list ${open ? "wide" : ""}`}>
        <div className={`at-split ${open ? "open" : ""}`}>
          <div className="at-listcol">
            <div className="at-listhead">
              <div>
                <h1 className="t-h1">Anfragen</h1>
                <p>15 offen · 4 neu seit gestern · Ø erste Antwort in 3 Std.</p>
              </div>
              <div className="act">
                <div className="at-seg" role="group" aria-label="Ansicht">
                  <button type="button" aria-pressed={view === "liste"} onClick={() => setView("liste")}><List aria-hidden="true" />Liste</button>
                  <button type="button" aria-pressed={view === "tafel"} onClick={() => setView("tafel")}><Columns3 aria-hidden="true" />Tafel</button>
                </div>
              </div>
            </div>

            <div className="at-tabs" role="tablist" aria-label="Gespeicherte Ansichten">
              {ansichten.map((a) => (
                <button key={a.k} role="tab" type="button" aria-selected={ansicht === a.k} onClick={() => setAnsicht(a.k)}>
                  {a.label}<span className="count">{a.n}</span>
                </button>
              ))}
            </div>

            <div className="at-filters">
              <button type="button" className="at-chip dash"><ListFilter aria-hidden="true" />Filter</button>
              <button type="button" className={`at-chip ${filterKueche ? "on" : ""}`} aria-pressed={filterKueche} onClick={() => setFilterKueche((v) => !v)}>
                Bereich: Küche, Bad{filterKueche ? <X className="x" aria-hidden="true" /> : <ChevronDown className="x" aria-hidden="true" />}
              </button>
              <button type="button" className="at-chip">Zuständig<ChevronDown className="x" aria-hidden="true" /></button>
              <button type="button" className="at-chip">Quelle<ChevronDown className="x" aria-hidden="true" /></button>
              <label className="at-find">
                <Search aria-hidden="true" />
                <span className="sr">Anfragen durchsuchen</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, Ort, Nummer …" />
              </label>
            </div>

            {view === "liste" ? (
              <table className="at-table">
                <thead>
                  <tr>
                    <th>Kunde und Wunsch</th>
                    <th>Bereich</th>
                    <th className="r">Budget</th>
                    <th className="hide-m hide-o">Quelle</th>
                    <th>Eingang</th>
                    <th className="hide-t" aria-label="Zuständig" />
                  </tr>
                </thead>
                <tbody>
                  {statusGruppen.map((g) => {
                    const list = rows.filter((r) => r.status === g.key);
                    if (!list.length) return null;
                    const sum = list.reduce((s, r) => s + r.budgetN, 0);
                    return [
                      <tr key={g.key} className="grp">
                        <td colSpan={6}>
                          <span className={`at-status ${g.cls}`}>{g.label}</span>
                          <span className="ink-3 num">{list.length}</span>
                          <span className="ink-3 num sum">{tsd(sum)} T€</span>
                        </td>
                      </tr>,
                      ...list.map((a) => (
                        <tr key={a.id} className="row" aria-selected={sel === a.id} tabIndex={0}
                          onClick={() => setSel(a.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(a.id); } }}>
                          <td className="who"><b>{a.name}</b><span>{a.titel}</span></td>
                          <td><Bereich k={a.bereich} /></td>
                          <td className="r val">{a.budget}</td>
                          <td className="soft hide-m hide-o">{a.quelle}</td>
                          <td className="soft">{a.eingang}</td>
                          <td className="r hide-t"><Avatar k={a.wer} /></td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            ) : (
              <div className="at-board">
                {statusGruppen.map((g) => {
                  const list = rows.filter((r) => r.status === g.key);
                  const sum = list.reduce((s, r) => s + r.budgetN, 0);
                  return (
                    <section key={g.key} aria-label={g.label}>
                      <div className="colh"><span className={`at-status ${g.cls}`}>{g.label}</span><span className="ink-3 num">{list.length}</span><span className="sum">{tsd(sum)} T€</span></div>
                      {list.map((a) => (
                        <button type="button" key={a.id} className="at-card" aria-pressed={sel === a.id} onClick={() => setSel(a.id)} style={{ "--strip": bereiche[a.bereich].swatch }}>
                          <span className="top"><b>{a.name}</b><Avatar k={a.wer} /></span>
                          <span className="s">{a.titel}</span>
                          <span className="f"><span>{bereiche[a.bereich].label}</span><span className="val">{a.budget}</span></span>
                        </button>
                      ))}
                    </section>
                  );
                })}
              </div>
            )}
            {view === "liste" ? <div className="at-tablefoot"><span>{rows.length} von 15 offenen Anfragen</span><span>Sortiert nach Eingang</span></div> : null}
          </div>
          {open ? <Vorschau a={current} onClose={() => setSel(null)} /> : null}
        </div>
      </main>
    </Shell>
  );
}
