"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus, ChevronDown, Columns3, Globe, List, Mail, MoreHorizontal, Plus, Search, X,
} from "lucide-react";
import Shell from "./Shell";
import { Av, Bild, Ico, Initialen, Status } from "./ui";
import { ANFRAGEN, STATUS, TEAM } from "./daten";

const SCOPES = ["alle", "neu", "qualifiziert", "termin", "angebot", "gewonnen"];
const DOT = { leder: "var(--st-leder-dot)", eiche: "var(--st-eiche-dot)", see: "var(--st-see-dot)", trav: "var(--st-trav-dot)", salbei: "var(--st-salbei-dot)", stein: "var(--st-stein-dot)" };

function Vorschau({ a, onClose }) {
  const st = STATUS[a.status];
  const offen = a.status === "neu";
  return (
    <aside className="sr-preview" aria-label={`Vorschau ${a.name}`}>
      <div className="sr-preview__inner" key={a.id}>
        <div className="sr-preview__hero">
          <Bild src={a.bild} sizes="360px" className="sr-fill" />
          <div className="sr-preview__tools">
            <button type="button" className="sr-iconbtn sr-iconbtn--glass" aria-label="Weitere Aktionen"><MoreHorizontal aria-hidden="true" /></button>
            <button type="button" className="sr-iconbtn sr-iconbtn--glass" aria-label="Vorschau schließen" onClick={onClose}><X aria-hidden="true" /></button>
          </div>
          <div className="sr-preview__herotxt"><Ico name={a.icon} />{a.bereich}</div>
        </div>
        <div className="sr-preview__body">
          <div className="sr-preview__idline">
            <Status m={st.m}>{st.label}</Status>
            <span className="sr-preview__ref num">{a.id}</span>
          </div>
          <h2 className="sr-display sr-preview__name">{a.name}</h2>
          <div className="sr-preview__sub">{a.kontakt} · {a.ort}</div>

          <blockquote className="sr-quote">
            {a.nachricht}
            <footer className="sr-quote__src"><Globe aria-hidden="true" />über {a.quelle}, {a.eingangLang}</footer>
          </blockquote>

          <div className="sr-preview__actions">
            <button type="button" className="sr-btn sr-btn--ink"><CalendarPlus aria-hidden="true" />Termin vorschlagen</button>
            <button type="button" className="sr-btn sr-btn--soft"><Mail aria-hidden="true" />Antworten</button>
          </div>

          <dl className="sr-facts">
            <div><dt>Thema</dt><dd className="sr-wrap">{a.thema}</dd></div>
            <div><dt>Budget</dt><dd className="num">{a.budget} Tsd. €</dd></div>
            <div><dt>Betreut von</dt><dd><Av kurz={a.berater} size={20} />{TEAM[a.berater].name}</dd></div>
            <div><dt>Telefon</dt><dd className="num sr-nowrap">{a.tel}</dd></div>
            <div><dt>Ort</dt><dd className="sr-nowrap">{a.adresse}</dd></div>
          </dl>

          <div className="sr-next">
            <div className="sr-next__h">Verlauf</div>
            <ol className="sr-mini-tl">
              <li><i className="on" /><span>Eingegangen über {a.quelle}</span><time>{a.eingang}</time></li>
              <li><i className={offen ? "" : "on"} /><span>{offen ? "Erstkontakt, Ziel: heute" : `Übernommen von ${TEAM[a.berater].name.split(" ")[0]}`}</span><time>{offen ? "offen" : "erledigt"}</time></li>
              <li><i /><span>Beratung im Showroom</span><time>offen</time></li>
            </ol>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Anfragen() {
  const [scope, setScope] = useState("alle");
  const [ansicht, setAnsicht] = useState("liste");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(ANFRAGEN[0].id);

  const zaehler = useMemo(() => {
    const z = { alle: ANFRAGEN.length };
    for (const a of ANFRAGEN) z[a.status] = (z[a.status] || 0) + 1;
    return z;
  }, []);

  const liste = ANFRAGEN.filter((a) => (scope === "alle" || a.status === scope) && (!q || `${a.name} ${a.ort} ${a.kontakt} ${a.thema} ${a.bereich}`.toLowerCase().includes(q.toLowerCase())));
  const aktiv = ANFRAGEN.find((a) => a.id === sel);

  return (
    <Shell crumbs={["Verkauf", "Anfragen"]} fill>
      <div className="sr-pagehead">
        <h1 className="sr-display sr-h1">Anfragen</h1>
        <span className="sr-pagehead__count num">9 offen · 2 heute neu</span>
        <div className="sr-pagehead__tools">
          <label className="sr-searchfield">
            <Search aria-hidden="true" />
            <span className="sr-visually-hidden">Anfragen durchsuchen</span>
            <input type="search" placeholder="Name, Ort, Thema …" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="sr-seg" role="group" aria-label="Ansicht">
            <button type="button" aria-pressed={ansicht === "liste"} onClick={() => setAnsicht("liste")}><List aria-hidden="true" />Liste</button>
            <button type="button" aria-pressed={ansicht === "tafel"} onClick={() => setAnsicht("tafel")}><Columns3 aria-hidden="true" />Tafel</button>
          </div>
          <button type="button" className="sr-btn sr-btn--ink"><Plus aria-hidden="true" /><span className="sr-btn-label">Anfrage erfassen</span></button>
        </div>
      </div>

      <div className="sr-filters">
        <div className="sr-scope" role="group" aria-label="Status">
          {SCOPES.map((s) => (
            <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)}>
              {s !== "alle" && <i style={{ background: DOT[STATUS[s].m] }} />}
              {s === "alle" ? "Alle" : STATUS[s].label}
              <span className="num">{zaehler[s] || 0}</span>
            </button>
          ))}
        </div>
        <div className="sr-filters__more">
          <button type="button" className="sr-fpill">Bereich <ChevronDown aria-hidden="true" /></button>
          <button type="button" className="sr-fpill">Quelle <ChevronDown aria-hidden="true" /></button>
          <button type="button" className="sr-fpill">Berater <ChevronDown aria-hidden="true" /></button>
        </div>
      </div>

      {ansicht === "liste" ? (
        <div className={`sr-split${aktiv ? "" : " sr-split--solo"}`}>
          <div className="sr-sheet sr-list">
            <div className="sr-list__head" aria-hidden="true">
              <span className="sr-list__h-who">Kunde und Anliegen</span>
              <span className="r">Budget, Tsd. €</span>
              <span>Status</span>
              <span className="r">Eingang</span>
            </div>
            <div className="sr-list__rows" role="listbox" aria-label="Anfragen">
              {liste.map((a) => {
                const st = STATUS[a.status];
                return (
                  <button key={a.id} type="button" role="option" aria-selected={a.id === sel} className={`sr-row${a.status === "verloren" ? " sr-row--muted" : ""}`} onClick={() => setSel(a.id === sel ? null : a.id)}>
                    <span className="sr-who">
                      <span className={a.neu ? "sr-new" : "sr-new sr-new--off"} aria-label={a.neu ? "ungelesen" : undefined} />
                      <span className="sr-av" data-m={a.m} style={{ "--av": "36px" }}>{Initialen(a.name)}</span>
                      <span className="sr-who__txt">
                        <span className="sr-who__name">{a.name}<span className="sr-who__ort">{a.ort}</span></span>
                        <span className="sr-who__sub"><Ico name={a.icon} />{a.thema}</span>
                      </span>
                    </span>
                    <span className="sr-cell-amt num">{a.budget}</span>
                    <span><Status m={st.m}>{st.label}</Status></span>
                    <span className="sr-cell-time num">{a.eingang}</span>
                  </button>
                );
              })}
              {liste.length === 0 && <div className="sr-empty">Keine Anfragen für diese Auswahl.</div>}
            </div>
          </div>
          {aktiv && <Vorschau a={aktiv} onClose={() => setSel(null)} />}
        </div>
      ) : (
        <div className="sr-board">
          {["neu", "qualifiziert", "termin", "angebot", "gewonnen"].map((s) => {
            const items = liste.filter((a) => a.status === s);
            return (
              <section className="sr-col" key={s} aria-label={STATUS[s].label}>
                <div className="sr-col__h"><i style={{ background: DOT[STATUS[s].m] }} />{STATUS[s].label}<span className="num">{items.length}</span></div>
                <div className="sr-col__cards">
                  {items.map((a) => (
                    <button type="button" className="sr-card" key={a.id} onClick={() => { setSel(a.id); setAnsicht("liste"); }}>
                      <Bild src={a.bild} className="sr-card__img" sizes="220px" />
                      <span className="sr-card__t">{a.name}</span>
                      <span className="sr-card__s">{a.thema}</span>
                      <span className="sr-card__f"><span className="num">{a.budget} Tsd. €</span><Av kurz={a.berater} size={22} /></span>
                    </button>
                  ))}
                  <button type="button" className="sr-addrow"><Plus aria-hidden="true" />Anfrage</button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
