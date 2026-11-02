// src/components/Einblicke/Vorschau.js – lokale Vorschau der Besucher-Einblicke
// (/de/preview/einblicke). Server Component; nur das Heatmap-Canvas ist ein
// Client-Baustein. Zeigt ausschließlich anonyme Aggregate (k-Schwelle wie Frappe).
// Status nie nur über Farbe (Design-Bibel §14): Werte stehen immer als Zahl.
import { Container, Eyebrow, Heading } from "@/components/ui";
import HeatmapCanvas from "./HeatmapCanvas";

const LAYER_LABEL = { klicks: "Klicks", elemente: "Element-Klicks", bewegung: "Mausbewegung", scroll: "Scrolltiefe", aufmerksamkeit: "Aufmerksamkeit" };
const linkCls = "underline decoration-line-strong underline-offset-4 hover:decoration-current";
const pct = (x) => `${Math.round(x * 100)} %`;

function Code({ children }) {
  return <code className="break-all font-mono text-small">{children}</code>;
}

function Stat({ label, value, note }) {
  return (
    <div className="border-t border-line-strong pt-4">
      <dt className="text-small text-text-soft">{label}</dt>
      <dd className="mt-1 text-title tabular-nums text-text">{value}</dd>
      {note ? <dd className="mt-1 text-small text-text-soft">{note}</dd> : null}
    </div>
  );
}

function Block({ id, eyebrow, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="border-t border-line py-10 md:py-14">
      <Container>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2} id={`${id}-h`} className="mt-stack-s">
          {title}
        </Heading>
        <div className="mt-6">{children}</div>
      </Container>
    </section>
  );
}

function Table({ head, rows, empty = "Noch keine Daten." }) {
  if (!rows.length) return <p className="text-small text-text-soft">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-small">
        <thead>
          <tr className="border-b border-line-strong text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-medium text-text">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-4 ${typeof c === "number" ? "tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Scroll-Kurve: Anteil der Aufrufe, die ≥ x % der Seite erreichen. */
function ScrollCurve({ hist }) {
  const W = 600;
  const H = 220;
  const pts = [[0, 1], ...hist.map((v, i) => [(i + 1) * 5, v])];
  const x = (p) => 40 + (p / 100) * (W - 60);
  const y = (v) => 20 + (1 - v) * (H - 50);
  const d = pts.map(([p, v], i) => `${i ? "L" : "M"}${x(p).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-2xl" role="img" aria-label={`Scroll-Kurve: ${hist.map((v, i) => `${(i + 1) * 5} %: ${pct(v)}`).join(", ")}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={40} x2={W - 20} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.15" />
          <text x={34} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor">
            {pct(v)}
          </text>
        </g>
      ))}
      {[0, 25, 50, 75, 100].map((p) => (
        <text key={p} x={x(p)} y={H - 10} textAnchor="middle" fontSize="11" fill="currentColor">
          {p} %
        </text>
      ))}
      <path d={d} fill="none" stroke="#9a7a2a" strokeWidth="2.5" />
    </svg>
  );
}

/** Pfad-Sankey (SVG, eigener Code): Spalten = Schritte, Bänder ∝ Sitzungen. */
function Sankey({ kanten }) {
  if (!kanten.length) return <p className="text-small text-text-soft">Noch keine Pfade.</p>;
  const nodes = new Map();
  for (const e of kanten) {
    for (const [id, side] of [
      [e.von, "out"],
      [e.nach, "in"],
    ]) {
      const n = nodes.get(id) || { id, step: Number(id.split(":")[0]), label: id.slice(id.indexOf(":") + 1), in: 0, out: 0 };
      n[side] += e.n;
      nodes.set(id, n);
    }
  }
  const steps = Math.max(...[...nodes.values()].map((n) => n.step)) + 1;
  const colW = 190;
  const W = steps * colW + 40;
  const total = Math.max(...Array.from({ length: steps }, (_, s) => [...nodes.values()].filter((n) => n.step === s).reduce((t, n) => t + Math.max(n.in, n.out), 0)));
  const H = 420;
  const gap = 10;
  const scale = (H - 40) / Math.max(1, total) * 0.85;
  for (let s = 0; s < steps; s++) {
    let yy = 20;
    for (const n of [...nodes.values()].filter((n) => n.step === s).sort((a, b) => Math.max(b.in, b.out) - Math.max(a.in, a.out))) {
      n.x = 20 + s * colW;
      n.y = yy;
      n.h = Math.max(4, Math.max(n.in, n.out) * scale);
      n.oy = n.y;
      n.iy = n.y;
      yy += n.h + gap;
    }
  }
  const links = [...kanten].sort((a, b) => b.n - a.n).map((e) => {
    const a = nodes.get(e.von);
    const b = nodes.get(e.nach);
    const w = Math.max(1.5, e.n * scale);
    const y1 = a.oy + w / 2;
    const y2 = b.iy + w / 2;
    a.oy += w;
    b.iy += w;
    const x1 = a.x + 10;
    const x2 = b.x;
    const mx = (x1 + x2) / 2;
    return { key: `${e.von}>${e.nach}`, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, w, n: e.n, title: `${a.label} → ${b.label}: ${e.n}` };
  });
  const Hmax = Math.max(H, ...[...nodes.values()].map((n) => n.y + n.h + 20));
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${Hmax}`} width={W} height={Hmax} role="img" aria-label="Pfad-Sankey der Sitzungen">
        {links.map((l) => (
          <path key={l.key} d={l.d} fill="none" stroke="#4f6b68" strokeOpacity="0.35" strokeWidth={l.w}>
            <title>{l.title}</title>
          </path>
        ))}
        {[...nodes.values()].map((n) => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={10} height={n.h} fill={n.label.startsWith("ziel:") ? "#2f6b4a" : n.label === "ausstieg" ? "#9b2c2c" : "#30373e"} />
            <text x={n.x + 14} y={n.y + Math.min(n.h, 24) / 2 + 4} fontSize="11" fill="currentColor">
              {n.label.length > 28 ? `${n.label.slice(0, 27)}…` : n.label} ({Math.max(n.in, n.out)})
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Filter({ data, filter, devices, layers }) {
  const field = "mt-1 block min-h-11 w-full border border-line-control bg-surface px-3 text-ui";
  return (
    <form method="get" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Filter der Vorschau">
      <label className="text-small text-text-soft lg:col-span-2">
        Seite
        <select name="seite" defaultValue={data.route || ""} className={field}>
          {data.routen.map((r) => (
            <option key={r.route} value={r.route}>
              {r.route} ({r.n})
            </option>
          ))}
        </select>
      </label>
      <label className="text-small text-text-soft">
        Gerät
        <select name="geraet" defaultValue={filter.geraet} className={field}>
          {devices.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label className="text-small text-text-soft">
        Zeitraum
        <select name="tage" defaultValue={String(filter.tage)} className={field}>
          <option value="1">letzter Tag</option>
          <option value="7">7 Tage</option>
          <option value="30">30 Tage</option>
          <option value="0">alle</option>
        </select>
      </label>
      <label className="text-small text-text-soft">
        Quelle
        <select name="quelle" defaultValue={filter.quelle} className={field}>
          <option value="aggregat">Tagesaggregate</option>
          <option value="heute">heute (Rohdaten, k = {data.k})</option>
        </select>
      </label>
      <label className="text-small text-text-soft">
        Ebene
        <select name="ebene" defaultValue={filter.ebene} className={field}>
          {layers.map((l) => (
            <option key={l} value={l}>
              {LAYER_LABEL[l]}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2 lg:col-span-6">
        <button type="submit" className="min-h-11 bg-action px-5 text-ui text-text-inverse hover:bg-action-hover">
          Anzeigen
        </button>
      </div>
    </form>
  );
}

export default function Vorschau({ data, filter, devices, layers }) {
  const h = data.heat;
  return (
    <>
      <Container className="pt-10 md:pt-14">
        <Eyebrow>Vorschau · nur lokal · noindex</Eyebrow>
        <Heading level={1} className="mt-stack-s">
          Besucher-Einblicke
        </Heading>
        <p className="mt-4 max-w-measure text-body">
          Anonyme Tagesaggregate aus <Code>.data/einblicke/tag/</Code> – genau das, was nach Frappe übertragen wird. Pfade und Signale mit weniger als {data.k}{" "}
          Sitzungen stehen als „(selten)“. Tagesabschluss: <Code>node tools/einblicke/tagesabschluss.mjs</Code>.
        </p>
        <dl className="mt-8 grid grid-cols-1 gap-x-grid gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tage" value={data.tage.length} note={data.tage.length ? `${data.tage[0]} bis ${data.tage[data.tage.length - 1]}` : "noch kein Tagesabschluss"} />
          <Stat label="Sitzungen" value={data.kennzahlen.sitzungen} />
          <Stat label="Seitenaufrufe" value={data.kennzahlen.seitenaufrufe} />
          <Stat label="Ziel-Quote" value={`${data.kennzahlen.zielQuote} %`} note="Sitzungen mit Termin, Anfrage, Planer, Merkliste oder Kontakt" />
        </dl>
        <Filter data={data} filter={filter} devices={devices} layers={layers} />
      </Container>

      <Block id="heatmap" eyebrow={`${data.route || "–"} · ${data.geraet}`} title="Heatmap">
        {h ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <HeatmapCanvas src={data.screenshot?.src || null} manifest={data.screenshot?.manifest || null} heat={h} ebene={filter.ebene} geraet={data.geraet} />
            <div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Stat label="Besuche" value={h.besuche} note={h.besuche < data.k ? "dünn (unter k)" : null} />
                <Stat label="Seitenaufrufe" value={h.seitenaufrufe} />
                <Stat label="Viewport (Median)" value={`${h.viewport_breite_median} px`} />
                <Stat label="Dokumenthöhe (Median)" value={`${h.dokumenthoehe_median} px`} />
              </dl>
              <Heading level={3} size="title" className="mt-8">
                Meistgeklickte Elemente
              </Heading>
              <div className="mt-3">
                <Table head={["Selektor", "Klicks"]} rows={h.element_klicks.slice(0, 15).map((e) => [<Code key="s">{e.sel}</Code>, e.n])} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-small text-text-soft">Für diese Auswahl gibt es keine Daten.</p>
        )}
      </Block>

      {h ? (
        <Block id="scroll" eyebrow="Wie weit gelesen wird" title="Scroll-Kurve und Aufmerksamkeit">
          <ScrollCurve hist={h.scroll_histogramm} />
          <div className="mt-8">
            <Table
              head={["Abschnitt", "Sichtzeit (Median)", "Sehen ihn"]}
              rows={h.aufmerksamkeit.slice(0, 25).map((a) => [<Code key="s">{a.sel}</Code>, `${(a.median_ms / 1000).toFixed(1)} s`, pct(a.sichtanteil)])}
            />
          </div>
        </Block>
      ) : null}

      <Block id="pfade" eyebrow="Wer wohin geht" title="Pfade">
        {data.pfade ? (
          <>
            <p className="mb-4 text-small text-text-soft">
              {data.pfade.sitzungen} Sitzungen · Ziele: {Object.entries(data.pfade.ziele).map(([g, n]) => `${g} ${n}`).join(" · ")}
            </p>
            <Sankey kanten={data.pfade.kanten} />
            <div className="mt-8">
              <Table head={["Pfad", "Sitzungen"]} rows={data.pfade.top_pfade.map((p) => [p.pfad.join(" → "), p.n])} />
            </div>
            <Heading level={3} size="title" className="mt-8">
              Ziel-Quote je Herkunft
            </Heading>
            <div className="mt-3">
              <Table head={["Tag", "Herkunft", "Sitzungen", "Ziel-Quote"]} rows={data.herkunft.map((p) => [p.datum, p.herkunft, p.sitzungen, `${p.ziel_quote} %`])} />
            </div>
          </>
        ) : (
          <p className="text-small text-text-soft">Noch keine Pfade.</p>
        )}
      </Block>

      <Block id="signale" eyebrow="Wo es hakt" title="Frustsignale">
        <Table
          head={["Tag", "Gerät", "Typ", "Ziel", "Anzahl", "Sitzungen", "Details"]}
          rows={data.signale.slice(0, 60).map((s) => [
            s.datum,
            s.geraet,
            s.typ,
            <Code key="z">{s.ziel}</Code>,
            s.anzahl,
            s.sitzungen,
            s.details ? `${s.details.abgeschlossen}/${s.details.gestartet} abgeschlossen · zuletzt: ${s.details.felder.filter((f) => f.letztes).map((f) => `${f.n} ${f.letztes}`).join(", ") || "–"}` : "",
          ])}
          empty="Keine Signale (oder alle unter k)."
        />
      </Block>

      <Block id="planer" eyebrow="Werkzeuge" title="Planer">
        <Table
          head={["Tag", "Planer", "Gerät", "Starts", "Schritte", "Übergaben", "Abbrüche", "Dauer (Median)"]}
          rows={data.planer.map((p) => [p.datum, p.planer, p.geraet, p.starts, p.schritte.map((s) => `${s.schritt} ${s.n}`).join(" · "), p.uebergaben, p.abbrueche, `${p.median_dauer_s} s`])}
          empty="Noch keine Planer-Ereignisse."
        />
        <p className="mt-6 text-small text-text-soft">
          Rohdaten: <Code>.data/einblicke/roh/</Code> (höchstens 14 Tage) · Frappe-Dry-Run: <Code>.data/einblicke/outbox/</Code> ·{" "}
          <a className={linkCls} href="#heatmap">
            nach oben
          </a>
        </p>
      </Block>
    </>
  );
}
