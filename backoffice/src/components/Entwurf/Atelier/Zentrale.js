import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Euro, Eye, Inbox } from "lucide-react";
import Shell from "./Shell";
import { Avatar, AvatarStack } from "./Avatar";
import { aktivitaet, aufgaben, eingang2025, eingang2026, heute, IMG, kennzahlen, monate, pipeline } from "./data";

// Regel: Werte in Euro = Linie, Stückzahlen = Balken. Alle 32 px hoch.
function Spark({ data, kind }) {
  const n = data.length, max = Math.max(...data), min = Math.min(...data);
  if (kind === "bars") {
    const bw = 6, gap = 3, h = 32;
    return (
      <svg className="at-spark bars" width={n * (bw + gap) - gap} height={h} viewBox={`0 0 ${n * (bw + gap) - gap} ${h}`} aria-hidden="true">
        {data.map((v, i) => {
          const bh = Math.max(3, (v / max) * h);
          return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx="1" fill={i === n - 1 ? "var(--at-accent)" : "var(--at-ink-4)"} />;
        })}
      </svg>
    );
  }
  const w = 200, h = 32, lo = kind === "line" && min > 0 ? min * 0.9 : 0;
  const pts = data.map((v, i) => [(i / (n - 1)) * w, h - 2 - ((v - lo) / (max - lo)) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <span className="at-spark line" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={`${d} L${w},${h} L0,${h} Z`} fill="var(--at-ink)" opacity="0.07" />
        <path d={d} fill="none" stroke="var(--at-ink-2)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <i style={{ left: `${(last[0] / w) * 100}%`, top: `${(last[1] / h) * 100}%` }} />
    </span>
  );
}

function Auftragseingang() {
  const W = 1000, H = 220, padL = 40, padB = 28, padT = 30, max = 300;
  const cw = (W - padL) / 12;
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const ZIEL_DEZ = 240;
  return (
    <section className="at-chart" aria-labelledby="chart-h">
      <div className="at-section-h">
        <h2 id="chart-h" className="t-h2">Auftragseingang</h2>
        <span className="t-small ink-3">je Monat in Tausend Euro, netto</span>
        <span className="at-chart-total"><b className="serif">2,14 Mio. €</b><span className="pos"><ArrowUpRight aria-hidden="true" />12 %</span><span className="ink-3">ggü. Vorjahr</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Auftragseingang je Monat 2026 im Vergleich zu 2025. Werte in der Tabelle darunter.">
        {[0, 100, 200, 300].map((g) => (
          <g key={g}>
            <line x1={padL} x2={W} y1={y(g)} y2={y(g)} stroke="var(--at-rule)" strokeWidth="1" strokeDasharray={g === 0 ? "" : "2 4"} />
            <text x={padL - 12} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--at-ink-3)" style={{ fontVariantNumeric: "tabular-nums" }}>{g}</text>
          </g>
        ))}
        {monate.map((m, i) => {
          const v = eingang2026[i], p = eingang2025[i];
          const cx = padL + cw * i + cw / 2, bw = 18;
          const isNow = i === 10, isDez = i === 11;
          return (
            <g key={m} className="col" tabIndex={0} aria-label={isDez ? `${m}: Ziel ${ZIEL_DEZ} T€` : `${m}: ${v} T€ 2026, Vorjahr ${p} T€`}>
              <rect x={cx - cw / 2} y={padT} width={cw} height={H - padT - padB} fill="transparent" />
              {v != null ? (
                <path className="bar" d={`M${cx - bw / 2},${y(0)} V${y(v) + 2} a2,2 0 0 1 2,-2 H${cx + bw / 2 - 2} a2,2 0 0 1 2,2 V${y(0)} Z`} fill={isNow ? "var(--at-accent)" : "var(--at-bar)"} />
              ) : null}
              {isDez ? (
                <>
                  <rect x={cx - bw / 2 + 0.5} y={y(ZIEL_DEZ)} width={bw - 1} height={y(0) - y(ZIEL_DEZ)} rx="2" fill="none" stroke="var(--at-ink-4)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={cx} y={y(ZIEL_DEZ) - 10} textAnchor="middle" fontSize="11.5" fill="var(--at-ink-3)">Ziel {ZIEL_DEZ}</text>
                </>
              ) : (
                <circle cx={cx} cy={y(p)} r="3.25" fill="var(--at-paper)" stroke="var(--at-ink)" strokeWidth="1.25" />
              )}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11.5" fill={isNow ? "var(--at-ink)" : "var(--at-ink-3)"} fontWeight={isNow ? 600 : 400}>{m}</text>
              {isNow ? <text x={cx} y={y(v) - 10} textAnchor="middle" fontSize="11.5" fill="var(--at-accent)" fontWeight="560">64 · laufend</text> : null}
              {!isDez ? (
                <g className="tip">
                  <rect x={cx - 62} y={-6} width="124" height="40" rx="6" fill="var(--at-ink)" />
                  <text x={cx} y={10} textAnchor="middle" fontSize="11.5" fill="var(--at-on-ink)" fontWeight="600">{m} · {v} T€</text>
                  <text x={cx} y={25} textAnchor="middle" fontSize="11" fill="var(--at-on-ink)" opacity="0.75">Vorjahr {p} T€</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="at-legend">
        <span><i style={{ background: "var(--at-bar)" }} />2026</span>
        <span><i className="ring" />2025</span>
        <span><i style={{ background: "var(--at-accent)" }} />laufender Monat</span>
        <span><i className="dash" />Ziel</span>
      </div>
      <table className="sr">
        <caption>Auftragseingang je Monat in Tausend Euro</caption>
        <thead><tr><th>Monat</th><th>2026</th><th>2025</th></tr></thead>
        <tbody>{monate.map((m, i) => <tr key={m}><td>{m}</td><td>{eingang2026[i] ?? "–"}</td><td>{eingang2025[i]}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

const PHASE = ["var(--at-ph-1)", "var(--at-ph-2)", "var(--at-ph-3)", "var(--at-ph-4)", "var(--at-ph-5)"];
const SYS = { auge: Eye, euro: Euro, post: Inbox };

export default function Zentrale() {
  const total = pipeline.reduce((s, p) => s + p.v, 0);
  return (
    <Shell active="zentrale" crumbs={["Heute"]}>
      <main className="at-page">
        <section className="at-hello">
          <div>
            <div className="date"><span>Mittwoch, 4. November</span><i aria-hidden="true" /><span>Lochau, 9 °C, Nebel über dem See</span></div>
            <h1>Guten Morgen, Lena.</h1>
            <p className="lead">
              Drei Kundentermine heute, zwei Angebote warten auf Ihre Freigabe – und{" "}
              <Link href="/entwurf/atelier/anfragen">das Seehotel Lindenhof</Link> hat vor 40 Minuten angefragt.
              Die Küche für <Link href="/entwurf/atelier/kunde">Familie Haldner</Link> ist für KW 47 bestätigt.
            </p>
          </div>
          <Link href="/entwurf/atelier/kunde" className="at-feature">
            <figure style={{ margin: 0 }}>
              <div className="img"><img src={IMG("esszimmer-see.jpg")} alt="Esszimmer mit Blick auf den See, Projekt Haus am Pfänderhang" /></div>
              <figcaption><b>Haus am Pfänderhang</b><span>Esszimmer · Teil 3, KW 47</span></figcaption>
            </figure>
          </Link>
        </section>

        <section className="at-figures" aria-label="Kennzahlen">
          {kennzahlen.map((k) => (
            <div className="at-fig" key={k.lbl}>
              <div className="lbl">{k.lbl}</div>
              <div className="val"><span className="t-display">{k.val}</span><small>{k.unit}</small></div>
              <div className="ctx">
                {k.warn ? <span className="warn">{k.delta}</span> : (
                  <span className={k.up ? "pos" : "neg"}>{k.up ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}{k.delta}</span>
                )}
                <span>{k.ctx}</span>
              </div>
              <Spark data={k.spark} kind={k.kind} />
            </div>
          ))}
        </section>

        <div className="at-grid-2">
          <section aria-labelledby="heute-h">
            <div className="at-section-h">
              <h2 id="heute-h" className="t-h2">Heute</h2>
              <span className="t-small ink-3">5 Termine · 3 mit Kunden</span>
              <Link href="#" className="at-link">Kalender <ArrowRight aria-hidden="true" /></Link>
            </div>
            <ol className="at-agenda">
              {heute.map((a, i) => a.now ? (
                <li key="now" className="nowrow" aria-label={`Jetzt, ${a.now}`}><div className="at-now"><span>{a.now}</span></div></li>
              ) : (
                <li key={i} className={a.past ? "past" : ""}>
                  <div className="time">{a.t}<small>{a.d}</small></div>
                  <i className={`bar ${a.kunde ? "k" : ""}`} aria-hidden="true" />
                  <div className="what"><b>{a.was}</b><span>{a.wo}</span></div>
                  <AvatarStack list={a.wer} />
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="warten-h">
            <div className="at-section-h side">
              <h2 id="warten-h" className="t-side">Wartet auf Sie</h2>
              <span className="n">4</span>
            </div>
            <ul className="at-tasks">
              {aufgaben.map((a) => (
                <li key={a.was}>
                  <button type="button" className="at-check" aria-label={`${a.was} erledigen`} />
                  <div><b>{a.was}</b><div className="wen">{a.wen}</div><div className="meta">{a.meta}</div></div>
                  <div className="amt">{a.amt}{a.sub ? <small>{a.sub} Rabatt</small> : null}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Auftragseingang />

        <div className="at-grid-2">
          <section aria-labelledby="pipe-h">
            <div className="at-section-h">
              <h2 id="pipe-h" className="t-h2">Vorgänge nach Phase</h2>
              <span className="t-small ink-3">57 offen · gewichtet nach Wert</span>
            </div>
            <div className="at-pipe-bar" role="img" aria-label={pipeline.map((p) => `${p.k} ${p.n}`).join(", ")}>
              {pipeline.map((p, i) => <span key={p.k} title={`${p.k}: ${p.n} Vorgänge · ${p.s}`} style={{ flex: p.v / total, background: PHASE[i] }} />)}
            </div>
            <ul className="at-pipe-legend">
              {pipeline.map((p, i) => (
                <li key={p.k}>
                  <i className="at-swatch" style={{ background: PHASE[i] }} aria-hidden="true" />
                  <span className="k">{p.k}</span>
                  <span className="v">{p.n}</span>
                  <span className="s">{p.s}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="akt-h">
            <div className="at-section-h side">
              <h2 id="akt-h" className="t-side">Im Studio</h2>
              <Link href="#" className="at-link">Alle <ArrowRight aria-hidden="true" /></Link>
            </div>
            <ul className="at-feed">
              {aktivitaet.map((a, i) => {
                const Ico = a.sys ? SYS[a.sys] : null;
                return (
                  <li key={i}>
                    {Ico ? <span className="at-avatar sys" aria-hidden="true"><Ico /></span> : <Avatar k={a.wer} />}
                    <div>
                      <p>{a.text.map((t, j) => Array.isArray(t) ? <b key={j}>{t[1]}</b> : <span key={j}>{t}</span>)}</p>
                      <time>{a.zeit}</time>
                      {a.bilder ? <div className="thumbs">{a.bilder.map((b) => <img key={b} src={IMG(b)} alt="" />)}</div> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </Shell>
  );
}
