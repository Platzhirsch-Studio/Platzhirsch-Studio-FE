"use client";

import { useEffect, useMemo, useState } from "react";
import {
  List, Columns3, Plus, X, ChevronUp, ChevronDown, Globe, Phone, Store, Mail, Instagram, Handshake, SlidersHorizontal,
  ArrowDownWideNarrow, Reply, CalendarPlus, MapPin, AtSign, UserRound, Euro, CircleDot, Paperclip, Inbox,
} from "lucide-react";
import { ANFRAGEN, QUELLEN, STATUS, TEAM, euro } from "./daten";
import { Av, Kbd, Mat, StatusRing } from "./ui";

const BILD = "/entwurf/praezision/";
const QUELLE_ICON = { web: Globe, tel: Phone, showroom: Store, empfehlung: Handshake, mail: Mail, instagram: Instagram };
const REIHENFOLGE = ["neu", "qualifiziert", "termin", "angebot", "gewonnen"];
const STUFE = { neu: 0, qualifiziert: 1, termin: 2, angebot: 3, gewonnen: 4 };

const ANSICHTEN = [
  { id: "alle", label: "Alle offenen", n: 48 },
  { id: "meine", label: "Mir zugewiesen", n: 12 },
  { id: "objekt", label: "Hotel & Objekt", n: 9 },
  { id: "warten", label: "Ohne Antwort > 24 h", n: 3 },
];

function Quelle({ q }) {
  const Icon = QUELLE_ICON[q];
  return <span className="pz-src"><Icon aria-hidden />{QUELLEN[q]}</span>;
}

function Vorschau({ a, onClose, onPrev, onNext }) {
  const z = TEAM[a.zust];
  return (
    <aside className="pz-preview" key={a.id} aria-label={`Vorschau ${a.name}`}>
      <div className="pz-pv-scroll">
        <div className="pz-pv-top">
          <span className="pz-id">{a.id}</span>
          <span aria-hidden>·</span>
          <span>{a.eingangLang}</span>
          <span className="pz-pv-nav">
            <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" onClick={onPrev} aria-label="Vorherige Anfrage (K)"><ChevronUp /></button>
            <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" onClick={onNext} aria-label="Nächste Anfrage (J)"><ChevronDown /></button>
            <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" onClick={onClose} aria-label="Vorschau schließen (Esc)"><X /></button>
          </span>
        </div>
        {a.bild && (
          <figure className="pz-pv-media" style={{ margin: "0 20px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopie */}
            <img src={BILD + a.bild} alt={`Anhang: ${a.anhang}`} />
            <figcaption><Paperclip aria-hidden />{a.anhang}</figcaption>
          </figure>
        )}
        <div className="pz-pv-head">
          <div className="pz-pv-title">
            <h2>{a.name}</h2>
            <div className="meta" style={{ marginTop: 2 }}>{a.firma ? a.person : "Privatkunde"} · {a.ort}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pz-chip"><StatusRing ton={STATUS[a.status].ton} stufe={STUFE[a.status]} />{STATUS[a.status].label}</span>
            <span className="pz-chip">{a.bereich}</span>
            <span className="pz-chip"><Quelle q={a.quelle} /></span>
          </div>
        </div>
        <div className="pz-pv-sec">
          <p className="pz-pv-subj">{a.anliegen}</p>
          <p className="pz-quote">{a.nachricht}</p>
          <div className="pz-wishes">
            {a.wuensche.map((w) => <span key={w} className="pz-tag">{w}</span>)}
          </div>
        </div>
        <div className="pz-pv-sec">
          <h3>Details</h3>
          <dl className="pz-props">
            <dt><UserRound aria-hidden />Zuständig</dt>
            <dd><Av kurz={a.zust} ton={z.ton} /><span>{z.name}</span></dd>
            <dt><Euro aria-hidden />Volumen</dt>
            <dd><span className="num">≈ {euro(a.wert)}</span></dd>
            <dt><AtSign aria-hidden />E-Mail</dt>
            <dd><span>{a.mail}</span></dd>
            <dt><Phone aria-hidden />Telefon</dt>
            <dd><span className="num">{a.tel}</span></dd>
            <dt><MapPin aria-hidden />Ort</dt>
            <dd><span>{a.ort}</span></dd>
          </dl>
        </div>
        <div className="pz-pv-sec" style={{ borderBottom: 0 }}>
          <h3>Verlauf</h3>
          <div className="pz-feed">
            <div className="pz-feed-row"><Inbox size={14} aria-hidden style={{ color: "var(--text-3)", justifySelf: "center" }} /><span className="pz-feed-text">Eingang über <b>{QUELLEN[a.quelle]}</b></span><span className="pz-feed-time">{a.eingang}</span></div>
            <div className="pz-feed-row"><Av kurz="SA" ton={TEAM.SA.ton} /><span className="pz-feed-text"><b>Sophie</b> hat an {z.name.split(" ")[0]} zugewiesen</span><span className="pz-feed-time">{a.eingang}</span></div>
          </div>
        </div>
      </div>
      <div className="pz-pv-act">
        <button type="button" className="pz-btn"><Reply aria-hidden />Antworten <Kbd>R</Kbd></button>
        <button type="button" className="pz-btn pz-btn--primary"><CalendarPlus aria-hidden />Termin vorschlagen</button>
      </div>
    </aside>
  );
}

export default function AnfragenAnsicht() {
  const [ansicht, setAnsicht] = useState("liste");
  const [tab, setTab] = useState("alle");
  const [sel, setSel] = useState(ANFRAGEN[0].id);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Vorführmodus ?ansicht=board
      if (new URL(window.location.href).searchParams.get("ansicht") === "board") setAnsicht("board");
    } catch {}
  }, []);

  const gruppen = useMemo(() => REIHENFOLGE.map((s) => ({ s, items: ANFRAGEN.filter((a) => a.status === s) })).filter((g) => g.items.length), []);
  const flach = gruppen.flatMap((g) => g.items);
  const idx = flach.findIndex((a) => a.id === sel);
  const aktuell = flach[idx];

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setSel((s) => flach[Math.min(flach.findIndex((a) => a.id === s) + 1, flach.length - 1)].id); }
      if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setSel((s) => flach[Math.max(flach.findIndex((a) => a.id === s) - 1, 0)].id); }
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flach]);

  const summe = ANFRAGEN.reduce((s, a) => s + a.wert, 0);

  return (
    <>
      <h1 className="sr">Anfragen</h1>
      <div className="pz-views">
        <span role="tablist" aria-label="Gespeicherte Ansichten" style={{ display: "contents" }}>
          {ANSICHTEN.map((v) => (
            <button key={v.id} type="button" role="tab" className="pz-view" aria-selected={tab === v.id} onClick={() => setTab(v.id)}>
              {v.label} <span className="num">{v.n}</span>
            </button>
          ))}
        </span>
        <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Ansicht speichern" style={{ marginLeft: 2 }}><Plus /></button>
        <span className="pz-views-end">
          <span className="pz-seg" role="group" aria-label="Darstellung">
            <button type="button" aria-pressed={ansicht === "liste"} onClick={() => setAnsicht("liste")}><List aria-hidden />Liste</button>
            <button type="button" aria-pressed={ansicht === "board"} onClick={() => setAnsicht("board")}><Columns3 aria-hidden />Board</button>
          </span>
        </span>
      </div>
      <div className="pz-filterbar">
        <span className="pz-filter">
          <span><CircleDot aria-hidden />Status</span>
          <span>ist nicht</span>
          <span><b>Verloren, Spam</b></span>
          <button type="button" aria-label="Filter entfernen"><X /></button>
        </span>
        <span className="pz-filter">
          <span><MapPin aria-hidden />Region</span>
          <span>ist</span>
          <span><b>Bodensee</b></span>
          <button type="button" aria-label="Filter entfernen"><X /></button>
        </span>
        <button type="button" className="pz-btn pz-btn--ghost pz-btn--sm"><Plus aria-hidden />Filter</button>
        <span className="pz-filter-end">
          <span className="meta num pz-hide-ipad" style={{ marginRight: 8 }}>{ANFRAGEN.length} von 48 · ≈ {euro(summe)}</span>
          <button type="button" className="pz-btn pz-btn--ghost pz-btn--sm"><ArrowDownWideNarrow aria-hidden />Eingang</button>
          <button type="button" className="pz-btn pz-btn--ghost pz-btn--sm"><SlidersHorizontal aria-hidden />Anzeige</button>
        </span>
      </div>

      {ansicht === "liste" ? (
        <div className="pz-split" data-open={aktuell ? "" : undefined}>
          <div className="pz-scroll">
            {/* Gruppiert nach Status → keine Statusspalte (sie würde dasselbe zweimal sagen). */}
            <div className="pz-rows" role="table" aria-label="Anfragen, gruppiert nach Status">
              <div className="pz-row pz-row--head" role="row">
                <span role="columnheader">Anfrage</span>
                <span role="columnheader" className="pz-hide-ipad">Bereich</span>
                <span role="columnheader" className="r">Volumen</span>
                <span role="columnheader"><span className="sr">Zuständig</span></span>
                <span role="columnheader" className="r pz-hide-ipad">Eingang</span>
              </div>
              {gruppen.map((g) => (
                <GruppenZeilen key={g.s} g={g} sel={sel} setSel={setSel} />
              ))}
            </div>
            <div className="pz-list-foot">
              <span><Kbd>J</Kbd> <Kbd>K</Kbd> navigieren</span>
              <span><Kbd>↵</Kbd> öffnen</span>
              <span><Kbd>Esc</Kbd> Vorschau schließen</span>
            </div>
          </div>
          {aktuell && (
            <Vorschau
              a={aktuell}
              onClose={() => setSel(null)}
              onPrev={() => setSel(flach[Math.max(idx - 1, 0)].id)}
              onNext={() => setSel(flach[Math.min(idx + 1, flach.length - 1)].id)}
            />
          )}
        </div>
      ) : (
        <div className="pz-board">
          {gruppen.map((g) => (
            <div key={g.s} className="pz-col">
              <div className="pz-col-head">
                <StatusRing ton={STATUS[g.s].ton} stufe={STUFE[g.s]} />
                {STATUS[g.s].label} <span className="num">{g.items.length}</span>
                <span className="pz-group-sum num">{euro(g.items.reduce((s, a) => s + a.wert, 0))}</span>
              </div>
              {g.items.map((a) => (
                <div key={a.id} className="pz-card" tabIndex={0}>
                  {a.bild && (
                    // eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopie
                    <img className="pz-card-img" src={BILD + a.bild} alt="" />
                  )}
                  <div>
                    <div className="pz-li-title">{a.name}</div>
                    <div className="pz-li-sub">{a.anliegen}</div>
                  </div>
                  <div className="pz-card-foot">
                    <span className="num">{euro(a.wert)}</span>
                    <Av kurz={a.zust} ton={TEAM[a.zust].ton} title={TEAM[a.zust].name} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function GruppenZeilen({ g, sel, setSel }) {
  const st = STATUS[g.s];
  return (
    <div role="rowgroup">
      <div className="pz-group" role="row">
        <span role="cell" style={{ display: "contents" }}>
          <StatusRing ton={st.ton} stufe={STUFE[g.s]} />
          {st.label} <span className="num">{g.items.length}</span>
          <span className="pz-group-sum">≈ {euro(g.items.reduce((s, a) => s + a.wert, 0))}</span>
        </span>
      </div>
      {g.items.map((a) => (
        <div key={a.id} role="row" className="pz-row pz-row--item" aria-selected={sel === a.id} onClick={() => setSel(a.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSel(a.id)}>
          <span role="cell" className="pz-who">
            <Mat bild={a.bild} kurz={a.kurz} ton={a.ton} size={36} eckig />
            <span className="pz-who-txt">
              <span className="pz-who-name">{a.name}</span>
              <span className="pz-who-sub">{a.anliegen}<span className="pz-ein-narrow"> · {a.eingang}</span></span>
            </span>
          </span>
          <span role="cell" className="pz-hide-ipad"><span className="pz-tag">{a.bereich}</span></span>
          <span role="cell" className="r num">{euro(a.wert)}</span>
          <span role="cell"><Av kurz={a.zust} ton={TEAM[a.zust].ton} title={TEAM[a.zust].name} /></span>
          <span role="cell" className="r meta num pz-hide-ipad">{a.eingang}</span>
        </div>
      ))}
    </div>
  );
}
