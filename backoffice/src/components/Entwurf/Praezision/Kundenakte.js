"use client";

import { useState } from "react";
import {
  Check, Hammer, Banknote, Mail, Phone, FileImage, Pencil, Paperclip,
  AtSign, MapPin, UserRound, Building2, ChevronRight, Plus, Copy,
} from "lucide-react";
import { KUNDE, TEAM } from "./daten";
import { Av, Kbd } from "./ui";

const BILD = "/entwurf/praezision/";
const TL_ICON = { montage: Hammer, zahlung: Banknote, mail: Mail, datei: FileImage, anruf: Phone };
const TABS = [
  { id: "ueberblick", label: "Überblick" },
  { id: "vorgaenge", label: "Vorgänge", n: 3 },
  { id: "dokumente", label: "Dokumente", n: 23 },
  { id: "planung", label: "Planung & Renderings", n: 9 },
  { id: "kommunikation", label: "Kommunikation", n: 41 },
  { id: "notizen", label: "Notizen" },
];

export default function Kundenakte() {
  const [tab, setTab] = useState("ueberblick");
  const k = KUNDE;
  const v = k.vorgang;
  const pBezahlt = (k.zahlungen.bezahlt / k.zahlungen.auftrag) * 100;
  const aktivIdx = v.schritte.findIndex((s) => s.stand === "aktiv");
  const aktivP = v.schritte[aktivIdx]?.fortschritt || 0;

  return (
    <>
      <div className="pz-rec-head">
        <div className="pz-rec-id">
          {k.projektBild ? (
            // eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopie
            <img className="pz-rec-pic" src={BILD + k.projektBild} alt="Projektvorschau: Rendering Küche Penthouse Seestraße" />
          ) : (
            <Av kurz={k.kurz} ton={3} size={64} eckig />
          )}
          <div style={{ minWidth: 0 }}>
            <h1 className="pz-rec-name">{k.name}</h1>
            <div className="pz-rec-meta">
              <span>{k.art}</span><span className="sep" />
              <span>{k.ort}</span><span className="sep" />
              <span>Kunde seit {k.seit}</span><span className="sep" />
              <span className="pz-tier"><i className="pz-mini-card" data-stufe="gold" aria-hidden />{k.karte} · {k.punkte} Punkte</span>
            </div>
          </div>
          <div className="pz-rec-act">
            <button type="button" className="pz-btn" aria-label="E-Mail schreiben"><Mail aria-hidden />E-Mail</button>
            <button type="button" className="pz-btn" aria-label="Anrufen"><Phone aria-hidden />Anrufen</button>
            <button type="button" className="pz-btn pz-btn--primary"><Plus aria-hidden />Vorgang <Kbd>C</Kbd></button>
          </div>
        </div>

        <section className="pz-flow" aria-label={`Vorgang ${v.nummer}`}>
          <div className="pz-flow-head">
            <b>{v.titel}</b>
            <span className="pz-id">{v.nummer}</span>
            <span className="pz-flow-next">Nächster Schritt <b>Küchenmontage Mo., 9. Nov., 7:30</b> · Tobias Kranz</span>
          </div>
          <div style={{ position: "relative", "--done": `calc(${(aktivIdx + aktivP) * 20}% - 4px)` }}>
            <span className="pz-flow-done" aria-hidden />
            <span className="pz-flow-tip" aria-hidden />
            <ol className="pz-flow-steps">
              {v.schritte.map((s) => (
                <li key={s.name} className="pz-step" data-stand={s.stand} aria-current={s.stand === "aktiv" ? "step" : undefined}>
                  <span className="pz-step-pt" aria-hidden />
                  <span className="pz-step-name">{s.name}{s.stand === "fertig" && <Check size={13} aria-label="erledigt" style={{ color: "var(--text-3)" }} />}</span>
                  <span className="pz-step-info">{s.datum} · {s.info}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <div className="pz-tabs" role="tablist" aria-label="Bereiche der Kundenakte">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="pz-view" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}{t.n ? <span className="num">{t.n}</span> : null}
          </button>
        ))}
      </div>

      <div className="pz-rec-body">
        <div className="pz-rec-main">
          <section aria-labelledby="h-pos">
            <div className="pz-sec-head">
              <h2 className="pz-h2" id="h-pos">Positionen {v.nummer}</h2>
              <span className="pz-count">5 von 14</span>
              <span className="pz-sec-act"><a href="#" className="pz-link">Auftrag öffnen <ChevronRight aria-hidden /></a></span>
            </div>
            <div className="pz-pos" role="table" aria-label="Positionen">
              <div className="pz-pos-row pz-pos-row--head" role="row">
                <span role="columnheader"><span className="sr">Bild</span></span>
                <span role="columnheader">Artikel</span>
                <span role="columnheader" className="r">Menge</span>
                <span role="columnheader" className="r">Betrag</span>
                <span role="columnheader" className="r">Stand</span>
              </div>
              {k.positionen.map((p) => (
                <div key={p.name} className="pz-pos-row" role="row">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien */}
                  <span role="cell"><img className="pz-thumb" src={BILD + p.bild} alt="" /></span>
                  <div role="cell" style={{ minWidth: 0 }}>
                    <div className="pz-li-title">{p.name}</div>
                    <div className="pz-li-sub">{p.marke}</div>
                  </div>
                  <span role="cell" className="r t3 num">{p.menge}×</span>
                  <span role="cell" className="r num">{p.betrag}</span>
                  <span role="cell" className="r"><span className="pz-stat"><span className="pz-dot" data-ton={p.ton} />{p.status}</span></span>
                </div>
              ))}
            </div>
            <div className="pz-pos-total">
              <span className="meta" style={{ fontWeight: 400 }}>+ 9 weitere Positionen · Montage, Transport, Planung</span>
              <span className="r">142.600,00 €</span>
              <span />
            </div>
          </section>

          <section aria-labelledby="h-tl">
            <div className="pz-sec-head">
              <h2 className="pz-h2" id="h-tl">Zeitleiste</h2>
              <span className="pz-sec-act">
                <span className="pz-seg" role="group" aria-label="Zeitleiste filtern">
                  <button type="button" aria-pressed="true">Alles</button>
                  <button type="button" aria-pressed="false">Gespräche</button>
                  <button type="button" aria-pressed="false">Dateien</button>
                  <button type="button" aria-pressed="false">Geld</button>
                </span>
              </span>
            </div>
            <div className="pz-composer" role="button" tabIndex={0}>
              <Av kurz="LH" ton={TEAM.LH.ton} size={24} />
              <span className="pz-composer-txt">Notiz, Anruf oder E-Mail festhalten …</span>
              <Paperclip size={16} aria-hidden />
              <Kbd>N</Kbd>
            </div>
            <div className="pz-tl">
              {k.zeitleiste.map((e, i) => {
                const Icon = TL_ICON[e.art];
                return (
                  <div key={i} className="pz-tl-row">
                    <span className="pz-tl-ico" data-art={e.art}><Icon aria-hidden /></span>
                    <div style={{ minWidth: 0 }}>
                      <div className="pz-tl-top">
                        <b>{e.titel}</b>
                        <span className="meta">{TEAM[e.wer].name}</span>
                        <span className="pz-tl-time">{e.zeit}</span>
                      </div>
                      <div className="pz-tl-text">{e.text}</div>
                      {e.bild && (
                        <div className="pz-tl-file">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien */}
                          <img src={BILD + e.bild} alt="Rendering Küche, Ansicht Kochinsel" />
                          {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien */}
                          <img src={BILD + "gaggenau-backofen-marmorwand.webp"} alt="Rendering Geräte-Wand" />
                          <span className="pz-sketch"><Pencil size={14} aria-hidden />Handzeichnung</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="pz-rec-side" aria-label="Eigenschaften">
          <section>
            <h3>Beträge {v.nummer}</h3>
            <div className="pz-money">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="pz-money-big">18.400 €</span>
                <span className="meta">offen · {Math.round(100 - pBezahlt)} %</span>
              </div>
              <div className="pz-money-bar" role="img" aria-label={`${Math.round(pBezahlt)} % bezahlt`}>
                <span style={{ flex: k.zahlungen.bezahlt }} />
                <span style={{ flex: k.zahlungen.offen }} />
              </div>
              <div className="pz-money-row"><i style={{ background: "var(--text)" }} />Bezahlt<span className="num">124.200 €</span></div>
              <div className="pz-money-row"><i style={{ background: "var(--g7)" }} />Schlussrechnung<span className="num">18.400 €</span></div>
              <div className="pz-money-row t3" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>Auftragssumme<span className="num" style={{ color: "var(--text)" }}>142.600 €</span></div>
            </div>
          </section>

          <section>
            <h3>Kontakt</h3>
            <dl className="pz-props" style={{ gridTemplateColumns: "28px minmax(0,1fr)" }}>
              <dt><AtSign size={14} aria-label="E-Mail" /></dt><dd><span>{k.mail}</span><button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" style={{ marginLeft: "auto", width: 24, height: 24 }} aria-label="E-Mail kopieren"><Copy /></button></dd>
              <dt><Phone size={14} aria-label="Telefon" /></dt><dd><span className="num">{k.tel}</span></dd>
              <dt style={{ alignSelf: "start", paddingTop: 0 }}><MapPin size={14} aria-label="Adresse" /></dt><dd style={{ flexDirection: "column", alignItems: "flex-start", gap: 0, paddingTop: 4 }}>{k.adresse.map((z) => <span key={z}>{z}</span>)}</dd>
            </dl>
          </section>

          <section>
            <h3>Bezüge</h3>
            <div className="pz-rel">
              <a href="#"><Av kurz={TEAM.LH.kurz} ton={TEAM.LH.ton} size={24} /><span>Lena Hofer</span><span className="t3">Beraterin</span></a>
              <a href="#"><span className="pz-av" data-sq="" data-t="5" style={{ "--s": "24px" }}><Building2 size={12} aria-hidden /></span><span>Atelier Vogelsang</span><span className="t3">Architekt</span></a>
              <a href="#"><span className="pz-av" data-t="6" style={{ "--s": "24px" }}><UserRound size={12} aria-hidden /></span><span>Dr. Matthias Riedl</span><span className="t3">Empfohlen</span></a>
            </div>
          </section>

          <section>
            <h3>Weitere Vorgänge</h3>
            <div className="pz-rel">
              {k.vorgaenge.slice(1).map((g) => (
                <a href="#" key={g.nummer} style={{ height: 48 }}><span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}><span>{g.titel}</span><span className="meta"><span className="pz-id">{g.nummer}</span> · {g.stand}</span></span><span className="t3 num">{g.betrag}</span></a>
              ))}
            </div>
          </section>

          <section>
            <h3>Umsatz gesamt</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{k.umsatzGesamt}</span>
              <span className="meta">seit 2019 · 6 Aufträge</span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
