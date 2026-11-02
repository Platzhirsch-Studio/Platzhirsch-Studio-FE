// src/lib/einblicke/aggregate.js – Rohereignisse eines Tages → anonymes
// Tagesaggregat im Vertrag schema 1 (Konzept §4.2 / §5.2). Rein und testbar.
//
// Eingabe: Rohsätze { sid, seq, pv, ts_min, e:[[typ, daten]] } (store.server.js).
// Ausgabe: { datum, schema:1, meta, seiten, heatmaps, pfade, signale, planer }
// – genau der Body von platzhirsch_einblicke.api.tag_speichern.
//
// Anonymität: keine sid, keine Zeit unter Tagesauflösung im Ergebnis. Pfade,
// Einstiege/Ausstiege und Signale mit < k Sitzungen werden zu „(selten)“
// zusammengefasst; Heatmap-Tage mit < k Besuchen tragen duenn = 1 und gehen
// NICHT nach Frappe: poolHeatmaps() hält sie höchstens 14 Tage zurück und
// sendet sie erst zusammengefasst, sobald k Besuche erreicht sind (QA Recht
// P2-2). Unbekannte URLs/404 heißen "/<sprache>/(404)"; dynamische Seiten mit
// < k Sitzungen am Tag laufen unter ihrer Vorlage (QA Recht P2-3).
import { DEVICES, ELEMENT_GRID, PLANNERS, SCHEMA_VERSION, SERVER, SIGNAL_TYPES, BAND_PX, GRID_COLS, GOALS } from "./config.js";
import { localeOf, normalizePath, routeOf, templateOf } from "./routes.js";

export const RARE = "(selten)";
const ALL = "Alle";
const MAX_STEPS = 8;
const GAP_MS = 30 * 60 * 1000;

const median = (xs) => quantile(xs, 0.5);
function quantile(xs, p) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo));
}
const round3 = (x) => Math.round(x * 1000) / 1000;
const inc = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);
const cellsOf = (map) => [...map].map(([k, n]) => [k % 1000, Math.floor(k / 1000), n]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);

/** Rohsätze → Seitenaufrufe je Sitzung (30-min-Regel auch am Server). */
export function buildSessions(records) {
  const bySid = new Map();
  for (const r of records) {
    if (!r || typeof r.sid !== "string" || !Array.isArray(r.e)) continue;
    if (!bySid.has(r.sid)) bySid.set(r.sid, []);
    bySid.get(r.sid).push(r);
  }
  const sessions = [];
  for (const [sid, recs] of bySid) {
    recs.sort((a, b) => a.seq - b.seq);
    const views = new Map(); // pv-Index → Seitenaufruf
    for (const r of recs) {
      let v = views.get(r.pv);
      if (!v) {
        v = { i: r.pv, ts: Date.parse(r.ts_min) || 0, route: null, clicks: [], sg: [], sc: null, m: null, a: null, fo: new Map(), fi: [], fe: [], g: [], pl: [], err: [] };
        views.set(r.pv, v);
      }
      for (const [t, d] of r.e) {
        if (t === "pv") {
          if (v.route) continue;
          v.route = routeOf(d.p);
          v.vorlage = templateOf(v.route);
          v.dc = d.dc;
          v.vw = d.vw;
          v.dh = d.dh;
          v.ch = d.ch;
        } else if (t === "c") v.clicks.push(d);
        else if (t === "sg") v.sg.push(d);
        else if (t === "sc") v.sc = d.max;
        else if (t === "m") v.m = d;
        else if (t === "a") v.a = d;
        else if (t === "fo") v.fo.set(d.f, d);
        else if (t === "fi" || t === "fe" || t === "g" || t === "pl" || t === "err") v[t].push(d);
      }
    }
    const ordered = [...views.values()].filter((v) => v.route).sort((a, b) => a.i - b.i);
    let cur = null;
    let n = 0;
    for (const v of ordered) {
      if (!cur || (v.ts && cur.lastTs && v.ts - cur.lastTs > GAP_MS)) {
        cur = { key: `${sid}#${n++}`, views: [], lastTs: v.ts };
        sessions.push(cur);
      }
      cur.views.push(v);
      cur.lastTs = v.ts || cur.lastTs;
    }
  }
  for (const s of sessions) {
    const first = s.views[0];
    s.dc = first.dc;
    s.ch = first.ch || "Direkt";
    s.goals = [];
    s.views.forEach((v, idx) => v.g.forEach((g) => s.goals.push({ ...g, at: idx })));
  }
  return sessions;
}

function heatmapsOf(sessions, datum, k) {
  const groups = new Map();
  for (const s of sessions) {
    for (const v of s.views) {
      const key = `${v.route}|${v.dc}`;
      let g = groups.get(key);
      if (!g) {
        g = { route: v.route, vorlage: v.vorlage, dc: v.dc, sess: new Set(), views: 0, grid: new Map(), el: new Map(), move: new Map(), scroll: [], att: new Map(), snaps: 0, vw: [], dh: [] };
        groups.set(key, g);
      }
      g.sess.add(s.key);
      g.views += 1;
      g.vw.push(v.vw);
      g.dh.push(v.dh);
      for (const c of v.clicks) {
        inc(g.grid, Math.min(999, Math.floor(c.y / BAND_PX)) * 1000 + c.col);
        let e = g.el.get(c.s);
        if (!e) g.el.set(c.s, (e = { n: 0, pkt: new Map() }));
        e.n += 1;
        const cell = Math.min(ELEMENT_GRID - 1, Math.floor((c.ex / 1000) * ELEMENT_GRID));
        const row = Math.min(ELEMENT_GRID - 1, Math.floor((c.ey / 1000) * ELEMENT_GRID));
        inc(e.pkt, row * 1000 + cell);
      }
      if (v.m && v.dc === "d") for (const [col, band, n] of v.m) inc(g.move, band * 1000 + col, n);
      if (v.sc !== null) {
        g.snaps += 1;
        g.scroll.push(v.sc);
        for (const [sel, ms] of v.a || []) {
          if (!g.att.has(sel)) g.att.set(sel, []);
          g.att.get(sel).push(ms);
        }
      }
    }
  }
  return [...groups.values()].map((g) => {
    const geraet = DEVICES[g.dc];
    const besuche = g.sess.size;
    return {
      name: `${g.route}|${geraet}|${datum}`,
      seite: g.route,
      vorlage: g.vorlage,
      geraet,
      datum,
      besuche,
      seitenaufrufe: g.views,
      duenn: besuche < k ? 1 : 0,
      klick_raster: { spalten: GRID_COLS, bandPx: BAND_PX, zellen: cellsOf(g.grid) },
      element_klicks: [...g.el]
        .sort((a, b) => b[1].n - a[1].n)
        .slice(0, 200)
        .map(([sel, e]) => ({ sel, n: e.n, pkt: cellsOf(e.pkt) })),
      bewegung_raster: g.dc === "d" ? { spalten: GRID_COLS, bandPx: BAND_PX, zellen: cellsOf(g.move) } : null,
      scroll_histogramm: Array.from({ length: 20 }, (_, i) => (g.snaps ? round3(g.scroll.filter((x) => x >= (i + 1) * 5).length / g.snaps) : 0)),
      aufmerksamkeit: [...g.att]
        .map(([sel, xs]) => ({ sel, median_ms: median(xs), p75_ms: quantile(xs, 0.75), sichtanteil: round3(xs.length / (g.snaps || 1)) }))
        .sort((a, b) => b.sichtanteil - a.sichtanteil || b.median_ms - a.median_ms),
      viewport_breite_median: median(g.vw),
      dokumenthoehe_median: median(g.dh),
      schema_version: SCHEMA_VERSION,
    };
  });
}

/** Schrittfolge einer Sitzung: Vorlagen (Wiederholungen zusammengefasst), bis zum ersten Ziel. */
export function pathOf(session) {
  const goal = session.goals[0];
  const views = goal ? session.views.slice(0, goal.at + 1) : session.views;
  const steps = [];
  for (const v of views) if (steps[steps.length - 1] !== v.vorlage) steps.push(v.vorlage);
  const capped = steps.length > MAX_STEPS ? [...steps.slice(0, MAX_STEPS), "…"] : steps;
  return { steps: capped, end: goal ? `ziel:${goal.t}` : "ausstieg", last: steps[steps.length - 1] };
}

function rareCounts(map, k, key = "vorlage") {
  const out = [];
  let rare = 0;
  for (const [v, n] of [...map].sort((a, b) => b[1] - a[1])) {
    if (n >= k) out.push({ [key]: v, n });
    else rare += n;
  }
  if (rare) out.push({ [key]: RARE, n: rare });
  return out;
}

function pathDoc(list, datum, geraet, herkunft, k) {
  const paths = new Map();
  const entries = new Map();
  const exits = new Map();
  const edges = new Map();
  const nodeCount = new Map();
  const ziele = Object.fromEntries(GOALS.map((g) => [g, 0]));
  let withGoal = 0;
  for (const s of list) {
    const p = pathOf(s);
    const full = [...p.steps, p.end];
    inc(paths, JSON.stringify(full));
    inc(entries, p.steps[0]);
    if (p.end === "ausstieg") inc(exits, p.last);
    for (let i = 0; i < full.length; i++) inc(nodeCount, `${i}:${full[i]}`);
    for (let i = 0; i < full.length - 1; i++) inc(edges, JSON.stringify([`${i}:${full[i]}`, `${i + 1}:${full[i + 1]}`]));
    const types = new Set(s.goals.map((g) => g.t));
    for (const t of types) ziele[t] += 1;
    if (types.size) withGoal += 1;
  }
  // Knoten mit < k Sitzungen → „(selten)“ desselben Schritts; danach Kanten
  // < k zwischen sichtbaren Knoten → Ziel „(selten)“ des nächsten Schritts.
  const nodeOf = (id) => (nodeCount.get(id) >= k ? id : `${id.split(":")[0]}:${RARE}`);
  const kept = new Map();
  for (const [key, n] of edges) {
    const [von, nach] = JSON.parse(key).map(nodeOf);
    const target = n >= k || nach.endsWith(RARE) ? nach : `${nach.split(":")[0]}:${RARE}`;
    inc(kept, JSON.stringify([von, target]), n);
  }
  const nodes = new Map();
  const kanten = [...kept].map(([key, n]) => {
    const [von, nach] = JSON.parse(key);
    for (const id of [von, nach]) {
      const at = id.indexOf(":");
      nodes.set(id, { id, schritt: Number(id.slice(0, at)), vorlage: id.slice(at + 1) });
    }
    return { von, nach, n };
  });
  const top = [];
  let rare = 0;
  for (const [key, n] of [...paths].sort((a, b) => b[1] - a[1])) {
    if (n >= k && top.length < 50) top.push({ pfad: JSON.parse(key), n });
    else rare += n;
  }
  if (rare) top.push({ pfad: [RARE], n: rare });
  return {
    name: `${datum}|${geraet}|${herkunft}`,
    datum,
    geraet,
    herkunft,
    sitzungen: list.length,
    sitzungen_mit_ziel: withGoal,
    sankey: { knoten: [...nodes.values()].sort((a, b) => a.schritt - b.schritt), kanten: kanten.sort((a, b) => b.n - a.n) },
    top_pfade: top,
    einstiege: rareCounts(entries, k),
    ausstiege: rareCounts(exits, k),
    ziele,
    ziel_quote: list.length ? Math.round((withGoal / list.length) * 1000) / 10 : 0,
  };
}

function pathsOf(sessions, datum, k) {
  const out = [];
  const devices = [ALL, ...Object.keys(DEVICES)];
  for (const dc of devices) {
    const byDevice = dc === ALL ? sessions : sessions.filter((s) => s.dc === dc);
    if (!byDevice.length) continue;
    const geraet = dc === ALL ? ALL : DEVICES[dc];
    out.push(pathDoc(byDevice, datum, geraet, ALL, k));
    for (const ch of [...new Set(byDevice.map((s) => s.ch))].sort()) {
      out.push(pathDoc(byDevice.filter((s) => s.ch === ch), datum, geraet, ch, k));
    }
  }
  return out;
}

function signalsOf(sessions, datum, k) {
  const groups = new Map(); // route|dc|typ → Map(ziel → { anzahl, sess:Set, details })
  const add = (v, typ, ziel, s, n = 1) => {
    const gk = `${v.route}|${v.dc}|${typ}`;
    if (!groups.has(gk)) groups.set(gk, { route: v.route, dc: v.dc, typ, items: new Map() });
    const items = groups.get(gk).items;
    let it = items.get(ziel);
    if (!it) items.set(ziel, (it = { anzahl: 0, sess: new Set() }));
    it.anzahl += n;
    it.sess.add(s.key);
    return it;
  };
  const funnels = new Map(); // route|dc|form → { felder: Map(n → {beruehrt, letztes}), gestartet, abgeschlossen }
  for (const s of sessions) {
    const done = new Set(s.goals.filter((g) => g.t === "anfrage").map((g) => g.f || "*"));
    const forms = new Map(); // form → { v, b:Set, l }
    for (const v of s.views) {
      for (const sg of v.sg) add(v, sg.k === "rage" ? SIGNAL_TYPES.rage : SIGNAL_TYPES.dead, sg.s, s);
      for (const fi of v.fi) add(v, SIGNAL_TYPES.invalid, `${fi.f}:${fi.n}`, s);
      for (const fe of v.fe) add(v, SIGNAL_TYPES.formError, `${fe.f}:${fe.st}`, s);
      for (const er of v.err) add(v, SIGNAL_TYPES.error, `${er.t}@${er.src || "?"}:${er.l || 0}`, s);
      for (const [f, fo] of v.fo) {
        const prev = forms.get(f) || { v, b: new Set(), l: "" };
        fo.b.forEach((n) => prev.b.add(n));
        prev.l = fo.l || prev.l;
        prev.v = v;
        forms.set(f, prev);
      }
    }
    for (const [f, st] of forms) {
      if (!st.b.size) continue;
      const fk = `${st.v.route}|${st.v.dc}|${f}`;
      if (!funnels.has(fk)) funnels.set(fk, { felder: new Map(), gestartet: 0, abgeschlossen: 0 });
      const fun = funnels.get(fk);
      fun.gestartet += 1;
      const ok = done.has(f) || done.has("*");
      if (ok) fun.abgeschlossen += 1;
      for (const n of st.b) {
        const fld = fun.felder.get(n) || { n, beruehrt: 0, letztes: 0 };
        fld.beruehrt += 1;
        if (!ok && n === st.l) fld.letztes += 1;
        fun.felder.set(n, fld);
      }
      if (!ok) add(st.v, SIGNAL_TYPES.abbruch, f, s).details = fk;
    }
  }
  const out = [];
  for (const g of groups.values()) {
    const geraet = DEVICES[g.dc];
    let rare = null;
    const emit = (ziel, anzahl, sitzungen, details) =>
      out.push({ name: `${datum}|${g.route}|${geraet}|${g.typ}|${ziel}`, datum, seite: g.route, geraet, typ: g.typ, ziel, anzahl, sitzungen, details });
    for (const [ziel, it] of g.items) {
      if (it.sess.size < k) {
        rare = rare || { anzahl: 0, sess: new Set() };
        rare.anzahl += it.anzahl;
        it.sess.forEach((x) => rare.sess.add(x));
        continue;
      }
      let details = null;
      if (g.typ === SIGNAL_TYPES.abbruch && it.details) {
        const fun = funnels.get(it.details);
        details = { gestartet: fun.gestartet, abgeschlossen: fun.abgeschlossen, felder: [...fun.felder.values()].sort((a, b) => b.beruehrt - a.beruehrt) };
      }
      emit(ziel, it.anzahl, it.sess.size, details);
    }
    if (rare) emit(RARE, rare.anzahl, rare.sess.size, null);
  }
  return out.sort((a, b) => b.sitzungen - a.sitzungen || b.anzahl - a.anzahl);
}

function plannersOf(sessions, datum) {
  const groups = new Map();
  for (const s of sessions) {
    const per = new Map(); // planer → { start, steps:Set, profile, ueb, abbruch, d }
    for (const v of s.views) {
      for (const e of v.pl) {
        const st = per.get(e.n) || { dc: s.dc, start: false, steps: new Set(), profiles: new Set(), ueb: false, abbruch: false, d: 0 };
        if (e.a === "start") st.start = true;
        if (e.a === "schritt" && e.s) st.steps.add(e.s);
        if (e.a === "ergebnis" && e.p) st.profiles.add(e.p);
        if (e.a === "uebergabe") st.ueb = true;
        if (e.a === "abbruch") st.abbruch = true;
        if (e.d) st.d = Math.max(st.d, e.d);
        per.set(e.n, st);
      }
    }
    for (const [n, st] of per) {
      const key = `${n}|${st.dc}`;
      if (!groups.has(key)) groups.set(key, { n, dc: st.dc, starts: 0, steps: new Map(), profiles: new Map(), ueb: 0, abb: 0, d: [] });
      const g = groups.get(key);
      if (st.start) g.starts += 1;
      st.steps.forEach((x) => inc(g.steps, x));
      st.profiles.forEach((x) => inc(g.profiles, x));
      if (st.ueb) g.ueb += 1;
      else if (st.start || st.abbruch) g.abb += 1;
      if (st.start && st.d) g.d.push(st.d);
    }
  }
  return [...groups.values()].map((g) => {
    const label = PLANNERS[g.n]?.label || g.n;
    const geraet = DEVICES[g.dc];
    return {
      name: `${datum}|${label}|${geraet}`,
      datum,
      planer: label,
      planer_schluessel: g.n,
      geraet,
      starts: g.starts,
      schritte: (PLANNERS[g.n]?.steps || []).map((schritt) => ({ schritt, n: g.steps.get(schritt) || 0 })),
      ergebnisse: Object.fromEntries([...g.profiles].sort((a, b) => b[1] - a[1])),
      uebergaben: g.ueb,
      abbrueche: g.abb,
      median_dauer_s: median(g.d),
    };
  });
}

/**
 * aggregateDay(records, { datum, k }) → Tagesaggregat (Vertrag schema 1).
 */
export function aggregateDay(records, { datum, k = SERVER.k, now = new Date() } = {}) {
  const sessions = buildSessions(records);
  // Dynamische Seiten (Produkt, Marke, News …) mit < k Sitzungen am Tag nur als
  // Vorlage: eine selten besuchte Einzelseite × Tag wäre sonst oft genau ein Besuch.
  const perRoute = new Map();
  for (const s of sessions) for (const r of new Set(s.views.map((v) => v.route))) inc(perRoute, r);
  for (const s of sessions) for (const v of s.views) if (v.route !== v.vorlage && perRoute.get(v.route) < k) v.route = v.vorlage;
  // Höchstens maxRoutesPerDay Routen (nach Aufrufen); der Rest zählt nur in meta.
  const views = new Map();
  for (const s of sessions) for (const v of s.views) inc(views, v.route);
  const keep = new Set([...views].sort((a, b) => b[1] - a[1]).slice(0, SERVER.maxRoutesPerDay).map(([r]) => r));
  const dropped = views.size - keep.size;
  for (const s of sessions) s.views = s.views.filter((v) => keep.has(v.route));
  const live = sessions.filter((s) => s.views.length);
  return {
    datum,
    schema: SCHEMA_VERSION,
    meta: {
      quelle: "platzhirsch.studio",
      erzeugt: now.toISOString(),
      k,
      sitzungen: live.length,
      seitenaufrufe: live.reduce((n, s) => n + s.views.length, 0),
      routen_verworfen: dropped,
    },
    seiten: [...keep].sort().map((route) => ({ route, vorlage: templateOf(route), sprache: localeOf(route) })),
    heatmaps: heatmapsOf(live, datum, k),
    pfade: pathsOf(live, datum, k),
    signale: signalsOf(live, datum, k),
    planer: plannersOf(live, datum),
  };
}

/** Mehrere Tagesaggregate einer Seite × Gerät zusammenzählen (Vorschau, Bericht). */
export function sumHeatmaps(list) {
  if (!list.length) return null;
  const grid = new Map();
  const move = new Map();
  const el = new Map();
  const att = new Map();
  let views = 0;
  let besuche = 0;
  const hist = new Array(20).fill(0);
  for (const h of list) {
    besuche += h.besuche;
    views += h.seitenaufrufe;
    for (const [c, b, n] of h.klick_raster?.zellen || []) inc(grid, b * 1000 + c, n);
    for (const [c, b, n] of h.bewegung_raster?.zellen || []) inc(move, b * 1000 + c, n);
    for (const e of h.element_klicks || []) {
      const cur = el.get(e.sel) || { n: 0, pkt: new Map() };
      cur.n += e.n;
      for (const [c, r, n] of e.pkt) inc(cur.pkt, r * 1000 + c, n);
      el.set(e.sel, cur);
    }
    h.scroll_histogramm.forEach((x, i) => (hist[i] += x * h.seitenaufrufe));
    for (const a of h.aufmerksamkeit || []) {
      const cur = att.get(a.sel) || { ms: 0, seen: 0 };
      const seen = a.sichtanteil * h.seitenaufrufe;
      cur.ms += a.median_ms * seen;
      cur.seen += seen;
      att.set(a.sel, cur);
    }
  }
  const last = list[list.length - 1];
  return {
    seite: last.seite,
    vorlage: last.vorlage,
    geraet: last.geraet,
    tage: list.length,
    besuche,
    seitenaufrufe: views,
    klick_raster: { spalten: GRID_COLS, bandPx: BAND_PX, zellen: cellsOf(grid) },
    bewegung_raster: { spalten: GRID_COLS, bandPx: BAND_PX, zellen: cellsOf(move) },
    element_klicks: [...el].sort((a, b) => b[1].n - a[1].n).map(([sel, e]) => ({ sel, n: e.n, pkt: cellsOf(e.pkt) })),
    scroll_histogramm: hist.map((x) => round3(views ? x / views : 0)),
    aufmerksamkeit: [...att]
      .map(([sel, a]) => ({ sel, median_ms: Math.round(a.seen ? a.ms / a.seen : 0), sichtanteil: round3(views ? a.seen / views : 0) }))
      .sort((a, b) => b.sichtanteil - a.sichtanteil),
    viewport_breite_median: median(list.map((h) => h.viewport_breite_median)),
    dokumenthoehe_median: median(list.map((h) => h.dokumenthoehe_median)),
  };
}

// ---------------------------------------------------------------------------
// Dünne Heatmaps zurückhalten (QA Recht Einblicke P2-2).
// Eine Heatmap Seite × Gerät × Tag mit < k Besuchen ist oft genau ein Besuch
// (Bewegungsprofil eines Einzelnen). Sie geht NICHT nach Frappe und NICHT in
// das dauerhafte Tagesaggregat, sondern in den Pool (.data/einblicke/pool.json,
// höchstens rawMaxDays = 14 Tage wie die Rohdaten). Sobald Seite × Gerät im
// Pool zusammen ≥ k Besuche hat – oder ein Tag mit ≥ k Besuchen kommt –,
// wird alles zu EINER Heatmap am aktuellen Tag zusammengefasst
// (Feld zusammengefasst = Liste der Tage; Frappe ignoriert es).
// Pool: { v: 1, eintraege: { "<seite>|<geraet>": { "<tag>": heatmap } } }.
// ---------------------------------------------------------------------------

const DAY_MS = 86400000;
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/** Pool ohne Tage, die keepDays oder mehr vor `heute` liegen (und ohne kaputte Einträge). */
export function prunePool(pool, heute, keepDays = SERVER.rawMaxDays) {
  const out = { v: 1, eintraege: {} };
  for (const [key, days] of Object.entries(pool?.eintraege || {})) {
    if (!days || typeof days !== "object") continue;
    const kept = Object.entries(days).filter(([d, h]) => h && /^\d{4}-\d{2}-\d{2}$/.test(d) && dayDiff(d, heute) < keepDays);
    if (kept.length) out.eintraege[key] = Object.fromEntries(kept);
  }
  return out;
}

/** Mehrere Heatmaps einer Seite × Gerät → eine Heatmap im Vertragsformat am Tag `datum`. */
export function mergeHeatmaps(list, datum) {
  const sum = sumHeatmaps(list);
  const tage = [...new Set(list.map((h) => h.datum))].sort();
  return {
    name: `${sum.seite}|${sum.geraet}|${datum}`,
    seite: sum.seite,
    vorlage: sum.vorlage,
    geraet: sum.geraet,
    datum,
    besuche: sum.besuche,
    seitenaufrufe: sum.seitenaufrufe,
    duenn: 0,
    zusammengefasst: tage,
    klick_raster: sum.klick_raster,
    element_klicks: sum.element_klicks.slice(0, 200),
    bewegung_raster: sum.geraet === DEVICES.d ? sum.bewegung_raster : null,
    scroll_histogramm: sum.scroll_histogramm,
    aufmerksamkeit: sum.aufmerksamkeit.map((a) => ({ ...a, p75_ms: a.median_ms })),
    viewport_breite_median: sum.viewport_breite_median,
    dokumenthoehe_median: sum.dokumenthoehe_median,
    schema_version: SCHEMA_VERSION,
  };
}

/**
 * poolHeatmaps(heatmaps, pool, { datum, k, keepDays }) → { heatmaps, pool, zurueckgehalten }
 * heatmaps: was gesendet und dauerhaft gespeichert werden darf (alle ≥ k Besuche).
 */
export function poolHeatmaps(heatmaps, pool, { datum, k = SERVER.k, keepDays = SERVER.rawMaxDays } = {}) {
  const next = prunePool(pool, datum, keepDays);
  const out = [];
  let held = 0;
  for (const h of heatmaps) {
    const key = `${h.seite}|${h.geraet}`;
    const waiting = Object.entries(next.eintraege[key] || {}).filter(([d]) => d !== datum).map(([, x]) => x);
    if (h.besuche >= k) {
      out.push(waiting.length ? mergeHeatmaps([...waiting, h], datum) : { ...h, duenn: 0 });
      delete next.eintraege[key];
      continue;
    }
    const all = [...waiting, h];
    if (all.reduce((n, x) => n + x.besuche, 0) >= k) {
      out.push(mergeHeatmaps(all, datum));
      delete next.eintraege[key];
    } else {
      next.eintraege[key] = { ...(next.eintraege[key] || {}), [datum]: h };
      held += 1;
    }
  }
  return { heatmaps: out, pool: next, zurueckgehalten: held };
}
