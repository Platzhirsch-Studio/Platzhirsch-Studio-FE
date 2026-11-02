// Küchenplaner – Stückliste mit Positionen (Möbel, Platten, Blenden, Licht, Geräte).
// Aus buildKitchen(plan) abgeleitet; Maße in cm (B × H × T). Gerätenischen nur
// mit Quelle (norms.js), sonst „Maß fehlt“. Preise stehen hier bewusst NICHT.
import { EDGES, FRONT_COLORS, FRONT_FINISHES, GRIP_COLORS, GRIPS, MODULES, PANELS, SINK_MOUNTS, SPLASHES, WORKTOPS, fmtCm } from "../../components/Labs/Kuechenplaner/catalog.js";
import { NICHES } from "./norms.js";
import { opt, optLabels } from "./options.js";
import { geraetHref, geraeteSlots, indexMap, pruefeGeraet } from "./geraete.js";

const c1 = (m) => Math.round(m * 1000) / 10; // m → cm, 1 Nachkommastelle

// Die Nischenmaße in norms.js stammen von 60-cm-Geräten (EN 1116). Im 55-cm-Raster (SMS)
// ist der Korpus nur 55 cm breit – eine 56-cm-Nische passt dort nicht hinein. Ohne Quelle
// für SMS-Nischen steht dann „Maß fehlt“ (Regel in norms.js: kein Maß ohne Quelle).
function nicheOf(m, plan) {
  const list = nicheEU(m);
  if (plan?.raster !== 55) return list;
  return list.map((n) => ({ ...n, h: null, w: null, d: null, label: `${n.label.replace(/ 60$/, "")} (SMS 55)`, source: null }));
}

function nicheEU(m) {
  if (m.t === "backofen" || m.t === "backofenus") {
    const g = opt(m, "g");
    return [NICHES.backofen, ...(g === "d" || g === "m" ? [NICHES.kompakt] : g === "2" ? [NICHES.backofen] : [])];
  }
  if (m.t === "kuehlschrank") return [opt(m, "k") === "1" ? NICHES.kuehl122 : NICHES.kuehl178];
  if (m.t === "sidebyside") return opt(m, "s") === "f" ? [NICHES.sbsFrei] : [NICHES.kuehl178, NICHES.kuehl178];
  if (m.t === "weinkuehler" || m.t === "weinklima") return [NICHES.weinkuehler];
  return [];
}

const GERAET_STATUS = { passt: "passt laut Katalogmaßen", pruefen: "Einbaumaß prüfen wir im Gespräch", frei: "" };

/**
 * Liefert { rows: [{ pos, group, label, detail, size, wall, qty, unit, note, href? }], count }.
 * geraete (optional): Geräte-Index (Array oder Map, lib/kuechenplaner/geraete.js) – gewählte
 * Katalogmodelle erscheinen dann mit Name, Gerätemaß laut Hersteller und Link zur Produktseite.
 */
export function buildBom(plan, kitchen, geraete = null) {
  const gmap = geraete instanceof Map ? geraete : geraete ? indexMap(geraete) : null;
  const d = kitchen.dims;
  const rows = [];
  const front = `${FRONT_FINISHES[plan.finish].label}, ${FRONT_COLORS[plan.finish]?.[plan.color]?.label || plan.color}`;
  const grip = `${GRIPS[plan.grip].label}${plan.grip === "grifflos" || plan.grip === "push" ? "" : `, ${GRIP_COLORS[plan.gripColor || "alu"].label}`}`;
  let pos = 1;
  const add = (r) => rows.push({ pos: pos++, qty: 1, unit: "Stk", ...r });
  const wallName = (w) => (w === "i" ? (plan.shape === "halbinsel" ? "Halbinsel" : "Insel") : `Wand ${w.toUpperCase()}`);

  const floor = kitchen.mods.filter((m) => m.kind !== "upper").sort((a, b) => (a.wall === b.wall ? a.x0 - b.x0 : a.wall.localeCompare(b.wall)));
  for (const m of floor) {
    const def = MODULES[m.t];
    const hgt = def.kind === "tall" ? c1(d.tallTop) : c1(d.topY - d.topT);
    const depth = m.wall === "i" ? c1(Math.min(0.6, (plan.island.depth - plan.island.over) / 100)) : 60;
    const niches = nicheOf(m, plan);
    add({
      group: def.kind === "tall" ? "Hochschränke" : "Unterschränke",
      label: def.label,
      detail: [...optLabels(m), m.t === "passstueck" ? "" : front, m.t === "passstueck" || def.kind === "tall" || m.t === "regal" ? "" : grip].filter(Boolean).join(" · "),
      size: `${fmtCm(m.w)} × ${fmtCm(hgt)} × ${fmtCm(depth)}`,
      wall: `${wallName(m.wall)}, ab ${fmtCm(Math.round(m.x0 * 10) / 10)} cm`,
      note: niches.map((n) => (n.source ? `${n.label}: ${fmtCm(n.h)} × ${fmtCm(n.w)} × ${fmtCm(n.d)} cm (Herstellerangabe)` : `${n.label} – Maß fehlt`)).join("; "),
      id: m.id,
    });
  }
  const uppers = kitchen.mods.filter((m) => m.kind === "upper");
  for (const m of uppers) {
    const def = MODULES[m.t];
    // Eck-Hängeschrank: Tür nur am zugänglichen Teil, Blindecke hinter der Nachbarzeile
    const eck = m.corner && m.blind > 0;
    add({
      group: "Hängeschränke",
      label: (eck ? "Eck-Hängeschrank" : def.label) + (m.auto ? " (automatisch)" : ""),
      detail: [m.auto ? "Tür" : optLabels(m).join(", "), eck ? `Blindecke ${fmtCm(m.blind)} cm` : "", m.t === "wandbord" ? "Holz" : front].filter(Boolean).join(" · "),
      size: `${fmtCm(Math.round(m.w * 10) / 10)} × ${fmtCm(c1(m.y1 - m.y0))} × ${m.t === "wandbord" ? 25 : 35}`,
      wall: `${wallName(m.wall)}, Unterkante ${fmtCm(c1(m.y0))} cm`,
      note: "",
      id: m.id,
    });
  }
  // Arbeitsplatten je Abschnitt
  const wt = WORKTOPS[plan.top];
  for (const [w, pieces] of Object.entries(kitchen.tops)) {
    for (const p of pieces) {
      add({
        group: "Arbeitsplatten",
        label: `Arbeitsplatte ${wt.label}`,
        detail: [`${plan.topT} mm`, EDGES[plan.edge].label, p.cuts ? `${p.cuts} Spülenausschnitt (${SINK_MOUNTS[plan.sink].label})` : ""].filter(Boolean).join(" · "),
        size: `${fmtCm(c1(p.u1 - p.u0))} × ${fmtCm(plan.topT / 10)} × ${fmtCm(c1(p.v1 - p.v0))}`,
        wall: wallName(w),
        note: kitchen.mods.some((m) => m.wall === w && m.t === "kochfeld") ? "Kochfeldausschnitt nach Gerät" : "",
      });
    }
  }
  if (plan.splash !== "keine") {
    const sp = kitchen.parts.filter((p) => /-splash/.test(p.id));
    const area = sp.reduce((s, p) => s + p.size[0] * p.size[1], 0);
    if (area > 0) add({ group: "Rückwand & Blenden", label: `Nischenrückwand ${plan.splash === "platte" ? "wie Arbeitsplatte" : SPLASHES[plan.splash].label}` /* QM r3: klein im Satz */, detail: `${sp.length} Teil${sp.length > 1 ? "e" : ""}`, size: `${fmtCm(Math.round(area * 100) / 100)} m²`, wall: "", qty: 1, unit: "Satz", note: "" });
  }
  const plinth = kitchen.parts.filter((p) => /-plinth$/.test(p.id)).reduce((s, p) => s + p.size[0], 0);
  if (plinth) add({ group: "Rückwand & Blenden", label: "Sockelblende", detail: `Höhe ${fmtCm(c1(d.plinth))} cm`, size: `${fmtCm(Math.round(plinth * 100))} cm`, wall: "", unit: "lfm", note: "" });
  const fill = kitchen.parts.filter((p) => /-(filler|gap\d+)$/.test(p.id));
  for (const f of fill) add({ group: "Rückwand & Blenden", label: "Passblende", detail: front, size: `${fmtCm(c1(f.size[0]))} × ${fmtCm(c1(f.size[1]))}`, wall: wallName(f.local.wall), note: "" });
  const wangen = kitchen.parts.filter((p) => /-(wange[SELR]\d*)$/.test(p.id));
  if (wangen.length) add({ group: "Rückwand & Blenden", label: `Wangen (${PANELS[plan.panels]?.label || "Wasserfall"})`, detail: "", size: `${wangen.length} Stk`, wall: "", qty: wangen.length, note: "" });
  if (kitchen.parts.some((p) => p.id === "i-barTop")) add({ group: "Arbeitsplatten", label: "Barplatte auf der Sitzseite", detail: `Höhe ca. 108 cm (Richtmaß)`, size: `${fmtCm(plan.island.len)} cm`, wall: wallName("i"), note: "" });
  const led = kitchen.parts.filter((p) => /-led$/.test(p.id)).reduce((s, p) => s + p.size[0], 0);
  if (led) add({ group: "Licht", label: "Unterbau-LED (warmweiß)", detail: "mit Trafo und Schalter", size: `${fmtCm(Math.round(led * 100))} cm`, wall: "", unit: "lfm", note: "" });
  if (plan.pend) add({ group: "Licht", label: "Pendelleuchte", detail: "Modell nach Wahl", size: "", wall: kitchen.island ? wallName("i") : "Wand A", qty: plan.pend, note: "" });
  // Geräte
  const appl = floor.filter((m) => MODULES[m.t].appliance);
  for (const m of appl) {
    const def = MODULES[m.t];
    const what =
      m.t === "kochfeld"
        ? `Kochfeld ${MODULES.kochfeld.opts.k.values[opt(m, "k")]} + Abzug ${MODULES.kochfeld.opts.a.values[opt(m, "a")]}`
        : m.t === "spuele"
          ? `Spüle (${MODULES.spuele.opts.b.values[opt(m, "b")]}) + Armatur`
          : def.name;
    const item = plan.runs?.[m.wall]?.[m.i];
    if (!item?.d?.some(Boolean)) {
      add({ group: "Geräte (Modell nach Wahl)", label: what, detail: "Gerätemodell im Gespräch", size: "", wall: wallName(m.wall), note: "", id: m.id });
      continue;
    }
    geraeteSlots(item).forEach((s, k) => {
      const slug = item.d[k];
      const g = slug && gmap ? gmap.get(slug) : null;
      if (!slug) return add({ group: "Geräte (Modell nach Wahl)", label: s.label, detail: "Gerätemodell im Gespräch", size: "", wall: wallName(m.wall), note: "", id: m.id });
      const r = g ? pruefeGeraet(s, g, plan) : { status: "passtNicht", gruende: [gmap ? "Gerät nicht mehr im Katalog" : "Katalogdaten nicht geladen"] };
      const dims = g && g.b != null && g.h != null ? `Gerät ${[g.b, g.h, g.t].filter((x) => x != null).map(fmtCm).join(" × ")} cm (laut Hersteller)` : "";
      add({
        group: "Geräte (Katalogauswahl)",
        label: `${s.label}: ${g ? `${g.mn} ${g.n}` : slug}`,
        detail: [g?.se, g?.nx ? `Nische laut Katalog: ${g.nx}` : ""].filter(Boolean).join(" · "),
        size: dims,
        wall: wallName(m.wall),
        note: r.status === "passtNicht" ? `Passt nicht: ${r.gruende[0]}` : GERAET_STATUS[r.status] || r.gruende[0] || "",
        href: geraetHref(slug),
        status: r.status,
        id: m.id,
      });
    });
  }
  return { rows, count: rows.length };
}
