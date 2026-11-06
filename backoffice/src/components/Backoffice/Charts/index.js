// Leichte Diagramme ohne Bibliothek im Lounge-Stil (lounge.md §3 „Diagramm“, §8), Server-tauglich
// (kein Client-JS, 03 §8.15). Eine Reihe = eine Farbe (Tinte); mit `hervorheben` steht der
// Bezugszeitraum in Tinte und der Rest in 16 % Tinte, der laufende Zeitraum (`laufend`) schraffiert.
// Balken mit runder Kappe (10/4 px), Linie 2 px mit weichem Flächenverlauf, Donut als dünner Ring;
// kein Doppelachsen-Diagramm. Jedes Diagramm sitzt standardmäßig in einer Kachel (Radius 28,
// Schatten, Titel 17/600 + Unterzeile 13); `kachel={false}` bettet es in eine vorhandene Kachel ein.
// Aufbau: Marken skalieren mit der Breite, alle Beschriftungen sind HTML-Text in festen Größen
// (12 px, Tabellenziffern) – nie verzerrter SVG-Text. Schmale Container (< 24 rem) zeigen nur jede
// zweite Achsenbeschriftung. Farben nur über Token (--color-chart-*, Status-Rollen).
// Zugänglich: role="img" mit Klartext, Tooltip-Pille je Balken bei Hover, Tabelle als <details>.
// Bewegung nur mit `einblenden` (Balken wachsen mit Feder aus der Grundlinie, Linie deckt auf).
//
// `format` ist eine Funktion (nur aus Server-Komponenten) ODER ein Formatname
// ("zahl" | "dezimal" | "cent" | "cent-rund" | "prozent") – der Name ist serialisierbar
// und funktioniert auch aus Client-Komponenten.

import cx from "../cx";
import { balkenGeometrie, beschriftete, donutSegmente, formatiere, linienPunkte, pfad, prozentText, sparkPunkte } from "./logik";

export const TEXTE = {
  keineDaten: "Noch keine Daten im Zeitraum.",
  tabelle: "Werte als Tabelle",
  zeitraum: "Zeitraum",
  wert: "Wert",
  anteil: "Anteil",
  gesamt: "Gesamt",
  laedt: "Diagramm wird geladen",
};

/** Serienfarben (Token). Reihenfolge fest: Tinte, Cognac, See, Eiche, Salbei. */
export const SERIEN = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
export const SEQUENZ = ["var(--color-chart-seq-1)", "var(--color-chart-seq-2)", "var(--color-chart-seq-3)", "var(--color-chart-seq-4)", "var(--color-chart-seq-5)"];
export const FARBEN = {
  tinte: SERIEN[0],
  cognac: SERIEN[1],
  see: SERIEN[2],
  eiche: SERIEN[3],
  salbei: SERIEN[4],
  weich: "var(--color-chart-soft)",
  // Namen aus v1 (Aufrufer bleiben gültig)
  sand: SERIEN[1],
  messing: SERIEN[3],
  grau: "var(--color-bo-text-faint)",
  gruen: "var(--color-bo-success)",
  orange: "var(--color-bo-warning)",
  rot: "var(--color-chart-negativ)",
  blau: "var(--color-bo-info)",
};

function formatFn(format) {
  if (typeof format === "function") return format;
  return (v) => formatiere(v, typeof format === "string" ? format : "zahl");
}

/** Stabile, kurze ID aus Text (für SVG-Verläufe ohne Hook, Server-tauglich). */
function kennung(text) {
  let h = 0;
  for (const z of String(text)) h = (h * 31 + z.codePointAt(0)) >>> 0;
  return `bo-v${h.toString(36)}`;
}

function Tabelle({ titel, zeilen, kopf }) {
  return (
    <details className="group/tab mt-4 text-[13px] text-bo-text-soft">
      <summary className="-ml-2.5 inline-flex min-h-7 cursor-pointer select-none items-center gap-1.5 rounded-pill px-2.5 transition-colors duration-200 hover:bg-bo-fill hover:text-bo-text [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300 group-open/tab:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 4 4 4-4 4" />
        </svg>
        {TEXTE.tabelle}
      </summary>
      <div className="mt-2 overflow-x-auto rounded-bo-zeile bg-bo-surface-2 px-3 py-1.5">
        <table className="w-full text-left">
          <caption className="sr-only">{titel}</caption>
          <thead>
            <tr>
              {kopf.map((k, i) => (
                <th key={k} scope="col" className={cx("py-1.5 text-xs font-medium", i > 0 && "text-right")}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z[0]} className="shadow-[inset_0_var(--bo-hair)_0_var(--color-bo-line)]">
                {z.map((zelle, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-1.5 font-normal">
                      {zelle}
                    </th>
                  ) : (
                    <td key={i} className="py-1.5 text-right tabular-nums text-bo-text">
                      {zelle}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Rahmen eines Diagramms: Kachel (Lounge), Titel 17/600, Unterzeile 13, optional Legende/Aktion. */
function Rahmen({ titel, untertitel, legende, aktion, children, className, einblenden, testid, kachel = true }) {
  return (
    <figure className={cx("m-0 min-w-0", kachel && "bo-kachel", einblenden && "bo-chart-ein", className)} data-testid={testid}>
      <figcaption className="mb-5 flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold leading-6 tracking-[-0.012em]">{titel}</span>
          {untertitel && <span className="mt-0.5 block text-[13px] leading-[18px] text-bo-text-soft">{untertitel}</span>}
        </span>
        {(legende || aktion) && (
          <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            {legende?.map((l) => (
              <span key={l.name} className="inline-flex items-center gap-2 text-[13px] text-bo-text-soft">
                <span aria-hidden="true" className={cx("inline-block size-2 rounded-pill", l.gestrichelt && "h-0 w-3.5 rounded-none border-t-2 border-dashed bg-transparent")} style={l.gestrichelt ? { borderColor: l.farbe } : { background: l.farbe }} />
                {l.name}
              </span>
            ))}
            {aktion}
          </span>
        )}
      </figcaption>
      {children}
    </figure>
  );
}

/** Leerer Zustand: ruhige Platzhalter-Balken auf der Grundlinie + Satz. */
export function KeineDaten({ titel, untertitel, text = TEXTE.keineDaten, hoehe = 160, className, testid, kachel = true }) {
  return (
    <Rahmen titel={titel} untertitel={untertitel} className={className} testid={testid} kachel={kachel}>
      <div className="relative flex items-end justify-center gap-[6%] px-[12%]" style={{ height: hoehe }}>
        {[38, 62, 46, 74, 54].map((h, i) => (
          <span key={i} aria-hidden="true" className="block max-w-9 flex-1 rounded-t-[10px] rounded-b-[4px] bg-bo-fill" style={{ height: `${h}%` }} />
        ))}
        <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-bo-text-soft">
          <span className="rounded-pill bg-bo-surface px-3.5 py-1.5 shadow-(--bo-sh-btn)">{text}</span>
        </span>
      </div>
    </Rahmen>
  );
}

/** Lade-Skeleton in Zielform (5 Balken). Für loading.js / Suspense-Fallback. */
export function ChartSkeleton({ titel, hoehe = 160, className, kachel = true }) {
  const hoehen = [44, 68, 52, 80, 60];
  return (
    <div className={cx("min-w-0", kachel && "bo-kachel", className)} aria-busy="true">
      <span role="status" className="sr-only">
        {titel ? `${titel}: ` : ""}
        {TEXTE.laedt}
      </span>
      <span aria-hidden="true" className="bo-skeleton block h-4 w-32" />
      <span aria-hidden="true" className="bo-skeleton mt-2 block h-3 w-24" />
      <div aria-hidden="true" className="mt-5 flex items-end gap-[6%] px-[3%]" style={{ height: hoehe }}>
        {hoehen.map((h, i) => (
          <span key={i} className="bo-skeleton block max-w-9 flex-1 rounded-t-[10px] rounded-b-[4px]" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Achsenbeschriftung unten: gleich breite Spalten, schmale Container zeigen jede zweite. */
function XAchse({ punkte, markiert = -1, className }) {
  return (
    <div className={cx("mt-2.5 flex text-xs leading-4 text-bo-text-soft", className)} aria-hidden="true">
      {punkte.map((p, i) => (
        <span key={p.label} className={cx("relative h-4 min-w-0 flex-1", i % 2 === 1 && i !== punkte.length - 1 && i !== markiert && "@max-sm:invisible")}>
          {/* Beschriftung darf über die schmale Spalte hinausragen (Nachbar ist dann ausgeblendet), bleibt mittig. */}
          <span className={cx("absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap tabular-nums", i === markiert && "font-semibold text-bo-text")}>{p.label}</span>
        </span>
      ))}
    </div>
  );
}

function Raster({ linien, nutzbar, unten = 0 }) {
  return linien.map((f) => (
    <span key={f} aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[color:var(--color-chart-grid)]" style={{ bottom: `${unten + f * nutzbar}%` }} />
  ));
}

/** Runde Kappe 10 px (Grundlinie 4 px), bei niedrigen Balken höchstens halbe Höhe – keine „Tropfen“. */
function kappe(g, hoehe) {
  const px = (g.hoehe / 100) * hoehe;
  const oben = Math.max(1, Math.min(10, px / 2));
  const unten = Math.max(1, Math.min(4, px / 2));
  return g.negativ ? `${unten}px ${unten}px ${oben}px ${oben}px` : `${oben}px ${oben}px ${unten}px ${unten}px`;
}

function indexAus(wert, n) {
  if (wert === "letzter") return n - 1;
  return typeof wert === "number" && wert >= 0 && wert < n ? wert : -1;
}

/**
 * Balken (eine Serie). punkte: [{label, wert}], format: Funktion oder Formatname.
 * `hervorheben`: "letzter" | Index | null – Bezugszeitraum in `farbe` (Tinte), Rest 16 % Tinte.
 * `laufend`: "letzter" | Index | null – noch nicht abgeschlossener Zeitraum, schraffiert.
 * Ohne Hervorhebung stehen alle Balken in `farbe`. Negative Werte hängen unter der Nulllinie
 * in `negativ`. Höhe der Zeichenfläche: `hoehe` px.
 */
export function Balken({ titel, untertitel, punkte = [], format = "zahl", farbe = FARBEN.tinte, hervorheben = null, laufend = null, hoehe = 160, einblenden = false, legende, aktion, className, testid, kachel = true }) {
  if (!punkte.length) return <KeineDaten titel={titel} untertitel={untertitel} hoehe={hoehe} className={className} testid={testid} kachel={kachel} />;
  const fmt = formatFn(format);
  const werte = punkte.map((p) => p.wert);
  const geo = balkenGeometrie(werte);
  const markiert = indexAus(hervorheben, punkte.length);
  const offen = indexAus(laufend, punkte.length);
  const mitWert = markiert >= 0 ? new Set([markiert]) : beschriftete(werte);
  const nullLinie = geo.length ? Math.min(...geo.map((g) => (g.negativ ? g.unten + g.hoehe : g.unten))) : 0;
  const stagger = punkte.length <= 12;
  return (
    <Rahmen titel={titel} untertitel={untertitel} legende={legende} aktion={aktion} className={className} einblenden={einblenden} testid={testid} kachel={kachel}>
      <div className="@container" role="img" aria-label={`${titel}: ${punkte.map((p) => `${p.label} ${fmt(p.wert)}`).join(", ")}`}>
        <div className="relative flex gap-[6%] px-[3%]" style={{ height: hoehe }}>
          {nullLinie > 0 && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-[color:var(--color-chart-axis)]" style={{ bottom: `${nullLinie}%` }} />}
          {punkte.map((p, i) => {
            const g = geo[i];
            const weich = markiert >= 0 && i !== markiert && !g.negativ;
            const f = g.negativ ? FARBEN.rot : weich ? FARBEN.weich : farbe;
            const beschriftet = mitWert.has(i);
            return (
              <div key={p.label} className="bo-chart-spalte relative h-full min-w-0 flex-1">
                <span
                  className={cx(
                    "bo-chart-balken absolute inset-x-0 mx-auto block w-full max-w-9",
                    g.negativ ? "origin-top" : "origin-bottom",
                    i === offen && !g.negativ && "bo-chart-laufend"
                  )}
                  data-weich={weich ? "" : undefined}
                  style={{ bottom: `${g.unten}%`, height: `${g.hoehe}%`, background: f, borderRadius: kappe(g, hoehe), "--i": stagger ? i : 0 }}
                />
                {beschriftet ? (
                  <span
                    className={cx("bo-chart-wert absolute inset-x-0 whitespace-nowrap text-center text-xs leading-4 tabular-nums", i === markiert ? "font-semibold text-bo-text" : "font-medium text-bo-text-soft", mitWert.size > 2 && i !== markiert && i !== punkte.length - 1 && "@max-sm:invisible")}
                    style={{ bottom: `calc(${g.unten + g.hoehe}% + 0.375rem)` }}
                  >
                    {fmt(p.wert)}
                  </span>
                ) : (
                  <span aria-hidden="true" className="bo-chart-tip" style={{ bottom: `calc(${g.unten + g.hoehe}% + 0.5rem)` }}>
                    {fmt(p.wert)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <XAchse punkte={punkte} markiert={markiert} className="gap-[6%] px-[3%]" />
      </div>
      <Tabelle titel={titel} kopf={[TEXTE.zeitraum, TEXTE.wert]} zeilen={punkte.map((p) => [p.label, fmt(p.wert)])} />
    </Rahmen>
  );
}

/**
 * Linie mit Punkten (≤ 12 Werte), Raster und Wertmarken am Maximum und am Ende.
 * Standard in Tinte (eine Reihe = eine Farbe), Fläche als weicher Verlauf.
 * `vergleich`: zweite Serie (z. B. Vorjahr) gestrichelt und gedämpft, gleiche Labels.
 * `name` / `vergleichName` erscheinen in der Legende (nur mit Vergleich).
 */
export function Linie({ titel, untertitel, punkte = [], vergleich, name = "Aktuell", vergleichName = "Vergleich", format = "zahl", farbe = FARBEN.tinte, flaeche = true, hoehe = 160, einblenden = false, aktion, className, testid, kachel = true }) {
  if (!punkte.length) return <KeineDaten titel={titel} untertitel={untertitel} hoehe={hoehe} className={className} testid={testid} kachel={kachel} />;
  const fmt = formatFn(format);
  const n = punkte.length;
  const vWerte = vergleich?.length === n ? vergleich.map((p) => p.wert) : null;
  const max = Math.max(1, ...punkte.map((p) => Number(p.wert) || 0), ...(vWerte || []).map((w) => Number(w) || 0));
  const pts = linienPunkte(punkte.map((p) => p.wert), max);
  const vPts = vWerte ? linienPunkte(vWerte, max) : null;
  const maxIndex = punkte.findIndex((p) => Number(p.wert) === Math.max(...punkte.map((q) => Number(q.wert) || 0)));
  const mitPunkten = n <= 12;
  const verlaufId = kennung(`${titel}|${n}|${punkte[0]?.label}`);
  const legende = vPts
    ? [
        { name, farbe },
        { name: vergleichName, farbe: FARBEN.grau, gestrichelt: true },
      ]
    : undefined;
  const klartext = punkte.map((p, i) => `${p.label} ${fmt(p.wert)}${vWerte ? ` (${vergleichName} ${fmt(vWerte[i])})` : ""}`).join(", ");
  return (
    <Rahmen titel={titel} untertitel={untertitel} legende={legende} aktion={aktion} className={className} einblenden={einblenden} testid={testid} kachel={kachel}>
      <div className="@container" role="img" aria-label={`${titel}: ${klartext}`}>
        <div className="relative" style={{ height: hoehe }}>
          <Raster linien={[0.5, 1]} nutzbar={78} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-[color:var(--color-chart-axis)]" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="bo-chart-linie absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={verlaufId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={farbe} stopOpacity="0.14" />
                <stop offset="100%" stopColor={farbe} stopOpacity="0" />
              </linearGradient>
            </defs>
            {vPts && <path d={pfad(vPts)} fill="none" stroke={FARBEN.grau} strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />}
            {flaeche && <path d={pfad(pts, true)} fill={`url(#${verlaufId})`} />}
            <path d={pfad(pts)} fill="none" stroke={farbe} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          {punkte.map((p, i) => {
            const beschriften = i === n - 1 || i === maxIndex;
            if (!mitPunkten && !beschriften) return null;
            return (
              <div key={p.label} className="bo-chart-punkt absolute" style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }} title={`${p.label}: ${fmt(p.wert)}`}>
                <span className={cx("absolute block rounded-pill ring-2 ring-bo-surface", beschriften ? "-left-[5px] -top-[5px] size-2.5" : "-left-[3px] -top-[3px] size-1.5")} style={{ background: farbe }} />
                {beschriften && (
                  <span className={cx("absolute bottom-2.5 whitespace-nowrap rounded-pill px-2 py-0.5 text-xs font-semibold leading-4 tabular-nums", i === n - 1 ? "right-0 bg-bo-action text-bo-action-text" : "bg-bo-surface/90 text-bo-text", i !== n - 1 && (i === 0 ? "left-0" : "-translate-x-1/2"))}>
                    {fmt(p.wert)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <XAchse punkte={punkte} />
      </div>
      <Tabelle
        titel={titel}
        kopf={vWerte ? [TEXTE.zeitraum, name, vergleichName] : [TEXTE.zeitraum, TEXTE.wert]}
        zeilen={punkte.map((p, i) => (vWerte ? [p.label, fmt(p.wert), fmt(vWerte[i])] : [p.label, fmt(p.wert)]))}
      />
    </Rahmen>
  );
}

/**
 * Donut für wenige Anteile (≤ 5, mehr → „Weitere“), dünner Ring, 2 % Lücke, Mitte Gesamtwert,
 * Legende mit Wert und Prozent – Identität nie nur über Farbe. `farben`: "serien" | "sequenz".
 */
export function Donut({ titel, untertitel, teile = [], format = "zahl", mitte, farben = "serien", einblenden = false, className, testid, kachel = true }) {
  const fmt = formatFn(format);
  const { summe, segmente } = donutSegmente(teile);
  if (!segmente.length || summe <= 0) return <KeineDaten titel={titel} untertitel={untertitel} hoehe={112} className={className} testid={testid} kachel={kachel} />;
  const palette = farben === "sequenz" ? [...SEQUENZ].reverse() : SERIEN;
  const r = 15.9155;
  return (
    <Rahmen titel={titel} untertitel={untertitel} className={className} einblenden={einblenden} testid={testid} kachel={kachel}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-4">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 42 42" className="size-full -rotate-90" role="img" aria-label={`${titel}: ${segmente.map((s) => `${s.label} ${fmt(s.wert)} (${prozentText(s.anteil)})`).join(", ")}`}>
            <circle cx="21" cy="21" r={r} fill="none" stroke="var(--color-bo-fill-2)" strokeWidth="3.6" />
            {segmente.map((s) =>
              s.strich > 0 ? (
                <circle
                  key={s.label}
                  className="bo-chart-segment"
                  cx="21"
                  cy="21"
                  r={r}
                  fill="none"
                  stroke={palette[s.index % palette.length]}
                  strokeWidth="3.6"
                  strokeDasharray={`${s.strich} ${100 - s.strich}`}
                  strokeDashoffset={-s.start}
                  style={{ "--start": s.start }}
                >
                  <title>{`${s.label}: ${fmt(s.wert)} (${prozentText(s.anteil)})`}</title>
                </circle>
              ) : null
            )}
          </svg>
          <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[22px] font-normal leading-7 tracking-[-0.02em] tabular-nums">{mitte ?? fmt(summe)}</span>
            <span className="text-xs text-bo-text-soft">{TEXTE.gesamt}</span>
          </span>
        </div>
        <ul className="min-w-[10rem] flex-1 space-y-2 text-sm">
          {segmente.map((s) => (
            <li key={s.label} className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-pill" style={{ background: palette[s.index % palette.length] }} />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              <span className="tabular-nums font-medium text-bo-text">{fmt(s.wert)}</span>
              <span className="w-12 text-right text-xs tabular-nums text-bo-text-soft">{prozentText(s.anteil)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Tabelle titel={titel} kopf={[titel, TEXTE.wert, TEXTE.anteil]} zeilen={segmente.map((s) => [s.label, fmt(s.wert), prozentText(s.anteil)])} />
    </Rahmen>
  );
}

/** Sparkline ohne Achsen (für Kennzahlkacheln). Feste Pixelgröße, Endpunkt 3 px, keine Verzerrung. */
export function Sparkline({ werte = [], farbe = "var(--color-bo-text-soft)", breite = 64, hoehe = 20, label = "Verlauf", einblenden = false }) {
  if (werte.length < 2) return null;
  const pts = sparkPunkte(werte, breite, hoehe);
  const letzter = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${breite} ${hoehe}`} width={breite} height={hoehe} role="img" aria-label={`${label}: ${werte.join(", ")}`} className={cx("bo-sparkline shrink-0 overflow-visible", einblenden && "bo-chart-ein")}>
      <polyline points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke={farbe} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={letzter.x} cy={letzter.y} r="2" fill={farbe} />
    </svg>
  );
}

/** Zahlkarte mit Trend (Pfeil + Text) und optionaler Sparkline. Für neue Seiten `Kennzahl` nehmen. */
export function Zahlkarte({ titel, wert, einheit, trend, verlauf, className }) {
  return (
    <div className={cx("bo-kachel bo-kachel--dicht min-w-0", className)}>
      <p className="text-[13px] font-medium text-bo-text-soft">{titel}</p>
      <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
        <p className="min-w-0 truncate text-[28px] font-normal leading-8 tracking-[-0.03em] tabular-nums">
          {wert ?? "–"}
          {einheit && <span className="ml-1 text-[17px] text-bo-text-soft">{einheit}</span>}
        </p>
        {verlauf && <Sparkline werte={verlauf} label={`${titel} Verlauf`} />}
      </div>
      {trend && (
        <p className={cx("mt-1.5 text-[13px]", trend.richtung === "auf" ? "text-bo-success-text" : trend.richtung === "ab" ? "text-bo-danger-text" : "text-bo-text-soft")}>
          {trend.richtung === "auf" ? "▲" : trend.richtung === "ab" ? "▼" : "•"} {trend.text}
        </p>
      )}
    </div>
  );
}
