import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import Shell from "./Shell";
import { Av, Bild, Ico, Status } from "./ui";
import { AKTIVITAET, BESUCHE, BRAUCHT_DICH, HEUTE, ICH, PIPELINE, PROJEKTE, UMSATZ, euro } from "./daten";

const MAT = { leder: "var(--st-leder-dot)", eiche: "var(--st-eiche-dot)", salbei: "var(--st-salbei-dot)", see: "var(--st-see-dot)" };

function Umsatzbalken() {
  const SKALA = 300; // Tsd. €, Gitter bei 100 und 200
  const maxV = Math.max(...UMSATZ.map((d) => d.v));
  return (
    <figure className="sr-chart" aria-label="Umsatz je Monat der letzten 12 Monate im Vergleich zum Vorjahr">
      <div className="sr-chart__plot">
        <div className="sr-chart__grid" aria-hidden="true">
          {[200, 100].map((g) => (
            <span key={g} style={{ bottom: `${(g / SKALA) * 100}%` }}><em>{g}</em></span>
          ))}
          <span className="base" style={{ bottom: 0 }}><em>0</em></span>
        </div>
        <div className="sr-bars">
          {UMSATZ.map((d) => (
            <div className={`sr-bar${d.laufend ? " sr-bar--now" : ""}`} key={d.m} tabIndex={0} aria-label={`${d.m}: ${d.v} Tsd. €, Vorjahr ${d.p} Tsd. €${d.laufend ? ", Monat läuft" : ""}`}>
              <span className="sr-bar__prev" style={{ height: `${(d.p / SKALA) * 100}%` }} />
              <span className="sr-bar__cur" style={{ height: `${(d.v / SKALA) * 100}%` }}>
                {d.v === maxV && <span className="sr-bar__peak">{d.v}</span>}
              </span>
              <span className="sr-bar__tip">{d.m}: {d.v} Tsd. € · Vorjahr {d.p}{d.laufend ? " · läuft" : ""}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sr-bars__lbls" aria-hidden="true">
        {UMSATZ.map((d) => <span key={d.m} className={d.laufend ? "now" : ""}>{d.m}</span>)}
      </div>
      <figcaption className="sr-legend">
        <span><i className="cur" />2025/26</span>
        <span><i className="prev" />Vorjahr</span>
        <span className="sr-legend__unit">Tsd. € netto</span>
      </figcaption>
    </figure>
  );
}

function Sparkline({ werte }) {
  const w = 240, h = 48, min = Math.min(...werte) - 4, max = Math.max(...werte) + 2;
  const pts = werte.map((v, i) => [(i / (werte.length - 1)) * w, h - ((v - min) / (max - min)) * h]);
  const d = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const [x0, y0] = pts[i - 1], cx = (x0 + p[0]) / 2;
    return `C${cx},${y0} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="sr-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Showroom-Besuche der letzten 8 Wochen, steigend">
      <defs>
        <linearGradient id="sr-sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--viz-1)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--viz-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="a" d={`${d} L${w},${h} L0,${h} Z`} />
      <path className="l" d={d} vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Zentrale() {
  const pipeSumme = PIPELINE.reduce((s, p) => s + p.wert, 0);
  return (
    <Shell crumbs={["Zentrale"]}>
      <div className="sr-enter">
        <section className="sr-hello">
          <div className="sr-hello__date"><CalendarDays aria-hidden="true" />Mittwoch, 4. November · KW 45</div>
          <div className="sr-hello__row">
            <h1 className="sr-display sr-h1">Guten Morgen, {ICH.vorname}.</h1>
            <div className="sr-hello__actions">
              <button type="button" className="sr-btn sr-btn--soft"><CalendarDays aria-hidden="true" /><span className="sr-btn-label">Termin</span></button>
              <button type="button" className="sr-btn sr-btn--ink"><Plus aria-hidden="true" /><span className="sr-btn-label">Neue Anfrage</span></button>
            </div>
          </div>
          <p className="sr-hello__brief">
            Heute hast du <strong>4 Termine</strong>. Die Seeterrasse im <strong>Hotel Uferlicht</strong> wird um 14 Uhr geliefert,
            und <strong>2 neue Anfragen</strong> warten auf eine erste Antwort.
          </p>
        </section>

        <div className="sr-grid">
          <section className="sr-span-7 sr-col-flex" aria-labelledby="h-heute">
            <div className="sr-section-head">
              <h2 id="h-heute" className="sr-title">Dein Tag</h2>
              <span className="sr-meta">4 Termine · 5 Std. 45 Min.</span>
              <a className="sr-section-head__link" href="#kalender">Kalender <ArrowRight aria-hidden="true" /></a>
            </div>
            <div className="sr-sheet sr-day">
              {HEUTE.map((t) => (
                <a key={t.zeit} href="#termin" className={`sr-day__item${t.jetzt ? " sr-day__item--now" : ""}${t.vorbei ? " sr-day__item--past" : ""}`}>
                  <div className="sr-day__when">
                    <div className="sr-day__time">{t.zeit}</div>
                    <div className="sr-day__dur">{t.dauer}</div>
                  </div>
                  <Bild src={t.bild} className="sr-day__thumb" sizes="80px" />
                  <div className="sr-day__body">
                    {t.jetzt && <div className="sr-now">Jetzt · noch 32 Min.</div>}
                    <div className="sr-day__title">{t.titel}</div>
                    <div className="sr-day__desc"><MapPin aria-hidden="true" />{t.ort}</div>
                  </div>
                  <Status m={t.m}>{t.art}</Status>
                </a>
              ))}
            </div>
          </section>

          <section className="sr-span-5 sr-col-flex" aria-labelledby="h-dich">
            <div className="sr-section-head">
              <h2 id="h-dich" className="sr-title">Wartet auf dich</h2>
              <span className="sr-meta">4 von 12</span>
            </div>
            <div className="sr-sheet sr-todo">
              {BRAUCHT_DICH.map((t) => (
                <div key={t.t} className="sr-todo__item">
                  <span className="sr-todo__icon" data-m={t.m}><Ico name={t.icon} /></span>
                  <span className="sr-todo__txt">
                    <span className="sr-todo__t">{t.t}</span>
                    <span className="sr-todo__d">{t.d}</span>
                  </span>
                  <button type="button" className="sr-btn sr-btn--ghost sr-btn--act">{t.cta}</button>
                </div>
              ))}
              <a href="#aufgaben" className="sr-todo__foot">Alle 12 Aufgaben <ArrowRight aria-hidden="true" /></a>
            </div>
          </section>
        </div>

        <section className="sr-grid sr-kpis" aria-label="Kennzahlen">
          <div className="sr-span-7 sr-kpi sr-kpi--lead">
            <div className="sr-kpi__label">Umsatz November</div>
            <div className="sr-kpi__value"><span className="sr-display num">96.400 €</span><span className="sr-trend sr-trend--up"><TrendingUp aria-hidden="true" />+10,8 %</span></div>
            <div className="sr-kpi__ctx">Nach 4 von 21 Verkaufstagen. Vorjahr zum selben Tag: 87.000 €.</div>
            <Umsatzbalken />
          </div>
          <div className="sr-span-5 sr-kpi-stack">
            <div className="sr-kpi">
              <div className="sr-kpi__label">Offene Angebote</div>
              <div className="sr-kpi__value"><span className="sr-display num">1,24 Mio. €</span><small>23 Angebote</small></div>
              <div className="sr-kpi__ctx">Davon 5 seit über 14 Tagen ohne Rückmeldung.</div>
              <div className="sr-meter" role="img" aria-label="Verteilung der offenen Angebote nach Bereich">
                {PIPELINE.map((p) => <span key={p.name} style={{ width: `${(p.wert / pipeSumme) * 100}%`, background: MAT[p.m] }} />)}
              </div>
              <div className="sr-meter-legend">
                {PIPELINE.map((p) => (
                  <div key={p.name}><i style={{ background: MAT[p.m] }} />{p.name}<b className="num">{p.wert} Tsd. €</b></div>
                ))}
              </div>
            </div>
            <div className="sr-kpi">
              <div className="sr-kpi__label">Showroom-Besuche</div>
              <div className="sr-kpi__split">
                <div>
                  <div className="sr-kpi__value"><span className="sr-display num">41</span><span className="sr-trend sr-trend--up"><ArrowUpRight aria-hidden="true" />+24 %</span></div>
                  <div className="sr-kpi__ctx">Diese Woche. 9 mit Termin, 6 wurden zu Anfragen.</div>
                </div>
                <div className="sr-kpi__sparkbox">
                  <Sparkline werte={BESUCHE} />
                  <div className="sr-legend sr-legend--ends"><span>KW 38</span><span>KW 45</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sr-block" aria-labelledby="h-proj">
          <div className="sr-section-head">
            <h2 id="h-proj" className="sr-title">Deine Projekte</h2>
            <span className="sr-meta">4 von 23 laufenden</span>
            <a className="sr-section-head__link" href="#projekte">Alle Projekte <ArrowRight aria-hidden="true" /></a>
          </div>
          <div className="sr-grid">
            {PROJEKTE.map((p) => (
              <Link href="/entwurf/showroom/kundenakte" key={p.name} className="sr-span-3 sr-proj">
                <span className="sr-proj__media">
                  <Bild src={p.bild} sizes="(max-width: 1279px) 25vw, 270px" className="sr-fill" />
                  <span className="sr-proj__phase">{p.phase}</span>
                </span>
                <span className="sr-proj__body">
                  <span className="sr-proj__name">{p.name}</span>
                  <span className="sr-proj__meta">{p.kunde}</span>
                  <span className="sr-proj__foot">
                    <span className="sr-avstack">{p.team.map((k) => <Av key={k} kurz={k} size={26} ring />)}</span>
                    <span className="sr-proj__sum num">{euro(p.summe)}</span>
                  </span>
                  <span className="sr-steps" aria-label={`Phase ${p.stufe} von 5`}>
                    {[1, 2, 3, 4, 5].map((s) => <span key={s} className={s <= p.stufe ? "on" : ""} />)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="sr-grid sr-block">
          <section className="sr-span-7 sr-col-flex" aria-labelledby="h-akt">
            <div className="sr-section-head">
              <h2 id="h-akt" className="sr-title">Aktivität im Team</h2>
              <a className="sr-section-head__link" href="#protokoll">Protokoll <ArrowRight aria-hidden="true" /></a>
            </div>
            <div className="sr-sheet sr-feed">
              {AKTIVITAET.map((g) => (
                <div key={g.tag} className="sr-feed__group">
                  <div className="sr-feed__day">{g.tag}</div>
                  {g.items.map((it, i) => (
                    <div className="sr-feed__item" key={i}>
                      <Av kurz={it.wer} size={28} />
                      <div className="sr-feed__main">
                        <div className="sr-feed__txt">{it.txt}</div>
                        {it.zitat && <div className="sr-feed__quote">{it.zitat}</div>}
                      </div>
                      <span className="sr-feed__time num">{it.zeit}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <section className="sr-span-5 sr-col-flex" aria-labelledby="h-insp">
            <div className="sr-section-head">
              <h2 id="h-insp" className="sr-title">Im Showroom diese Woche</h2>
            </div>
            <article className="sr-sheet sr-insp">
              <span className="sr-insp__media"><Bild src="vase.jpg" sizes="460px" className="sr-fill" /></span>
              <div className="sr-insp__body">
                <div className="sr-meta sr-insp__kicker"><Sparkles aria-hidden="true" />Neu ausgestellt · Wohnwelt, Insel 3</div>
                <h3 className="sr-display sr-h3">Travertin, handgedreht</h3>
                <p className="sr-insp__txt">
                  Die Vasen der Platzhirsch Edition stehen jetzt an der Kamin-Lounge. Drei Kundinnen haben nach ihnen gefragt,
                  ein guter Anlass für einen Nachfass bei offenen Wohn-Angeboten.
                </p>
                <div className="sr-insp__foot">
                  <span className="sr-meta sr-insp__match"><Users aria-hidden="true" />5 passende Kunden</span>
                  <button type="button" className="sr-btn sr-btn--soft sr-btn--sm">Nachfass vorbereiten</button>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </Shell>
  );
}
