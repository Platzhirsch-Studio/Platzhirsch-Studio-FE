"use client";

import { BarChart3, Clock, MapPin, MoreHorizontal, Play, Plus, Search, SlidersHorizontal } from "lucide-react";
import Shell from "./Shell";
import { TEAM, AKTIVITAET, HEUTE, ICH, KOPFZAHLEN, PIPELINE, PROJEKTE, UMSATZ, WARTET } from "./daten";
import { Av, AvReihe, Bild, Oeffnen, Pille, Rund, Zahl } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

function Kopf() {
  return (
    <section className="lg-greet" aria-labelledby="gruss">
      <div>
        <p className="lg-eyebrow">{HEUTE.datum} · Showroom Lochau</p>
        <h1 id="gruss" className="lg-greet__title">Guten Morgen,<br /><span>{ICH.vorname}</span></h1>
      </div>
      <dl className="lg-greet__stats">
        {KOPFZAHLEN.map((k) => (
          <div key={k.label} className="lg-greet__stat">
            <dt>{k.label}</dt>
            <dd><Zahl wert={k.wert} dez={k.dez || 0} />{k.suffix && <small>{k.suffix}</small>}</dd>
          </div>
        ))}
      </dl>
      <div className="lg-greet__act">
        <Rund label="Berichte"><BarChart3 {...S} /></Rund>
        <button type="button" className="lg-btn lg-btn--ink"><Plus {...S} />Neue Anfrage</button>
      </div>
    </section>
  );
}

function Heute() {
  const a = HEUTE.aktiv;
  return (
    <section className="lg-tile lg-heute" aria-labelledby="heute-t">
      <header className="lg-tile__head">
        <div>
          <p className="lg-cap">Heute</p>
          <h2 id="heute-t" className="lg-h3">5 Termine</h2>
        </div>
        <Rund label="Termin anlegen" groesse="s"><Plus {...s16} /></Rund>
      </header>
      <article className="lg-now" aria-label="Aktiver Termin">
        <div className="lg-now__who">
          <Av kurz={a.kurz} m={a.m} size={48} name={a.kunde} />
          <div>
            <h3 className="lg-now__name">{a.kunde}</h3>
            <p className="lg-now__art">{a.art}</p>
          </div>
        </div>
        <dl className="lg-now__facts">
          <div><dt>Zeit</dt><dd className="lg-num">{a.zeit}</dd></div>
          <div><dt>Ort</dt><dd>{a.ort.split(" · ")[1]}</dd></div>
        </dl>
        <p className="lg-now__note"><MapPin {...s16} />{a.notiz}</p>
        <div className="lg-now__act">
          <button type="button" className="lg-btn lg-btn--ink lg-btn--grow"><Play {...s16} />Beratung starten</button>
          <Rund label="Verschieben" groesse="s"><Clock {...s16} /></Rund>
        </div>
      </article>
      <ul className="lg-next" aria-label="Folgetermine">
        {HEUTE.folgend.map((f, i) => (
          <li key={f.kunde} className="lg-next__i" style={{ "--i": i }}>
            <div>
              <p className="lg-next__name">{f.kunde}</p>
              <p className="lg-next__art" data-ton={f.ton}>{f.art}</p>
            </div>
            <span className="lg-next__zeit lg-num">{f.zeit}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Wartet() {
  return (
    <article className="lg-tile lg-tile--lift lg-wartet" aria-labelledby="wartet-t">
      <p className="lg-cap" id="wartet-t">{WARTET.titel}</p>
      <blockquote className="lg-wartet__q">{WARTET.text}</blockquote>
      <p className="lg-wartet__von">{WARTET.von} <span aria-hidden="true">·</span> <span className="lg-wartet__ber">{WARTET.bereich}</span></p>
      <div className="lg-tile__foot">
        <AvReihe leute={WARTET.personen} mehr={WARTET.mehr} size={32} />
        <Oeffnen label="Angebot öffnen" />
      </div>
    </article>
  );
}

function Akzent({ ton, cap, wert, text, label }) {
  return (
    <article className="lg-tile lg-tile--lift lg-akzent" data-ton={ton}>
      <p className="lg-akzent__cap">{cap}</p>
      <p className="lg-akzent__text">{text}</p>
      <div className="lg-tile__foot">
        <span className="lg-akzent__num"><Zahl wert={wert} /></span>
        <Oeffnen label={label} hell={ton === "cognac"} />
      </div>
    </article>
  );
}

function Pipeline() {
  const max = Math.max(...PIPELINE.map((p) => p.n));
  return (
    <section className="lg-tile lg-pipe" aria-labelledby="pipe-t">
      <header className="lg-tile__head">
        <div>
          <h2 id="pipe-t" className="lg-h3">Pipeline</h2>
          <p className="lg-sub">1,18 Mio € in offenen Vorgängen</p>
        </div>
        <Rund label="Pipeline öffnen" groesse="s"><MoreHorizontal {...s16} /></Rund>
      </header>
      <div className="lg-pipe__sum">
        <div><span className="lg-pipe__big"><Zahl wert={53} /></span><span className="lg-muted">Vorgänge</span></div>
        <div><span className="lg-pipe__big"><Zahl wert={32} /><small> %</small></span><span className="lg-muted">Abschlussquote</span></div>
        <div><span className="lg-pipe__big"><Zahl wert={18} /><small> Tage</small></span><span className="lg-muted">bis Auftrag, Ø</span></div>
      </div>
      <ol className="lg-pipe__rows">
        {PIPELINE.map((p, i) => (
          <li key={p.stufe} className="lg-pipe__row" style={{ "--i": i }}>
            <span className="lg-pipe__label">{p.stufe}</span>
            <span className="lg-pipe__track" title={`${p.stufe}: ${p.n} Vorgänge${p.wert ? `, ${p.wert} T€` : ""}`}>
              <span className="lg-pipe__bar" style={{ "--w": `${(p.n / max) * 100}%` }} data-hi={p.stufe === "Angebot" || undefined} />
            </span>
            <span className="lg-pipe__n lg-num">{p.n}</span>
            <span className="lg-pipe__wert lg-num">{p.wert ? `${p.wert} T€` : "–"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Umsatz() {
  const max = 300;
  return (
    <section className="lg-tile lg-umsatz" aria-labelledby="ums-t">
      <header className="lg-tile__head">
        <div>
          <h2 id="ums-t" className="lg-h3">Umsatz</h2>
          <p className="lg-sub">Netto je Monat, in T€</p>
        </div>
        <span className="lg-trend">+18 % ggü. Vorjahr</span>
      </header>
      <div className="lg-umsatz__big"><Zahl wert={1075} /><small> T€ seit Juni</small></div>
      <div className="lg-bars" role="img" aria-label={UMSATZ.map((u) => `${u.m} ${u.v} T€`).join(", ")}>
        {UMSATZ.map((u) => (
          <div key={u.m} className="lg-bars__col" tabIndex={0} aria-label={`${u.m}: ${u.v} T€${u.laufend ? " (laufend)" : ""}`}>
            <span className="lg-bars__tip lg-num">{u.v} T€</span>
            <span className={`lg-bars__bar${u.m === "Okt" ? " is-hi" : ""}${u.laufend ? " is-run" : ""}`} style={{ "--h": `${(u.v / max) * 100}%` }} />
            <span className="lg-bars__m">{u.m}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Projekte() {
  return (
    <section className="lg-tile lg-proj" aria-labelledby="proj-t">
      <header className="lg-tile__head">
        <div>
          <h2 id="proj-t" className="lg-h3">Laufende Projekte</h2>
          <p className="lg-sub">23 Projekte · 4 mit Termin diese Woche</p>
        </div>
        <div className="lg-tile__tools">
          <label className="lg-search">
            <Search {...s16} />
            <input type="search" placeholder="Projekt oder Kunde" aria-label="Projekte durchsuchen" />
          </label>
          <Rund label="Filter" groesse="s"><SlidersHorizontal {...s16} /></Rund>
          <Oeffnen label="Alle Projekte" />
        </div>
      </header>
      <table className="lg-table">
        <thead>
          <tr><th scope="col">Projekt</th><th scope="col">Stufe</th><th scope="col">Team</th><th scope="col">Nächster Schritt</th><th scope="col" className="r">Wert</th></tr>
        </thead>
        <tbody>
          {PROJEKTE.map((p, i) => (
            <tr key={p.id} style={{ "--i": i }}>
              <td>
                <div className="lg-cell-proj">
                  <Bild src={p.bild} className="lg-thumb" sizes="56px" />
                  <div>
                    <p className="lg-strong">{p.titel}</p>
                    <p className="lg-muted">{p.kunde}</p>
                  </div>
                </div>
              </td>
              <td><Pille ton={p.ton}>{p.stufe}</Pille></td>
              <td><AvReihe leute={p.team} max={3} size={28} /></td>
              <td>
                <p className="lg-cell-next">{p.naechst}</p>
                <span className="lg-prog" role="img" aria-label={`Fortschritt ${p.fort} %`}><span style={{ "--w": `${p.fort}%` }} /></span>
              </td>
              <td className="r lg-num lg-strong">{p.wert}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Aktivitaet() {
  return (
    <section className="lg-tile lg-akt" aria-labelledby="akt-t">
      <header className="lg-tile__head">
        <h2 id="akt-t" className="lg-h3">Aktivität</h2>
        <a href="#protokoll" className="lg-link">Alle</a>
      </header>
      <ol className="lg-akt__list">
        {AKTIVITAET.map((a, i) => (
          <li key={i} className="lg-akt__i" style={{ "--i": i }}>
            <Av kurz={a.wer} size={36} />
            <div>
              <p className="lg-akt__txt"><b>{TEAM[a.wer].name.split(" ")[0]}</b> {a.was}</p>
              <p className="lg-muted">{a.wo} · {a.wann}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Zentrale() {
  return (
    <Shell bereich="zentrale">
      <Kopf />
      <div className="lg-bento lg-bento--z">
        <div className="z-heute"><Heute /></div>
        <div className="z-wartet"><Wartet /></div>
        <div className="z-a1"><Akzent ton="cognac" cap="Neu seit gestern" wert={7} text="Anfragen warten auf den Erstkontakt." label="Neue Anfragen öffnen" /></div>
        <div className="z-a2"><Akzent ton="salbei" cap="Diese Woche" wert={4} text="Montagen, alle Teams bestätigt." label="Montageplan öffnen" /></div>
        <div className="z-pipe"><Pipeline /></div>
        <div className="z-ums"><Umsatz /></div>
        <div className="z-proj"><Projekte /></div>
        <div className="z-akt"><Aktivitaet /></div>
      </div>
    </Shell>
  );
}
