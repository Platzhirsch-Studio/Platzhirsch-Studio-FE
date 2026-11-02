// Küchenplaner – Kollisionsprüfung und Ergonomie-Hinweise.
// Eingabe: Plan + buildKitchen(plan). Ausgabe: { items, metrics }.
// items: { level: "error" | "warn" | "hint" | "ok", cat, text, ids?, source? }
// Regeln und Quellen: norms.js. Alles rein rechnerisch (Grundriss in m).
import { MODULES } from "../../components/Labs/Kuechenplaner/catalog.js";
import { RULES, SOURCES, worktopRange } from "./norms.js";
import { opt } from "./options.js";
import { pointInRoom, runExtent } from "./room.js";

const r0 = (n) => Math.round(n);

// ---- Geometrie: Überlappung konvexer Vierecke (Trennachsen-Satz) ----
function axes(q) {
  const out = [];
  for (let i = 0; i < q.length; i++) {
    const [x1, z1] = q[i];
    const [x2, z2] = q[(i + 1) % q.length];
    out.push([-(z2 - z1), x2 - x1]);
  }
  return out;
}
function project(q, [ax, az]) {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, z] of q) {
    const p = (x * ax + z * az) / (Math.hypot(ax, az) || 1);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return [min, max];
}
/** Überlappen sich zwei konvexe Vierecke um mehr als `tol` (m)? */
export function quadsOverlap(a, b, tol = 0.005) {
  for (const ax of [...axes(a), ...axes(b)]) {
    const [a0, a1] = project(a, ax);
    const [b0, b1] = project(b, ax);
    if (a1 - tol <= b0 || b1 - tol <= a0) return false;
  }
  return true;
}
const yOverlap = (a, b) => a.y0 < b.y1 - 0.01 && b.y0 < a.y1 - 0.01;
const center = (q) => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
const frontMid = (m) => [(m.quad[2][0] + m.quad[3][0]) / 2, (m.quad[2][1] + m.quad[3][1]) / 2];
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

function name(plan, m) {
  const where = m.wall === "i" ? (plan.shape === "halbinsel" ? "Halbinsel" : "Insel") : `Wand ${m.wall.toUpperCase()}`;
  return `${MODULES[m.t]?.name || m.t} (${where}, Pos. ${m.i + 1})`;
}

export function runChecks(plan, kitchen) {
  const items = [];
  const push = (level, cat, text, ids = [], source = null) => items.push({ level, cat, text, ids, source });
  const d = kitchen.dims;
  const mods = kitchen.mods;
  const floor = mods.filter((m) => m.kind !== "upper");

  // 1) Überhang (aus buildKitchen) und Dachschräge
  // Gang-Warnung der Geometrie ersetzt die genauere Gangprüfung unten (Punkt 8)
  for (const w of kitchen.warnings.filter((x) => !/^Gang zwischen Zeile und Insel/.test(x))) push(/zu lang/.test(w) ? "error" : "warn", /zu lang/.test(w) ? "kollision" : "ergonomie", w);
  for (const m of mods) {
    if (m.slopeHit) push("error", "kollision", `${name(plan, m)} ragt in die Dachschräge – niedrigere Ausführung oder andere Wand wählen.`, [m.id]);
    else if (m.over && m.kind !== "upper") push("error", "kollision", `${name(plan, m)} liegt außerhalb der nutzbaren Wandlänge.`, [m.id]);
  }

  // 2) Überlappende Möbel (andere Wand, Insel, Ecke)
  for (let i = 0; i < mods.length; i++) {
    for (let j = i + 1; j < mods.length; j++) {
      const a = mods[i];
      const b = mods[j];
      if (a.wall === b.wall) continue;
      if (!yOverlap(a, b)) continue;
      if (quadsOverlap(a.quad, b.quad, 0.01)) push("error", "kollision", `${name(plan, a)} und ${name(plan, b)} überschneiden sich.`, [a.id, b.id]);
    }
  }

  // 3) Öffnungsraum vor Auszügen und Türen
  const blockedPairs = new Set();
  for (const m of floor) {
    const clear = MODULES[m.t]?.clear || 0;
    if (!clear || !m.frontQuad) continue;
    for (const o of floor) {
      if (o === m || !yOverlap(m, o)) continue;
      if (quadsOverlap(m.frontQuad, o.quad, 0.01)) {
        const blind = m.corner && MODULES[m.t].kind === "base";
        push(
          "error",
          "kollision",
          blind
            ? `${name(plan, m)} steht in der Ecke hinter ${name(plan, o)} – die Front lässt sich nicht öffnen. Eckschrank (LeMans oder Karussell) wählen.`
            : `${MODULES[m.t].kind === "tall" ? "Türen" : "Auszüge"} von ${name(plan, m)} stoßen an ${name(plan, o)}.`,
          [m.id, o.id],
        );
      }
    }
  }
  // Türen der Hängeschränke (Ecke): Eck-Hängeschrank gegen Nachbarzeile bzw. Hochschrank
  for (const m of mods) {
    if (m.kind !== "upper" || !m.frontQuad) continue;
    for (const o of mods) {
      if (o === m || o.wall === m.wall || (o.kind !== "upper" && o.kind !== "tall") || !yOverlap(m, o)) continue;
      if (quadsOverlap(m.frontQuad, o.quad, 0.01)) {
        push("error", "kollision", `Tür von ${name(plan, m)} stößt an ${name(plan, o)} – in der Ecke Eck-Hängeschrank mit Blindecke oder Passblende planen.`, [m.id, o.id]);
      }
    }
  }
  for (let i = 0; i < floor.length; i++) {
    for (let j = i + 1; j < floor.length; j++) {
      const a = floor[i];
      const b = floor[j];
      if (a.wall === b.wall || !a.frontQuad || !b.frontQuad || !MODULES[a.t].clear || !MODULES[b.t].clear) continue;
      const key = `${a.id}|${b.id}`;
      if (blockedPairs.has(key)) continue;
      if (quadsOverlap(a.frontQuad, b.frontQuad, 0.02)) {
        blockedPairs.add(key);
        push(a.t === "geschirrspueler" || b.t === "geschirrspueler" ? "warn" : "hint", "kollision", `${name(plan, a)} und ${name(plan, b)} behindern sich beim gleichzeitigen Öffnen (Ecke) – Griffe prüfen oder Passstück 5–10 cm einplanen.`, [a.id, b.id]);
      }
    }
  }

  // 4) Öffnungen und Anschlüsse
  const ops = kitchen.openings || [];
  for (const o of ops) {
    const onWall = mods.filter((m) => m.wall === o.w && m.x0 !== undefined);
    const hits = onWall.filter((m) => m.x0 / 100 < o.u1 - 0.005 && m.x1 / 100 > o.u0 + 0.005);
    if (o.k === "tuer") {
      for (const m of hits) push("error", "kollision", `${name(plan, m)} steht vor der Tür.`, [m.id]);
      // Türflügel schlägt in den Raum (Quadrat Türbreite × Türbreite vor der Tür)
      const f = kitchen.frames[o.w];
      if (f) {
        const W = (u, v) => [f.origin[0] + f.u[0] * u + f.v[0] * v, f.origin[1] + f.u[1] * u + f.v[1] * v];
        const sw = (o.b / 100) * 0.95;
        const zone = [W(o.u0 + 0.02, 0.02), W(o.u1 - 0.02, 0.02), W(o.u1 - 0.02, sw), W(o.u0 + 0.02, sw)];
        for (const m of floor) if (m.wall !== o.w && quadsOverlap(zone, m.quad, 0.01)) push("error", "kollision", `Die Tür schlägt gegen ${name(plan, m)} – Anschlag ändern oder Abstand halten.`, [m.id]);
      }
    }
    if (o.k === "fenster") {
      for (const m of hits) {
        if (m.kind === "tall") push("error", "kollision", `${name(plan, m)} steht vor dem Fenster.`, [m.id]);
        else if (m.kind === "upper" && o.y1 > m.y0) push("error", "kollision", `${name(plan, m)} hängt vor dem Fenster.`, [m.id]);
        else if (m.kind === "base" && o.y0 < d.topY + 0.01) push("warn", "kollision", `Fensterbank (${r0(o.y)} cm) liegt unter der Arbeitsplatte (${r0(d.topY * 100)} cm) bei ${name(plan, m)}.`, [m.id]);
        if (m.t === "kochfeld") {
          push("warn", "ergonomie", `Kochfeld unter dem Fenster (${name(plan, m)}): Vorhänge und Fensterflügel prüfen, eine Wandhaube ist dort nicht möglich.`, [m.id]);
          if (opt(m, "a") === "w") push("error", "kollision", `Wandhaube vor dem Fenster bei ${name(plan, m)}.`, [m.id]);
        }
      }
    }
    if (o.k === "heizung") for (const m of hits) if (m.kind !== "upper") push("warn", "kollision", `Heizkörper hinter ${name(plan, m)} – Heizkörper versetzen oder Möbel verschieben.`, [m.id]);
    if (o.k === "steckdose") for (const m of hits) if (m.kind === "tall") push("hint", "anschluss", `Steckdose hinter ${name(plan, m)} – nur für das Gerät dort nutzbar.`, [m.id]);
  }
  const conn = (k) => ops.filter((o) => o.k === k);
  const sinks = floor.filter((m) => m.t === "spuele");
  const hobs = floor.filter((m) => m.t === "kochfeld");
  if (conn("wasser").length) {
    for (const m of sinks) {
      const best = Math.min(...conn("wasser").map((o) => (o.w === m.wall ? Math.abs((o.u0 + o.u1) / 2 - (m.x0 + m.x1) / 200) : Infinity)));
      if (best > 1.2) push("warn", "anschluss", `${name(plan, m)}: ${best === Infinity ? "kein Wasseranschluss an dieser Wand" : `${r0(best * 100)} cm bis zum Wasseranschluss`} – Leitung verlegen oder Spüle verschieben.`, [m.id]);
      else push("ok", "anschluss", `${name(plan, m)} liegt am Wasseranschluss (${r0(best * 100)} cm).`, [m.id]);
    }
  }
  if (conn("starkstrom").length) {
    for (const m of hobs) {
      const best = Math.min(...conn("starkstrom").map((o) => dist(center([o.p0, o.p1, o.p1, o.p0]), frontMid(m))));
      if (best > 2) push("warn", "anschluss", `${name(plan, m)}: Herdanschluss ${r0(best * 100)} cm entfernt.`, [m.id]);
    }
  }
  // Abzug wie geometry.js/hoodType auflösen („automatisch“ → Flachschirm bei Hängeschränken,
  // sonst und auf der Insel Muldenlüfter) und prüfen, ob die Haube wirklich gebaut werden kann.
  const upMode = (w) => plan.up?.[w]?.m || (plan.wallCabinets ? "auto" : "aus");
  const hoodOf = (m) => {
    const a = opt(m, "a");
    if (a && a !== "a") return a;
    if (m.island) return "m";
    return upMode(m.wall) !== "aus" ? "f" : "m";
  };
  const uppers = mods.filter((m) => m.kind === "upper");
  const above = (k) => uppers.filter((u) => u.wall === k.wall && u.x0 < k.x1 - 0.5 && u.x1 > k.x0 + 0.5);
  const windowAbove = (k) => ops.some((o) => o.k === "fenster" && o.w === k.wall && k.x0 / 100 < o.u1 - 0.005 && k.x1 / 100 > o.u0 + 0.005);
  if (hobs.length) {
    if (!conn("abluft").length) push("hint", "anschluss", "Kein Abluft-Mauerkasten eingetragen: Dunstabzug im Umluftbetrieb planen (oder Mauerkasten unter Raum → Öffnungen eintragen).");
    for (const m of hobs) {
      const h = hoodOf(m);
      const rule = opt(m, "k") === "g" ? RULES.hoodGas : RULES.hoodElectric;
      const where = plan.shape === "halbinsel" ? "Halbinsel" : "Insel";
      if (h === "n") {
        push("warn", "ergonomie", `${name(plan, m)} ohne Dunstabzug.`, [m.id]);
      } else if (m.island && (h === "w" || h === "f")) {
        push("error", "kollision", `${name(plan, m)}: ${h === "w" ? "Wandhaube" : "Flachschirmhaube"} ist auf der ${where} nicht möglich – Muldenlüfter, Inselhaube oder Deckenlüfter wählen.`, [m.id]);
      } else if (!m.island && h === "i") {
        push("warn", "ergonomie", `${name(plan, m)}: Inselhaube an der Wand – Wandhaube, Flachschirm oder Muldenlüfter wählen.`, [m.id]);
      } else if (h === "f" && !above(m).some((u) => u.t === "luefterhs")) {
        if (windowAbove(m)) push("error", "kollision", `${name(plan, m)}: Über dem Kochfeld liegt ein Fenster – dort passt keine Flachschirmhaube. Muldenlüfter wählen oder Kochfeld verschieben.`, [m.id]);
        else push("warn", "ergonomie", `${name(plan, m)}: Kein Haubenschrank darüber – Hängeschrank mit Flachschirmhaube setzen oder einen anderen Abzug wählen.`, [m.id]);
      } else if (h === "m") {
        push("ok", "maß", `Muldenlüfter bei ${name(plan, m)}: Abzug nach unten, keine Haube über dem Kochfeld. Platz im Unterschrank und Abluft/Umluft nach Gerät planen.`, [m.id]);
      } else if (h === "d") {
        push("ok", "maß", `Deckenlüfter über ${name(plan, m)}: Abstand und Leistung nach Raumhöhe und Gerät planen.`, [m.id]);
      } else {
        // Unterkante wie in geometry.js gebaut: Flachschirm im Haubenschrank, Wandhaube 65 cm, Inselhaube 70 cm
        const hs = above(m).find((u) => u.t === "luefterhs");
        const gap = r0(((h === "f" && hs ? hs.y0 : d.topY + (h === "i" ? 0.7 : 0.65)) - d.topY) * 100);
        if (gap < rule.value) push("warn", "maß", `Haube über ${name(plan, m)}: Unterkante ${gap} cm über der Platte – mindestens ${rule.value} cm laut Hersteller-Richtwert.`, [m.id], rule.source);
        else push("ok", "maß", `Haube über ${name(plan, m)}: Unterkante ${gap} cm über der Platte (mindestens ${rule.value} cm laut Hersteller-Richtwert, Gerät prüfen).`, [m.id], rule.source);
      }
      // Hängeschrank oder Wandbord direkt über dem Kochfeld: nicht tiefer als der Haubenabstand
      for (const u of above(m)) {
        if (u.t === "luefterhs") continue;
        const gap = r0((u.y0 - d.topY) * 100);
        if (gap < rule.value) push("warn", "ergonomie", `${MODULES[u.t]?.name || u.t} (Wand ${u.wall.toUpperCase()}) hängt nur ${gap} cm über ${name(plan, m)} – Hitze und Dampf: mindestens ${rule.value} cm (wie der Haubenabstand) oder Haubenschrank bzw. Lücke wählen.`, [u.id, m.id], rule.source);
      }
    }
  }

  // 5) Ergonomie: Arbeitshöhe
  const wr = worktopRange(plan.ergo.body);
  const h = Math.round(d.topY * 1000) / 10;
  if (h < wr.min - 1 || h > wr.max + 1) {
    push("warn", "ergonomie", `Arbeitshöhe ${h} cm – für ${plan.ergo.body} cm Körpergröße empfohlen ${wr.min}–${wr.max} cm (10–15 cm unter dem Ellenbogen, ca. ${wr.elbow} cm). Sockel oder Korpus anpassen.`, [], wr.source);
  } else {
    push("ok", "ergonomie", `Arbeitshöhe ${h} cm passt zu ${plan.ergo.body} cm Körpergröße (empfohlen ${wr.min}–${wr.max} cm).`, [], wr.source);
  }
  const ug = plan.ergo.upGap;
  if (ug < RULES.upGap.min || ug > RULES.upGap.max) push("hint", "ergonomie", `Hängeschränke ${ug} cm über der Platte – üblich sind ${RULES.upGap.min}–${RULES.upGap.max} cm.`);

  // 6) Arbeitsdreieck Spüle – Kochfeld – Kühlschrank
  const fridges = floor.filter((m) => m.t === "kuehlschrank" || m.t === "sidebyside");
  let triangle = null;
  if (sinks.length && hobs.length && fridges.length) {
    const s = frontMid(sinks[0]);
    const k = frontMid(hobs[0]);
    const f = frontMid(fridges[0]);
    const legs = [dist(s, k), dist(k, f), dist(f, s)].map((x) => r0(x * 100));
    const sum = legs.reduce((a, b) => a + b, 0);
    triangle = { pts: [s, k, f], legs, sum };
    const bad = legs.filter((l) => l < RULES.triangleLeg.min || l > RULES.triangleLeg.max);
    // Fix 1, P2-1: Liegen alle drei an derselben Wand (Küchenzeile), ist ein echtes
    // Dreieck geometrisch nicht möglich (Quelle: SOURCES.dreieck) – dann nur Hinweis.
    const oneLine = sinks[0].wall === hobs[0].wall && hobs[0].wall === fridges[0].wall;
    const lvl = bad.length || sum > RULES.triangleSum.max ? (oneLine ? "hint" : "warn") : "ok";
    push(
      lvl,
      "ergonomie",
      `Arbeitsdreieck: Spüle–Kochfeld ${legs[0]} cm, Kochfeld–Kühlschrank ${legs[1]} cm, Kühlschrank–Spüle ${legs[2]} cm, zusammen ${sum} cm (Richtwert je Seite 120–270 cm, Summe bis 790 cm).${lvl === "hint" ? " Alle drei liegen an einer Wand: Ein echtes Dreieck ist hier geometrisch nicht möglich, gut ist die Spüle zwischen Kühlschrank und Kochfeld." : ""}`,
      [sinks[0].id, hobs[0].id, fridges[0].id],
      SOURCES.dreieck,
    );
  } else {
    push("hint", "ergonomie", "Für das Arbeitsdreieck fehlen Spüle, Kochfeld oder Kühlschrank.");
  }

  // 7) Arbeitsfläche zwischen Spüle und Kochfeld, Abstellfläche neben dem Kochfeld
  for (const k of hobs) {
    const s = sinks.find((x) => x.wall === k.wall);
    const run = (kitchen.runs[k.wall] || []).slice().sort((a, b) => a.x0 - b.x0);
    if (s) {
      const [l, r] = s.x1 <= k.x0 ? [s, k] : [k, s];
      const between = run.filter((m) => m.x0 >= l.x1 - 0.1 && m.x1 <= r.x0 + 0.1);
      const tallIn = between.some((m) => MODULES[m.t].kind === "tall");
      const free = r.x0 - l.x1;
      if (tallIn) push("warn", "ergonomie", `Ein Hochschrank unterbricht die Arbeitsfläche zwischen Spüle und Kochfeld (Wand ${k.wall.toUpperCase()}).`, [k.id, s.id]);
      else if (free < RULES.prepZone.min) push("warn", "ergonomie", `Zwischen Spüle und Kochfeld bleiben nur ${r0(free)} cm Arbeitsfläche – mindestens ${RULES.prepZone.min}, besser ${RULES.prepZone.good} cm.`, [k.id, s.id]);
      else push("ok", "ergonomie", `Hauptarbeitsfläche zwischen Spüle und Kochfeld: ${r0(free)} cm.`, [k.id, s.id]);
    }
    // Abstellfläche links/rechts bis zum nächsten Hochschrank oder Zeilenende
    const ext = k.wall === "i" ? { start: 0, length: plan.island.len } : runExtent(plan, k.wall);
    const sideFree = (dir) => {
      let pos = dir < 0 ? k.x0 : k.x1;
      const ordered = dir < 0 ? run.filter((m) => m.x1 <= k.x0 + 0.1).reverse() : run.filter((m) => m.x0 >= k.x1 - 0.1);
      for (const m of ordered) {
        if (Math.abs((dir < 0 ? m.x1 : m.x0) - pos) > 0.5) break;
        if (MODULES[m.t].kind === "tall") break;
        pos = dir < 0 ? m.x0 : m.x1;
      }
      return dir < 0 ? k.x0 - pos : pos - k.x1;
    };
    void ext;
    const left = sideFree(-1);
    const right = sideFree(1);
    if (Math.min(left, right) < RULES.hobSide.min) push("warn", "ergonomie", `Neben ${name(plan, k)} bleiben ${r0(Math.min(left, right))} cm Abstellfläche – mindestens ${RULES.hobSide.min} cm auf beiden Seiten einplanen.`, [k.id]);
    // Kochfeld direkt neben Kühlschrank
    const nb = run.filter((m) => Math.abs(m.x1 - k.x0) < 0.5 || Math.abs(m.x0 - k.x1) < 0.5);
    if (nb.some((m) => m.t === "kuehlschrank" || m.t === "sidebyside")) push("hint", "ergonomie", `${name(plan, k)} steht direkt neben dem Kühlschrank – Wärme; besser einen Schrank dazwischen.`, [k.id]);
  }
  // Fix 2 (P2-4): Geschirrspüler neben der Spüle (übliche Planungsregel,
  // Planungsannahme wie bei IKEA/Nobilia-Planern, keine Norm gefunden – daher ohne Quelle). Direkt daneben = ok, ein Modul (≤ 60 cm) dazwischen = Hinweis (hint),
  // weiter weg oder an einer anderen Wand = Hinweis ocker (warn).
  const dws = floor.filter((m) => m.t === "geschirrspueler");
  if (sinks.length && dws.length) {
    const gapTo = (s, m) => (m.wall === s.wall ? Math.max(0, Math.max(m.x0 - s.x1, s.x0 - m.x1)) : Infinity);
    for (const s of sinks) {
      const best = dws.reduce((b, m) => (gapTo(s, m) < b.g ? { m, g: gapTo(s, m) } : b), { m: null, g: Infinity });
      if (best.g <= 1) push("ok", "ergonomie", `Geschirrspüler direkt neben ${name(plan, s)}.`, [s.id, best.m.id], null);
      else if (best.g <= 60.5) push("hint", "ergonomie", `Geschirrspüler ${r0(best.g)} cm neben ${name(plan, s)} – direkt daneben ist bequemer (Abtropfen, kurzer Abwasserweg).`, [s.id, best.m.id], null);
      else push("warn", "ergonomie", `Geschirrspüler nicht neben ${name(plan, s)}${best.g === Infinity ? " (andere Wand)" : ` (${r0(best.g)} cm entfernt)`} – direkt neben die Spüle stellen, höchstens ein Modul Abstand.`, [s.id, ...(best.m ? [best.m.id] : dws.map((m) => m.id))], null);
    }
  }
  // Nischenhöhe des Geschirrspülers (Boden bis Unterkante Platte = Sockel + Korpus).
  // Hohe Arbeitsplatten ergeben schnell Nischen über dem Bereich üblicher 60-cm-Geräte. Über dem
  // Bereich nur „hint“: Es gibt nur ein Herstellerbeispiel, andere Marken können mehr – Gerät prüfen.
  if (dws.length) {
    const nhv = Math.round((d.topY - d.topT) * 1000) / 10;
    const de = (n) => String(n).replace(".", ",");
    const nh = de(nhv);
    const std = RULES.dwNiche;
    const high = RULES.dwNicheHigh;
    const ids = dws.map((m) => m.id);
    if (plan.raster === 55) push("hint", "maß", `Geschirrspüler im 55-cm-Raster (SMS): Nischenhöhe ${nh} cm mit dem gewählten SMS-Gerät abgleichen.`, ids, SOURCES.sms);
    else if (nhv > high.max + 0.01) push("hint", "maß", `Geschirrspüler: Nische ${nh} cm hoch (Sockel + Korpus) – das Beispielgerät für hohe Nischen reicht bis ${de(high.max)} cm. Sockel um ${Math.ceil(nhv - high.max)} cm senken oder Gerät mit passender Nische wählen.`, ids, high.source);
    else if (nhv > std.max + 0.01) push("hint", "maß", `Geschirrspüler: Nische ${nh} cm hoch – dafür braucht es ein Gerät für hohe Nischen (Beispiel ${de(high.min)}–${de(high.max)} cm).`, ids, high.source);
    else if (nhv < std.min - 0.01) push("warn", "maß", `Geschirrspüler: Nische nur ${nh} cm hoch – übliche 60-cm-Geräte brauchen mindestens ${de(std.min)} cm. Sockel erhöhen oder Korpus 78 cm wählen.`, ids, std.source);
    else push("ok", "maß", `Geschirrspüler: Nische ${nh} cm hoch – passt zu üblichen 60-cm-Geräten (${de(std.min)}–${de(std.max)} cm, Gerät prüfen).`, ids, std.source);
  }
  // Fix 2 (P2-6): fehlende Grundausstattung deutlich melden (z. B. nach dem Verkleinern einer Wand)
  if (!sinks.length) push("warn", "ergonomie", "Keine Spüle geplant – Spüle aus der Modul-Leiste einfügen oder eine Wand verlängern.");
  if (!hobs.length) push("warn", "ergonomie", "Kein Kochfeld geplant – Kochfeld einfügen (Wand oder Insel) oder eine Wand verlängern.");

  // 8) Gänge
  const aisle = (val, label, ids = []) => {
    if (val < RULES.aisleOne.value) push("error", "ergonomie", `${label}: ${r0(val)} cm – unter ${RULES.aisleOne.value} cm ist der Gang zu eng.`, ids, RULES.aisleOne.source);
    else if (val < RULES.aisleTwo.value) push("warn", "ergonomie", `${label}: ${r0(val)} cm – für zwei Personen sind ${RULES.aisleTwo.value} cm empfohlen.`, ids, RULES.aisleTwo.source);
    else push("ok", "ergonomie", `${label}: ${r0(val)} cm.`, ids, RULES.aisleTwo.source);
  };
  if (plan.shape === "u" || plan.shape === "zweizeilig") {
    const bHas = (plan.runs.b || []).length;
    const cHas = (plan.runs.c || []).length;
    if (bHas && cHas) aisle(plan.walls.a - 120, "Gang zwischen Wand B und Wand C");
  }
  if (plan.shape === "insel" || plan.shape === "halbinsel") {
    aisle(plan.island.aisle, "Gang zwischen Zeile und Insel");
    if (plan.shape === "insel") {
      const back = plan.walls.b - (60 + plan.island.aisle + plan.island.depth);
      if (back >= 80) push("ok", "ergonomie", `Hinter der Insel: ${r0(back)} cm Durchgang${plan.island.bar || plan.island.over >= 25 ? " (Sitzplätze: 80 cm sind knapp, besser 100 cm)" : ""}.`);
    }
    // Insel/Halbinsel mit Kochfeld oder Spüle: Korpustiefe und Platte hinter dem Kochfeld
    const body = plan.island.depth - plan.island.over;
    for (const m of floor.filter((x) => x.wall === "i" && (x.t === "kochfeld" || x.t === "spuele"))) {
      if (body < RULES.islandBody.min) push("warn", "maß", `${name(plan, m)}: Unter dem Überstand bleiben nur ${r0(body)} cm Korpustiefe – Kochfeld und Spüle brauchen ${RULES.islandBody.min} cm. Insel tiefer planen oder Überstand verkleinern.`, [m.id]);
      // Kochfeld liegt 5 cm vor der Sitzseite des Korpus (geometry.js) – dahinter nur Überstand + 5 cm
      const behind = plan.island.over + 5;
      if (m.t === "kochfeld" && !plan.island.bar && behind < RULES.islandBehindHob.min) {
        push("warn", "ergonomie", `${name(plan, m)}: Hinter dem Kochfeld bleiben ${r0(behind)} cm Platte – mindestens ${RULES.islandBehindHob.min} cm als Spritz- und Verbrennungsschutz zur anderen Seite, oder Barplatte als Aufkantung.`, [m.id], RULES.islandBehindHob.source);
      }
    }
    // Insel ragt seitlich über die Küchenzeile/den Raum hinaus (Verschieben, Länge)
    if (kitchen.island) {
      const W = plan.walls.a / 100;
      const { x0, len } = kitchen.island;
      if (x0 < -0.005 || x0 + len > W + 0.005) push("warn", "kollision", `${plan.shape === "halbinsel" ? "Halbinsel" : "Insel"} ragt ${r0(Math.max(-x0, x0 + len - W) * 100)} cm seitlich über die Raumbreite (Wand A ${r0(plan.walls.a)} cm) hinaus – kürzer planen oder zurückschieben.`);
    }
  }
  if (plan.shape === "frei" && kitchen.island) {
    const { x0, len, z0 } = kitchen.island;
    const corners4 = [[x0, z0], [x0 + len, z0], [x0, z0 + 0.6], [x0 + len, z0 + 0.6]];
    if (corners4.some(([x, z]) => !pointInRoom(plan, x, z))) push("error", "kollision", "Die Insel liegt außerhalb des Raums.");
  }

  // 9) Türanschläge an der Wand, Eckschränke, fehlende Maße
  for (const m of floor) {
    const def = MODULES[m.t];
    if (m.wall !== "i" && def.kind === "tall" && def.opts?.h) {
      const ext = runExtent(plan, m.wall);
      const hingeAtU1 = (opt(m, "h") === "r") === (m.frame.rs > 0);
      const nearStart = m.x0 - ext.start < RULES.hingeClear.value;
      const nearEnd = ext.start + ext.length - m.x1 < RULES.hingeClear.value;
      const wallAtStart = plan.shape === "frei" || (m.wall === "a" && ["l", "u", "zweizeilig", "halbinsel"].includes(plan.shape)) || (m.wall !== "a" && plan.shape === "zweizeilig");
      const wallAtEnd = plan.shape === "frei" || (m.wall === "a" && (plan.shape === "u" || plan.shape === "zweizeilig"));
      if ((hingeAtU1 && nearEnd && wallAtEnd) || (!hingeAtU1 && nearStart && wallAtStart)) {
        push("warn", "ergonomie", `${name(plan, m)}: Türanschlag zur Wand – die Tür öffnet nur bis etwa 90°. Anschlag wechseln oder Passblende ≥ ${RULES.hingeClear.value} cm einplanen.`, [m.id]);
      }
    }
    if (m.t === "unterschrank" && m.corner && m.w > 80) push("hint", "ergonomie", `${name(plan, m)} ist eine Blindecke – mit Eckschrank LeMans oder Karussell wird die Ecke voll nutzbar.`, [m.id]);
    if (m.t === "eckschrank") {
      if (!m.corner) push("hint", "maß", `${name(plan, m)} steht nicht in einer Ecke – normaler Unterschrank genügt.`, [m.id]);
      const mech = opt(m, "m");
      if (mech === "k" && m.w !== 90 && m.w !== 82.5) push("warn", "maß", `Karussell braucht einen L-Eckschrank 90/90 – Breite auf 90 cm stellen.`, [m.id]);
      if (mech === "l" && m.w < 100) push("warn", "maß", `LeMans braucht mindestens 100 cm Schrankbreite (40 cm Öffnung).`, [m.id]);
    }
    // Side-by-Side integriert = zwei Kühlnischen nebeneinander: braucht zwei Rasterbreiten (2 × 60 bzw. 2 × 55 cm)
    if (m.t === "sidebyside" && opt(m, "s") !== "f" && m.w < 2 * plan.raster - 0.01) {
      push("warn", "maß", `${name(plan, m)}: Integriert sind das zwei Kühlnischen nebeneinander – dafür ${2 * plan.raster} cm Breite einplanen (jetzt ${r0(m.w)} cm) oder „freistehend“ wählen.`, [m.id], SOURCES.liebherrNische);
    }
    if (def.measure === "fehlt" || (m.t === "sidebyside" && opt(m, "s") === "f")) {
      push("hint", "maß", `${name(plan, m)}: Gerätemaß fehlt – Nische nach dem gewählten Gerätemodell planen.`, [m.id]);
    }
  }
  if (!conn("steckdose").length) push("hint", "anschluss", "Steckdosen eintragen (Raum → Öffnungen & Anschlüsse), damit wir sie mit den Hängeschränken und der Rückwand abstimmen.");

  // Doppelte Meldungen entfernen
  const seen = new Set();
  const uniq = items.filter((i) => (seen.has(i.text) ? false : (seen.add(i.text), true)));
  const order = { error: 0, warn: 1, hint: 2, ok: 3 };
  uniq.sort((a, b) => order[a.level] - order[b.level]);
  const bad = new Set(uniq.filter((i) => i.level === "error").flatMap((i) => i.ids));
  const warnIds = new Set(uniq.filter((i) => i.level === "warn").flatMap((i) => i.ids));
  return {
    items: uniq,
    errorIds: bad,
    warnIds,
    counts: { error: uniq.filter((i) => i.level === "error").length, warn: uniq.filter((i) => i.level === "warn").length, hint: uniq.filter((i) => i.level === "hint").length },
    metrics: { triangle, worktop: { height: h, ...wr } },
  };
}
