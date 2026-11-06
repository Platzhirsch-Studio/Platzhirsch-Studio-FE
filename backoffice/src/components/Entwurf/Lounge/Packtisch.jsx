"use client";

import Image from "next/image";
import { useState } from "react";
import {
  AlertTriangle, Check, ChevronLeft, CircleAlert, FileText, Hand, MapPin, Minus, MoreHorizontal, Package, PackageCheck,
  PauseCircle, Plus, Printer, ScanLine, Tag, Volume2,
} from "lucide-react";
import { ThemeKnopf } from "./Shell";
import { AUFTRAEGE } from "./packdaten";
import { BASIS, BILD } from "./daten";
import { Av, Ico, Rund, Segment, Wortmarke } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

function Ring({ wert, gesamt }) {
  const r = 22, u = 2 * Math.PI * r;
  return (
    <svg className="lg-ring" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r={r} className="lg-ring__bg" />
      <circle cx="26" cy="26" r={r} className="lg-ring__fg" strokeDasharray={u} strokeDashoffset={u * (1 - wert / gesamt)} />
    </svg>
  );
}

function Zeile({ p }) {
  const fertig = p.ist >= p.soll;
  const status = fertig ? "fertig" : p.manuell ? "manuell" : p.aktiv ? "aktiv" : "offen";
  return (
    <li className="lg-pz" data-s={status}>
      <span className="lg-pz__img">
        {p.bild ? <Image src={BILD(p.bild)} alt="" fill sizes="56px" /> : <Ico name="Layers" size={24} />}
      </span>
      <span className="lg-pz__txt">
        <span className="lg-block lg-strong">{p.name}</span>
        <span className="lg-block lg-muted">{p.marke} · {p.ean ? <span className="lg-num">{p.ean}</span> : "ohne Barcode"}</span>
      </span>
      <span className="lg-pz__menge lg-num" role="img" aria-label={`${p.ist} von ${p.soll} gescannt`}><b>{p.ist}</b> / {p.soll}</span>
      <span className="lg-pz__st">
        {status === "fertig" && <span className="lg-pz__badge"><Check {...s16} />Vollständig</span>}
        {status === "aktiv" && <span className="lg-pz__badge"><ScanLine {...s16} />Gerade +1</span>}
        {status === "manuell" && <button type="button" className="lg-pz__confirm"><Hand {...s16} />Bestätigen</button>}
        {status === "offen" && <span className="lg-pz__badge">Offen</span>}
      </span>
    </li>
  );
}

export default function Packtisch() {
  const [wahl, setWahl] = useState("paket");
  const [fehler, setFehler] = useState(false);
  const a = AUFTRAEGE[wahl];
  const fertig = a.positionen.filter((p) => p.ist >= p.soll).length;
  const stueck = a.positionen.reduce((s, p) => s + p.ist, 0);
  const stueckGes = a.positionen.reduce((s, p) => s + p.soll, 0);
  const sperrgut = wahl === "sperrgut";

  return (
    <div className="lg-pack">
      <header className="lg-kbar">
        <div className="lg-kbar__l">
          <a href={BASIS} className="lg-round lg-round--s" aria-label="Zur Zentrale"><ChevronLeft {...S} /></a>
          <Wortmarke sub={false} />
          <span className="lg-kbar__sep" aria-hidden="true" />
          <span className="lg-kbar__ctx"><b>Packtisch 1</b> · Lager Lochau</span>
        </div>
        <Segment label="Auftrag" optionen={[{ id: "paket", label: "Paket · LetMeShip" }, { id: "sperrgut", label: "Sperrgut · Tour" }]} wert={wahl} onChange={(w) => { setWahl(w); setFehler(false); }} />
        <div className="lg-kbar__r">
          <span className="lg-kbar__ok"><Volume2 {...s16} />Ton an</span>
          <span className="lg-kbar__uhr lg-num">10:14</span>
          <span className="lg-kbar__op"><Av kurz="DN" size={32} ring={false} />David</span>
          <ThemeKnopf />
        </div>
      </header>

      <div className="lg-pack__scan">
        <label className={`lg-scanfeld${fehler ? " is-err" : ""}`}>
          <ScanLine size={24} strokeWidth={1.75} aria-hidden="true" />
          <input type="text" placeholder="Artikel, Lieferschein oder Pickliste scannen" aria-label="Scanfeld" />
          <span className="lg-scanfeld__last">Zuletzt: <b>{sperrgut ? "Sessel PH-K-0418-02" : "Bordeaux Glas"}</b></span>
        </label>
        <div className="lg-menge" role="group" aria-label="Menge vor dem Scan">
          <span className="lg-menge__l">Menge</span>
          <button type="button" aria-label="Weniger"><Minus {...s16} /></button>
          <span className="lg-num">1</span>
          <button type="button" aria-label="Mehr"><Plus {...s16} /></button>
        </div>
        <div className="lg-fortschritt" aria-live="polite">
          <Ring wert={fertig} gesamt={a.positionen.length} />
          <span><b className="lg-num">{fertig} von {a.positionen.length}</b><span className="lg-block lg-muted">Positionen · {stueck}/{stueckGes} Stück</span></span>
        </div>
      </div>

      <div className="lg-pack__body">
        <aside className="lg-tile lg-pack__auftrag" aria-label="Auftrag">
          <p className="lg-cap">{a.quelle}</p>
          <h1 className="lg-pack__nr lg-num">{a.nr}</h1>
          <div className="lg-pack__versand">
            {sperrgut ? <Ico name="Truck" size={20} /> : <Package {...S} />}
            <span><b>{a.versand}</b><span className="lg-block lg-muted">{a.bezahlt}</span></span>
          </div>
          <div className="lg-pack__adr">
            <MapPin {...s16} />
            <address>{a.adresse.map((z) => <span key={z} className="lg-block">{z}</span>)}</address>
          </div>
          <div className="lg-pack__hinw">
            <p className="lg-cap">Packhinweise</p>
            {a.hinweise.map((h) => (
              <p key={h.text} className="lg-hinweis" data-ton={h.ton}><Ico name={h.icon} size={16} />{h.text}</p>
            ))}
          </div>
        </aside>

        <section className="lg-tile lg-pack__list" aria-label="Positionen">
          <header className="lg-pack__lhead">
            <h2 className="lg-h3">Positionen</h2>
            <span className="lg-muted">Erledigte rutschen nach unten</span>
          </header>
          {fehler && (
            <div className="lg-scanerr" role="alert">
              <span className="lg-scanerr__ico"><CircleAlert size={24} strokeWidth={1.75} aria-hidden="true" /></span>
              <span>
                <b className="lg-block">Falscher Artikel</b>
                <span className="lg-block">„Bellhop Unplugged“ (5056394707334) gehört nicht zu {a.nr}. Bitte zurücklegen.</span>
              </span>
              <span className="lg-scanerr__ton"><Volume2 {...s16} />Fehlerton</span>
            </div>
          )}
          <ol className="lg-pz-list">
            {[...a.positionen].sort((x, y) => (x.ist >= x.soll) - (y.ist >= y.soll) || (y.aktiv ? 1 : 0) - (x.aktiv ? 1 : 0)).map((p) => <Zeile key={p.id} p={p} />)}
          </ol>
          <button type="button" className="lg-demo" onClick={() => setFehler(true)} aria-label="Falschen Artikel scannen (Demo)">Fehlscan zeigen (Demo)</button>
        </section>

        <aside className="lg-tile lg-pack__pakete" aria-label="Packstücke">
          <header className="lg-pack__lhead">
            <h2 className="lg-h3">{sperrgut ? "Packstücke" : "Pakete"}</h2>
            <Rund label="Packstück hinzufügen" groesse="s"><Plus {...s16} /></Rund>
          </header>
          <Segment label="Packmittel" optionen={a.packmittel.map((m) => ({ id: m, label: m }))} wert={a.packmittelWahl} />
          <ul className="lg-pk-list">
            {a.pakete.map((k) => (
              <li key={k.nr} className={`lg-pk${k.status === "In Arbeit" ? " is-now" : ""}`}>
                <div className="lg-pk__head">
                  <span className="lg-pk__nr">{k.nr}</span>
                  <span><b className="lg-block">{k.art}</b><span className="lg-muted">{k.mass}</span></span>
                  <span className="lg-pk__st">{k.status}</span>
                </div>
                <label className={`lg-gewicht${k.ok ? " is-ok" : ""}`}>
                  <span className="lg-gewicht__l">Gewicht</span>
                  <input inputMode="decimal" defaultValue={k.gewicht} placeholder="eintragen" aria-label={`Gewicht Packstück ${k.nr} in kg`} />
                  <span className="lg-gewicht__u">kg</span>
                </label>
                <p className={`lg-plaus${k.ok ? " is-ok" : ""}`}>
                  {k.ok ? <Check {...s16} /> : <AlertTriangle {...s16} />}
                  {k.ok ? `plausibel · erwartet ${k.erwartet}` : `Pflicht vor Etikett · erwartet ${k.erwartet}`}
                </p>
                <p className="lg-muted">Inhalt: {k.inhalt}</p>
              </li>
            ))}
          </ul>
          <button type="button" className="lg-pk-add"><Plus {...s16} />{sperrgut ? "Weiteres Packstück" : "Weiteres Paket"}</button>
          <div className="lg-pk-versand">
            <p className="lg-cap">{sperrgut ? "Übergabe" : "Versand über LetMeShip"}</p>
            <dl>
              {(sperrgut
                ? [["Tour", "3 · Do, 12. Nov"], ["Fahrer", "Markus Gmeiner"], ["Abfahrt", "7:30 Lager"]]
                : [["Dienst", "DPD Home"], ["Abholung", "heute 16:00"], ["Etikett", "nach Gewicht"]]
              ).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
        </aside>
      </div>

      <footer className="lg-pack__foot">
        <div className="lg-problem" role="group" aria-label="Problem melden">
          <span className="lg-problem__l"><AlertTriangle {...s16} />Problem</span>
          <button type="button">Fehlt</button>
          <button type="button">Falsch</button>
          <button type="button">Beschädigt</button>
        </div>
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--l"><PauseCircle {...S} />Zurückstellen</button>
        <span className="lg-pack__spacer" />
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--l"><FileText {...S} />Lieferschein</button>
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--l">{sperrgut ? <Tag {...S} /> : <Printer {...S} />}{sperrgut ? "Packstück-Etikett" : "Etikett · LetMeShip"}</button>
        <button type="button" className="lg-pay-btn lg-pack__go" disabled={fertig < a.positionen.length} aria-describedby="go-hint">
          <PackageCheck size={24} strokeWidth={1.75} aria-hidden="true" />
          <span>{sperrgut ? "An Tour übergeben" : "Paket abschließen"}<span id="go-hint" className="lg-block lg-pack__gohint">{fertig < a.positionen.length ? `noch ${a.positionen.length - fertig} Positionen` : "druckt, bucht aus, mailt"}</span></span>
        </button>
        <Rund label="Weitere Aktionen"><MoreHorizontal {...S} /></Rund>
      </footer>
    </div>
  );
}
