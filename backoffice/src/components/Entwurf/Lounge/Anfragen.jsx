"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus, ChevronDown, Mail, MoreHorizontal, Phone, Plus, Search, SlidersHorizontal, X,
} from "lucide-react";
import Shell from "./Shell";
import { ANFRAGEN, FILTER, TEAM } from "./daten";
import { Av, Bild, Oeffnen, Pille, Rund, Segment } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const STUFEN = ["Anfrage", "Beratung", "Planung", "Angebot", "Auftrag", "Lieferung", "Service"];
const STUFE_VON = { Neu: 0, Beratung: 1, Planung: 2, Angebot: 3, Ruhend: 1 };

function Vorschau({ a, onClose }) {
  const stufe = STUFE_VON[a.status] ?? 0;
  return (
    <aside className="lg-panel" aria-label={`Vorschau ${a.name}`} key={a.id}>
      <div className="lg-panel__hero">
        <Bild src={a.bild} sizes="420px" />
        <div className="lg-panel__chips">
          <span className="lg-glass-chip">{a.bereich}</span>
          <span className="lg-glass-chip">{a.budget}</span>
        </div>
        <div className="lg-panel__tools">
          <button type="button" className="lg-glass-btn" aria-label="Vorschau schließen" onClick={onClose}><X {...s16} /></button>
        </div>
      </div>
      <div className="lg-panel__body">
        <div className="lg-panel__who">
          <Av kurz={a.kurz} m={a.m} size={56} name={a.name} />
          <div>
            <p className="lg-cap">{a.id} · {a.eingang}</p>
            <h2 className="lg-h2">{a.name}</h2>
            <p className="lg-muted">{a.ort} · über {a.kanal}</p>
          </div>
        </div>
        <div className="lg-panel__contact">
          <button type="button" className="lg-act"><span className="lg-act__ico"><Phone {...S} /></span>Anrufen</button>
          <button type="button" className="lg-act"><span className="lg-act__ico"><Mail {...S} /></span>E-Mail</button>
          <button type="button" className="lg-act"><span className="lg-act__ico"><CalendarPlus {...S} /></span>Termin</button>
          <button type="button" className="lg-act"><span className="lg-act__ico"><MoreHorizontal {...S} /></span>Mehr</button>
        </div>
        <blockquote className="lg-panel__wunsch">
          <p className="lg-cap">Wunsch</p>
          <p>{a.wunsch}</p>
        </blockquote>
        <dl className="lg-facts">
          <div><dt>Fläche</dt><dd>{a.flaeche}</dd></div>
          <div><dt>Zeitraum</dt><dd>{a.zeitraum}</dd></div>
          <div><dt>Quelle</dt><dd>{a.quelle}</dd></div>
          <div><dt>Betreut von</dt><dd className="lg-facts__who"><Av kurz={a.berater} size={24} ring={false} />{TEAM[a.berater].name.split(" ")[0]}</dd></div>
        </dl>
        <div className="lg-mini-reise" aria-label={`Kundenreise: ${STUFEN[stufe]}`}>
          <p className="lg-cap">Kundenreise</p>
          <ol>
            {STUFEN.map((s, i) => (
              <li key={s} className={i < stufe ? "is-done" : i === stufe ? "is-now" : ""} title={s}>
                <span className="lg-mini-reise__dot" />
                {i === stufe && <span className="lg-mini-reise__label">{s}</span>}
              </li>
            ))}
          </ol>
        </div>
        <div className="lg-panel__cta">
          <button type="button" className="lg-btn lg-btn--ink lg-btn--grow"><CalendarPlus {...s16} />Beratung vereinbaren</button>
          <Oeffnen label="Anfrage öffnen" />
        </div>
      </div>
    </aside>
  );
}

export default function Anfragen() {
  const [filter, setFilter] = useState("alle");
  const [sel, setSel] = useState(ANFRAGEN[0].id);
  const liste = useMemo(() => (filter === "alle" ? ANFRAGEN : ANFRAGEN.filter((a) => a.status === filter)), [filter]);
  const aktiv = ANFRAGEN.find((a) => a.id === sel);
  return (
    <Shell bereich="verkauf">
      <section className="lg-pagehead">
        <div>
          <p className="lg-eyebrow">Verkauf</p>
          <h1 className="lg-h1">Anfragen</h1>
        </div>
        <div className="lg-pagehead__stats">
          <span><b className="lg-num">7</b> neu seit gestern</span>
          <span><b className="lg-num">2,4 h</b> bis Erstkontakt, Ø</span>
        </div>
        <button type="button" className="lg-btn lg-btn--ink"><Plus {...S} />Neue Anfrage</button>
      </section>

      <div className="lg-toolbar">
        <Segment label="Status" optionen={FILTER} wert={filter} onChange={setFilter} />
        <div className="lg-toolbar__right">
          <label className="lg-search">
            <Search {...s16} />
            <input type="search" placeholder="Name, Ort, Nummer" aria-label="Anfragen durchsuchen" />
          </label>
          <button type="button" className="lg-chipbtn">Bereich<ChevronDown {...s16} /></button>
          <button type="button" className="lg-chipbtn">Berater<ChevronDown {...s16} /></button>
          <Rund label="Weitere Filter" groesse="s"><SlidersHorizontal {...s16} /></Rund>
        </div>
      </div>

      <div className={`lg-split${aktiv ? " has-panel" : ""}`}>
        <section className="lg-tile lg-list" aria-label="Anfragen">
          <table className="lg-table lg-table--sel">
            <thead>
              <tr>
                <th scope="col">Kunde</th><th scope="col">Bereich</th><th scope="col">Kanal</th>
                <th scope="col">Budget</th><th scope="col">Eingang</th><th scope="col">Berater</th><th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id} aria-selected={a.id === sel} className={a.id === sel ? "is-sel" : undefined} onClick={() => setSel(a.id)}>
                  <td>
                    <button type="button" className="lg-rowbtn" onClick={() => setSel(a.id)} aria-label={`${a.name} öffnen`}>
                      <Bild src={a.bild} className="lg-thumb" sizes="56px" />
                      <span>
                        <span className="lg-strong lg-block">{a.name}</span>
                        <span className="lg-muted lg-block">{a.ort} · {a.id}</span>
                      </span>
                    </button>
                  </td>
                  <td>{a.bereich}</td>
                  <td className="lg-dim">{a.kanal}</td>
                  <td className="lg-num lg-nowrap">{a.budget}</td>
                  <td className="lg-dim lg-nowrap">{a.eingang}</td>
                  <td><Av kurz={a.berater} size={32} /></td>
                  <td><Pille ton={a.ton}>{a.status}</Pille></td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="lg-list__foot">
            <span className="lg-muted">{liste.length} von 24 Anfragen</span>
            <button type="button" className="lg-chipbtn">Weitere laden</button>
          </footer>
        </section>
        {aktiv && <Vorschau a={aktiv} onClose={() => setSel(null)} />}
      </div>
    </Shell>
  );
}
