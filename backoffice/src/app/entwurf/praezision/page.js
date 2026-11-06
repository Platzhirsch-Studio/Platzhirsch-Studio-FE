import { ArrowUpRight, ArrowDownRight, MapPin, ChevronRight, Plus, CalendarPlus, Reply } from "lucide-react";
import Shell from "@/components/Entwurf/Praezision/Shell";
import UmsatzChart from "@/components/Entwurf/Praezision/UmsatzChart";
import { Av, Avs, Kbd, Sparkline } from "@/components/Entwurf/Praezision/ui";
import { AKTIVITAET, AUFGABEN, HEUTE, ICH, KENNZAHLEN, LIEFERUNGEN, PIPELINE, TEAM } from "@/components/Entwurf/Praezision/daten";

export const metadata = { title: "Zentrale" };

// Sequenzielle Abstufung (eine Familie, hell → dunkel), Auftrag = Messing.
const PIPE_TON = ["var(--g6)", "var(--g8)", "var(--g11)", "var(--acc)"];
const LIEFER_TON = { Bereit: "gruen", Unterwegs: "blau", Geplant: "grau" };

export default function Zentrale() {
  const pipeSumme = PIPELINE.reduce((s, p) => s + p.wert, 0);
  return (
    <Shell
      aktiv="zentrale"
      crumbs={["Zentrale"]}
      aktionen={
        <>
          <button type="button" className="pz-btn pz-btn--ghost"><CalendarPlus aria-hidden />Termin <Kbd>T</Kbd></button>
          <button type="button" className="pz-btn pz-btn--primary" style={{ marginRight: 4 }}><Plus aria-hidden />Neue Anfrage <Kbd>C</Kbd></button>
        </>
      }
    >
      {/* Markenmoment: Raumbild des laufenden Projekts, auf das Blatt ausgeblendet */}
      <header className="pz-hero">
        {/* eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopie */}
        <img className="pz-hero-img" src="/entwurf/praezision/minotti-patio.jpg" alt="" />
        <div className="pz-hero-txt">
          <span className="pz-hero-eyebrow">Mittwoch, 4. November · KW 45</span>
          <h1 className="pz-h1">Guten Morgen, {ICH.name.split(" ")[0]}</h1>
          <p>4 Termine, 2 Aufgaben heute fällig, 1 Lieferung morgen.</p>
        </div>
        <span className="pz-hero-cap"><span className="pz-dot" data-ton="messing" /><b>Hotel Lindwurm am See</b> Seeterrasse · Aufmaß läuft</span>
      </header>

      <div className="pz-page">
        <div className="pz-alert" role="status">
          <span className="pz-alert-ring" aria-hidden />
          <span className="pz-alert-txt"><b>Seit 26 Stunden ohne Antwort</b>Hotel Lindwurm am See wartet auf die Terminbestätigung für die Lobby-Bemusterung.</span>
          <button type="button" className="pz-btn"><Reply aria-hidden />Jetzt antworten <Kbd>R</Kbd></button>
        </div>

        <section aria-label="Kennzahlen" className="pz-metrics">
          {KENNZAHLEN.map((k) => (
            <a key={k.id} href="#" className="pz-metric">
              <span className="pz-metric-label">{k.label}</span>
              <span className="pz-metric-val">{k.wert}</span>
              <Sparkline werte={k.reihe} />
              <span className="pz-metric-ctx">
                <span className="pz-delta" data-trend={k.trend}>
                  {k.trend === "auf" ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
                  {k.delta}
                </span>
                {k.kontext}
              </span>
            </a>
          ))}
        </section>

        <div className="pz-grid-2">
          <div className="pz-stack">
            <section aria-labelledby="h-heute">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-heute">Heute</h2>
                <span className="pz-count">4 Termine</span>
                <span className="pz-sec-act"><a href="#" className="pz-link">Kalender <ChevronRight aria-hidden /></a></span>
              </div>
              <div className="pz-agenda">
                {HEUTE.map((t) => (
                  <div key={t.zeit} className="pz-agenda-row" data-status={t.status}>
                    <div className="pz-agenda-time">{t.zeit}<small>{t.dauer}</small></div>
                    <div className="pz-agenda-rail" aria-hidden />
                    <div style={{ minWidth: 0 }}>
                      <div className="pz-agenda-title">
                        <span>{t.titel}</span>
                        {t.status === "jetzt" && <span className="pz-now">Läuft</span>}
                      </div>
                      <div className="pz-agenda-meta">
                        <span className="t2">{t.wer}</span>·<MapPin aria-hidden />{t.ort}
                      </div>
                    </div>
                    <span style={{ paddingTop: 2 }}><Avs leute={t.team} team={TEAM} /></span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="h-umsatz">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-umsatz">Umsatz je Monat</h2>
                <span className="pz-count">rollierend 12 Monate</span>
                <span className="pz-sec-act"><a href="#" className="pz-link">Bericht <ChevronRight aria-hidden /></a></span>
              </div>
              <div className="pz-chart-head">
                <span className="pz-chart-big">2,30 Mio. €</span>
                <span className="pz-delta" data-trend="auf"><ArrowUpRight aria-hidden />+11,4 %</span>
                <span className="meta">gegenüber Vorjahr · November als Prognose</span>
              </div>
              <UmsatzChart />
            </section>

            <section aria-labelledby="h-akt">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-akt">Zuletzt im Haus</h2>
                <span className="pz-sec-act"><a href="#" className="pz-link">Alle Aktivitäten <ChevronRight aria-hidden /></a></span>
              </div>
              <div className="pz-feed">
                {AKTIVITAET.slice(0, 3).map((a, i) => (
                  <div key={i} className="pz-feed-row">
                    <Av kurz={a.wer} ton={TEAM[a.wer].ton} title={TEAM[a.wer].name} />
                    <span className="pz-feed-text"><b>{TEAM[a.wer].name.split(" ")[0]}</b> {a.text} · <b>{a.bezug}</b></span>
                    <span className="pz-feed-time">{a.zeit}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="pz-stack">
            <section aria-labelledby="h-auf">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-auf">Braucht dich</h2>
                <span className="pz-count">{AUFGABEN.length}</span>
                <span className="pz-sec-act"><button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Aufgabe hinzufügen"><Plus /></button></span>
              </div>
              <div className="pz-list">
                {AUFGABEN.map((a) => (
                  <div key={a.ref} className="pz-li">
                    <span className="pz-check" role="checkbox" aria-checked="false" aria-label={`${a.titel} erledigen`} tabIndex={0} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pz-li-title">{a.titel}</div>
                      <div className="pz-li-sub">{a.wer}{a.betrag ? ` · ${a.betrag}` : ""} · <span className="pz-id">{a.ref}</span></div>
                    </div>
                    <span className="pz-due" data-dringend={a.dringend ? "" : undefined}>{a.faellig}</span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="h-pipe">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-pipe">Pipeline</h2>
                <span className="pz-count num">{pipeSumme.toLocaleString("de-DE")} Tsd. € offen</span>
              </div>
              <div className="pz-pipe-bar" role="img" aria-label="Pipeline-Wert je Stufe">
                {PIPELINE.map((p, i) => <span key={p.stufe} style={{ flex: p.wert, background: PIPE_TON[i], animationDelay: `${i * 60}ms` }} />)}
              </div>
              <div className="pz-pipe-rows">
                {PIPELINE.map((p, i) => (
                  <div key={p.stufe}>
                    <small><i style={{ background: PIPE_TON[i] }} />{p.stufe}</small>
                    <b>{p.wert} Tsd. €</b>
                    <span>{p.anzahl} Vorgänge</span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="h-lief">
              <div className="pz-sec-head">
                <h2 className="pz-h2" id="h-lief">Lieferung & Montage</h2>
                <span className="pz-count">diese Woche</span>
                <span className="pz-sec-act"><a href="#" className="pz-link">Tourenplan <ChevronRight aria-hidden /></a></span>
              </div>
              <div className="pz-deliv">
                {LIEFERUNGEN.map((l) => (
                  <div key={l.titel} className="pz-deliv-row">
                    <span className="pz-cal"><small>{l.tag}</small><b>{l.datum}</b></span>
                    <div style={{ minWidth: 0 }}>
                      <div className="pz-li-title">{l.titel}</div>
                      <div className="pz-li-sub">{l.wer} · {l.ort}</div>
                    </div>
                    <span className="pz-stat"><span className="pz-dot" data-ton={LIEFER_TON[l.status]} />{l.status}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </Shell>
  );
}
