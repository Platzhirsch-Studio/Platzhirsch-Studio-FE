// Küchenplaner – rechnet einen Plan in Bauteile (Boxen in Metern) um.
// Wird vom 3D-Renderer (Scene3D), vom 2D-Plan/Editor (PlanView2D), von den
// Bemaßungszeichnungen (Drawings), der Stückliste und den Prüfungen genutzt,
// damit alle immer dieselbe Küche zeigen. Keine three.js-Abhängigkeit.
//
// Pro-Ausbau: Lage aus layout.js (Lücken, freie Planung), beliebige Wände
// (room.js), Ergonomie-Höhen (Sockel, Korpus, Plattenstärke), Optionen je Modul
// (Fronten, Anschlag, Geräte, Eckauszug, Abzug), eigene Hängeschränke,
// Ausschnitte (Unterbau-Spüle), Gehrungskante, Wangen, Rückwand, Barplatte,
// Hauben, Pendelleuchten. Jedes Teil trägt `local` (Wandkoordinaten) für die
// Wandansichten und `quad` (Grundriss-Ecken) für 2D und Kollisionsprüfung.
import { MODULES, SHAPES, WORKTOPS } from "./catalog.js";
import { BASE_DEPTH, activeWalls, runUsed } from "./planState.js";
import { opt } from "../../../lib/kuechenplaner/options.js";
import { placeRun } from "../../../lib/kuechenplaner/layout.js";
import { ceilingAt, cornerClearance, corners, roomBounds, roomWalls, runExtent, wallClearance } from "../../../lib/kuechenplaner/room.js";

const CARCASS_D = 0.58;
const FRONT_T = 0.019;
const GAP = 0.0015; // halbe Fuge: 3 mm zwischen zwei Fronten
const WALL_D = 0.35;
const TALL_GRIP = 0.03; // senkrechte Griffleiste (grifflos) an der Öffnungsseite der Hochschränke

const cm = (v) => v / 100;

/** Maße aus Plan: Sockel, Korpus, Platte, Oberkante, Hängeschrank-Unterkante (m). */
export function dims(plan) {
  const ergo = plan.ergo || { plinth: 10, carcass: 78, upGap: 55 };
  const plinth = cm(ergo.plinth);
  const topT = (plan.topT || WORKTOPS[plan.top]?.thickness * 10 || 20) / 1000;
  const topY = plinth + cm(ergo.carcass) + topT;
  const H = plan.h / 100;
  const tallTop = Math.min(H - 0.02, plan.line === "milano" ? 2.4 : 2.2);
  const upBottom = topY + cm(ergo.upGap ?? 55);
  return { plinth, topT, topY, tallTop, upBottom, H };
}

/** Rahmen einer Wandzeile: Ursprung = Wandanfang, u entlang, v = nach innen. */
function wallFrame(w) {
  const right = [w.n[1], -w.n[0]]; // Blickrichtung −n → rechte Hand
  return { origin: w.p0, u: w.u, v: w.n, rot: w.rot, rs: Math.sign(right[0] * w.u[0] + right[1] * w.u[1]) || 1, wall: w.id };
}

export function islandFrame(plan) {
  const b = roomBounds(plan);
  const len = cm(plan.island.len);
  const carcass = Math.min(CARCASS_D + FRONT_T, cm(plan.island.depth - plan.island.over));
  const z0 = b.minZ + cm(BASE_DEPTH + plan.island.aisle);
  const peninsula = plan.shape === "halbinsel";
  const x0 = peninsula ? b.minX : b.cx - len / 2 + cm(plan.island.x || 0);
  // Fronten zeigen zur Kochzeile (-z); v = 0 ist die Rückseite (Sitzseite).
  return { origin: [x0 + len, z0 + carcass], u: [-1, 0], v: [0, -1], rot: Math.PI, carcass, rs: 1, wall: "i", x0, z0 };
}

const toWorld = (frame, u, v) => [frame.origin[0] + frame.u[0] * u + frame.v[0] * v, frame.origin[1] + frame.u[1] * u + frame.v[1] * v];

/**
 * Builder: Boxen in lokalen Zeilenkoordinaten (u entlang der Zeile, y Höhe,
 * v von der Wand/Rückseite zur Front) anlegen und in Weltkoordinaten umrechnen.
 */
function makeBuilder(frame, parts, tag) {
  return (id, mat, u0, u1, y0, y1, v0, v1, extra = {}) => {
    const uc = (u0 + u1) / 2;
    const vc = (v0 + v1) / 2;
    const [x, z] = toWorld(frame, uc, vc);
    const w = Math.abs(u1 - u0);
    const d = Math.abs(v1 - v0);
    const swap = Math.abs(Math.sin(frame.rot)) > 0.5;
    parts.push({
      id: `${tag}-${id}`,
      mat,
      pos: [x, (y0 + y1) / 2, z],
      size: [w, Math.abs(y1 - y0), d],
      rot: frame.rot,
      foot: { x, z, w: swap ? d : w, d: swap ? w : d },
      quad: [toWorld(frame, u0, v0), toWorld(frame, u1, v0), toWorld(frame, u1, v1), toWorld(frame, u0, v1)],
      local: { wall: frame.wall, u0: Math.min(u0, u1), u1: Math.max(u0, u1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), v0: Math.min(v0, v1), v1: Math.max(v0, v1) },
      ...extra,
    });
  };
}

/** Frontfelder [y0, y1, art] je Modul (ohne Fugen). art: d = Auszug, t = Tür. */
function frontsFor(m, d) {
  const def = MODULES[m.t];
  const a = d.plinth;
  const b = d.topY - d.topT - 0.03;
  const hgt = b - a;
  const tt = d.tallTop;
  if (def.kind === "base") {
    switch (m.t) {
      case "unterschrank": {
        const f = opt(m, "f");
        if (f === "2") return [[a, a + hgt * 0.5, "d"], [a + hgt * 0.5, b, "d"]];
        if (f === "4") return [0, 1, 2, 3].map((k) => [a + (hgt * k) / 4, a + (hgt * (k + 1)) / 4, "d"]);
        if (f === "1") return [[a, b, "d"]];
        if (f === "t") return [[a, b, "t"]];
        if (f === "s") return [[a, b - 0.16, "t"], [b - 0.16, b, "d"]];
        return [[a, a + hgt * 0.38, "d"], [a + hgt * 0.38, a + hgt * 0.76, "d"], [a + hgt * 0.76, b, "d"]];
      }
      case "kochfeld":
        return [[a, a + hgt * 0.5, "d"], [a + hgt * 0.5, b, "d"]];
      case "eckschrank":
        return [[a, a + hgt * 0.5, "d"], [a + hgt * 0.5, b, "d"]];
      case "muell":
        return [[a, b - 0.16, "d"], [b - 0.16, b, "d"]];
      case "backofenus":
        return [[a, b - 0.6, "d"]];
      case "regal":
      case "weinkuehler":
        return [];
      default:
        return [[a, b, m.t === "geschirrspueler" || m.t === "passstueck" ? "p" : "d"]];
    }
  }
  // R2 (R7): Hochschränke mit Fugenbild statt einer flachen Fläche.
  if (m.t === "backofen") {
    const g = opt(m, "g");
    if (g === "d" || g === "m") return [[a, 0.78, "d"], [1.89, tt, "t"]];
    if (g === "2") return [[a, 0.48, "d"], [1.74, tt, "t"]];
    if (g === "w") return [[a, 0.68, "d"], [1.5, tt, "t"]];
    return [[a, 0.47, "d"], [0.47, 0.84, "d"], [1.5, tt, "t"]];
  }
  if (m.t === "kuehlschrank") {
    const k = opt(m, "k");
    if (k === "v" || k === "g") return [[a, 1.88, "t"], [1.88, tt, "t"]];
    if (k === "1") return [[a, 0.84, "d"], [0.84, 2.06, "t"], [2.06, tt, "t"]];
    return [[a, 0.84, "t"], [0.84, tt, "t"]];
  }
  if (m.t === "sidebyside") return opt(m, "s") === "f" ? [] : [[a, tt, "t"]];
  if (m.t === "apotheker") return [[a, tt, "d"]];
  if (m.t === "weinklima") return [];
  const f = opt(m, "f");
  if (f === "2") return [[a, 1.2, "t"], [1.2, tt, "t"]];
  if (f === "i") return [[a, tt, "t"]];
  const mid = Math.min(1.52, tt - 0.3);
  return [[a, 0.47, "d"], [0.47, 0.84, "d"], [0.84, mid, "t"], [mid, tt, "t"]];
}

/** Abzug eines Kochfeld-Moduls (aufgelöst aus „automatisch“). */
export function hoodType(plan, m, island, hasUppers) {
  const a = opt(m, "a");
  if (a && a !== "a") return a;
  if (island) return "m";
  return hasUppers ? "f" : "m";
}

function upperMode(plan, wall) {
  const u = plan.up?.[wall];
  if (u?.m) return u.m;
  return plan.wallCabinets ? "auto" : "aus";
}

/** Fenster/Türen einer Wand in Wandkoordinaten (m). */
function openingsOn(plan, wall) {
  return (plan.room?.op || []).filter((o) => o.w === wall).map((o) => ({ ...o, u0: cm(o.x), u1: cm(o.x + o.b), y0: cm(o.y), y1: cm(o.y + o.h) }));
}

/** Baut alle Teile einer Zeile; gibt Modul-Infos für Prüfung und Stückliste zurück. */
function buildRun({ plan, frame, run, ext, tag, parts, labels, mods, d, island = false, cornerAt = {}, otherFrames = {}, abut = {} }) {
  const add = makeBuilder(frame, parts, tag);
  const carcassD = island ? frame.carcass - FRONT_T : CARCASS_D;
  const frontV = carcassD + FRONT_T;
  const segments = []; // zusammenhängende Abschnitte mit Arbeitsplatte [u0,u1]
  const cuts = []; // Ausschnitte in der Platte [u0,u1,v0,v1]
  const grifflos = plan.grip === "grifflos";
  const push = plan.grip === "push";
  const isMilano = plan.line === "milano";
  const start = cm(ext.start);
  const end = cm(ext.start + ext.length);
  const placed = placeRun(run, ext.start);
  const opens = island ? [] : openingsOn(plan, tag);
  const hasUp = !island && upperMode(plan, tag) !== "aus";
  const topY = d.topY;

  const addSeg = (u0, u1) => {
    const last = segments[segments.length - 1];
    if (last && Math.abs(last[1] - u0) < 0.001) last[1] = u1;
    else segments.push([u0, u1]);
  };

  const handle = (id, u0, u1, y0, y1, kind, tall, hingeRight) => {
    if (grifflos || push) return;
    const len = Math.min(plan.grip === "stange" ? 0.32 : 0.42, y1 - y0 - 0.12);
    if (kind === "t" && (tall || y1 - y0 > 0.5)) {
      // Türen: senkrechter Griff an der Öffnungsseite, auf Greifhöhe
      const gy0 = y0 >= 0.8 ? y0 + 0.08 : y1 - 0.08 - len;
      const atU1 = !hingeRight;
      const gu = atU1 ? u1 - 0.05 : u0 + 0.035;
      add(id, "grip", gu, gu + 0.015, gy0, gy0 + len, frontV, frontV + 0.022);
    } else if (plan.grip === "stange") {
      const w = Math.min(u1 - u0 - 0.1, 0.48);
      const c = (u0 + u1) / 2;
      add(id, "grip", c - w / 2, c + w / 2, y1 - 0.06, y1 - 0.048, frontV + 0.018, frontV + 0.03);
      add(`${id}s`, "grip", c - w / 2 + 0.01, c - w / 2 + 0.02, y1 - 0.058, y1 - 0.05, frontV, frontV + 0.02);
      add(`${id}t`, "grip", c + w / 2 - 0.02, c + w / 2 - 0.01, y1 - 0.058, y1 - 0.05, frontV, frontV + 0.02);
    } else {
      add(id, "grip", u0 + 0.02, u1 - 0.02, y1 - GAP - 0.016, y1 - GAP - 0.004, frontV, frontV + 0.022);
    }
  };

  placed.forEach((m) => {
    const i = m.i;
    const id = `${i}`;
    const def = MODULES[m.t];
    const u0 = cm(m.x0);
    const u1 = cm(m.x1);
    const w = u1 - u0;
    const tall = def.kind === "tall";
    let over = u1 > end + 0.001 || u0 < start - 0.001;
    // Hochschrank oder Hängeschrank in der Dachschräge?
    const [fx, fz] = toWorld(frame, (u0 + u1) / 2, frontV);
    const [bx, bz] = toWorld(frame, (u0 + u1) / 2, 0.02);
    const ceilFront = ceilingAt(plan, fx, fz);
    const ceilBack = ceilingAt(plan, bx, bz);
    const tallTop = Math.min(d.tallTop, d.H - 0.02);
    let slopeHit = tall && Math.min(ceilFront, ceilBack) < tallTop - 0.005;
    const corner = i === 0 && cornerAt.start ? "start" : i === placed.length - 1 && cornerAt.end ? "end" : null;
    // Unterschrank in der Ecke = Blindecke (Front nur am zugänglichen Teil), Eckschrank mit Beschlag
    const isCornerEck = (m.t === "eckschrank" || (m.t === "unterschrank" && m.w > BASE_DEPTH + 20)) && corner;
    const top = tall ? tallTop : topY - d.topT;
    const freeStanding = m.t === "sidebyside" && opt(m, "s") === "f";
    if (over || slopeHit) over = true;
    // Sockel (zurückgesetzt; Premium-Linie mit tiefer Schattenfuge) und Korpus
    if (!freeStanding && m.t !== "passstueck") add(`${id}-plinth`, "plinth", u0, u1, 0, d.plinth, 0, carcassD - (isMilano ? 0.09 : 0.05));
    if (m.t === "passstueck") {
      add(`${id}-plinth`, "plinth", u0, u1, 0, d.plinth, 0, carcassD - (isMilano ? 0.09 : 0.05));
      add(`${id}-body`, over ? "error" : "front", u0 + 0.001, u1 - 0.001, d.plinth, top, carcassD - 0.02, frontV, { module: m.t });
    } else if (freeStanding) {
      add(`${id}-body`, over ? "error" : "steelApp", u0 + 0.005, u1 - 0.005, 0.02, Math.min(1.78, tallTop), 0.02, 0.7, { module: m.t });
      add(`${id}-sbsGap`, "gapShade", (u0 + u1) / 2 - 0.002, (u0 + u1) / 2 + 0.002, 0.04, Math.min(1.76, tallTop), 0.69, 0.702);
      add(`${id}-sbsH1`, "grip", (u0 + u1) / 2 - 0.04, (u0 + u1) / 2 - 0.025, 0.7, 1.4, 0.7, 0.73);
      add(`${id}-sbsH2`, "grip", (u0 + u1) / 2 + 0.025, (u0 + u1) / 2 + 0.04, 0.7, 1.4, 0.7, 0.73);
    } else {
      add(`${id}-body`, over ? "error" : "carcass", u0 + 0.001, u1 - 0.001, d.plinth, top, 0, carcassD, { module: m.t });
      // Dunkle Fläche hinter den Fronten, damit die 3-mm-Fugen als Schattenfugen lesbar sind
      add(`${id}-shade`, "gapShade", u0 + 0.002, u1 - 0.002, d.plinth + 0.002, top - 0.002, carcassD - 0.004, carcassD + 0.001);
    }
    // Fronten (Eckschrank: nur der zugängliche Teil, die Blindecke liegt hinter der Nachbarzeile)
    let fu0 = u0;
    let fu1 = grifflos && tall ? u1 - TALL_GRIP : u1;
    if (isCornerEck) {
      const blind = cm(BASE_DEPTH);
      if (corner === "start") fu0 = u0 + blind;
      else fu1 = u1 - blind;
      add(`${id}-blind`, "front", corner === "start" ? u0 : u1 - blind, corner === "start" ? u0 + blind : u1, d.plinth, topY - d.topT - 0.03, carcassD - 0.01, carcassD);
    }
    if (grifflos && tall && !freeStanding && m.t !== "weinklima") add(`${id}-gv`, isMilano ? "shadowGap" : "groove", fu1, u1, d.plinth, top, carcassD - 0.02, carcassD + 0.002);
    const hingeRight = (opt(m, "h") || "r") === "r" ? frame.rs > 0 : frame.rs < 0;
    for (const [k, [y0, y1, kind]] of frontsFor(m, d).entries()) {
      const fy1 = grifflos && def.kind === "base" ? y1 - 0.035 : y1;
      if (m.t === "passstueck") break;
      add(`${id}-f${k}`, "front", fu0 + GAP, fu1 - GAP, y0 + GAP, Math.min(fy1, top) - GAP, carcassD, frontV);
      if (grifflos) {
        if (def.kind === "base") add(`${id}-g${k}`, isMilano ? "shadowGap" : "groove", u0, u1, fy1, fy1 + 0.033, carcassD - 0.02, carcassD + 0.002);
      } else {
        handle(`${id}-h${k}`, fu0, fu1, y0, y1, tall ? "t" : kind, tall, hingeRight);
      }
    }
    // ---- Geräte und Sonderteile ----
    const oven = (sid, y0, y1, mat = "ovenGlass") => {
      add(`${id}-${sid}Frame`, "steel", u0 + GAP, u1 - GAP, y0, y1, carcassD, frontV + 0.002);
      add(`${id}-${sid}`, mat, u0 + 0.05, u1 - 0.05, y0 + 0.04, y1 - 0.15, frontV + 0.002, frontV + 0.006);
      add(`${id}-${sid}Panel`, "blackGlass", u0 + 0.05, u1 - 0.05, y1 - 0.1, y1 - 0.03, frontV + 0.002, frontV + 0.006);
      add(`${id}-${sid}Display`, "led", (u0 + u1) / 2 - 0.04, (u0 + u1) / 2 + 0.04, y1 - 0.075, y1 - 0.055, frontV + 0.006, frontV + 0.007);
      add(`${id}-${sid}Handle`, "steel", u0 + 0.08, u1 - 0.08, y1 - 0.135, y1 - 0.12, frontV + 0.025, frontV + 0.04);
    };
    if (m.t === "backofen") {
      const g = opt(m, "g");
      if (g === "d" || g === "m") {
        oven("oven", 0.8, 1.4);
        oven("comp", 1.42, 1.87, g === "m" ? "blackGlass" : "ovenGlass");
      } else if (g === "2") {
        oven("oven", 0.5, 1.1);
        oven("oven2", 1.12, 1.72);
      } else if (g === "w") {
        oven("oven", 0.86, 1.48);
        add(`${id}-warm`, "steel", u0 + GAP, u1 - GAP, 0.7, 0.84, carcassD, frontV + 0.002);
        add(`${id}-warmGlass`, "blackGlass", u0 + 0.05, u1 - 0.05, 0.72, 0.82, frontV + 0.002, frontV + 0.005);
      } else {
        // Gerätefront: Edelstahlrahmen, Glasscheibe (R7: ovenGlass), Bedienleiste, Griffstange
        oven("oven", 0.86, 1.48);
      }
    }
    if (m.t === "backofenus") oven("oven", topY - d.topT - 0.63, topY - d.topT - 0.03);
    if (m.t === "weinkuehler" || m.t === "weinklima") {
      const y1 = m.t === "weinklima" ? tallTop : topY - d.topT - 0.03;
      add(`${id}-wineFrame`, "blackGlass", u0 + GAP, u1 - GAP, d.plinth + GAP, y1 - GAP, carcassD, frontV);
      add(`${id}-wineGlass`, "wineGlass", u0 + 0.03, u1 - 0.03, d.plinth + 0.04, y1 - 0.04, frontV, frontV + 0.004);
      for (let s = d.plinth + 0.16; s < y1 - 0.08; s += 0.13) add(`${id}-wineShelf${Math.round(s * 100)}`, "wood", u0 + 0.04, u1 - 0.04, s, s + 0.012, 0.05, carcassD - 0.02);
      add(`${id}-wineLed`, "led", u0 + 0.04, u1 - 0.04, y1 - 0.07, y1 - 0.06, carcassD - 0.05, carcassD - 0.04);
    }
    if (m.t === "regal") {
      add(`${id}-shelf`, "carcass", u0 + 0.02, u1 - 0.02, (d.plinth + topY) / 2, (d.plinth + topY) / 2 + 0.019, 0.02, carcassD);
    }
    if (isCornerEck && opt(m, "m") === "k" && otherFrames[corner]) {
      // Karussell (L-Eckschrank 90/90): Schenkel an der Nachbarwand mit eigener Front
      const of = otherFrames[corner];
      const ob = makeBuilder(of.frame, parts, of.tag);
      const k0 = cm(of.start) - cm(m.w - BASE_DEPTH);
      const k1 = cm(of.start);
      ob(`k${i}-plinth`, "plinth", k0, k1, 0, d.plinth, 0, carcassD - 0.05);
      ob(`k${i}-body`, "carcass", k0, k1, d.plinth, topY - d.topT, 0, carcassD, { module: "eckschrank" });
      ob(`k${i}-f0`, "front", k0 + GAP, k1 - GAP, d.plinth + GAP, topY - d.topT - 0.03 - GAP, carcassD, frontV);
      ob(`k${i}-top`, "worktop", k0, k1, topY - d.topT, topY, 0, frontV + 0.02);
    }
    if (def.kind === "base" && m.t !== "passstueck") addSeg(u0, u1);
    if (m.t === "passstueck") addSeg(u0, u1);
    // Geräte auf der Arbeitsplatte
    const ty = topY + 0.002;
    if (m.t === "kochfeld") {
      const hw = Math.min(w - 0.08, 0.86);
      const flush = plan.sink === "flach";
      add(`${id}-hob`, "blackGlass", u0 + (w - hw) / 2, u1 - (w - hw) / 2, topY - (flush ? 0.004 : 0.002), flush ? topY + 0.0005 : ty + 0.004, 0.05, 0.57);
      if (opt(m, "k") === "g") {
        for (let b = 0; b < 4; b++) {
          const cu = u0 + (w - hw) / 2 + hw * (b % 2 ? 0.72 : 0.28);
          const cv = b < 2 ? 0.2 : 0.42;
          add(`${id}-burner${b}`, "steelDark", cu - 0.05, cu + 0.05, ty + 0.004, ty + 0.022, cv - 0.05, cv + 0.05);
        }
      }
      const hood = hoodType(plan, m, island, hasUp);
      if (hood === "m") add(`${id}-vent`, "steel", u0 + (w - hw) / 2 + 0.03, u1 - (w - hw) / 2 - 0.03, ty + 0.004, ty + 0.007, 0.28, 0.34);
      if (hood === "w" && !island) {
        const hy = topY + 0.65;
        const hwid = Math.max(0.6, Math.min(w, 0.9));
        const c = (u0 + u1) / 2;
        add(`${id}-hoodCanopy`, "steel", c - hwid / 2, c + hwid / 2, hy, hy + 0.06, 0.02, 0.5);
        add(`${id}-hoodChimney`, "steel", c - 0.14, c + 0.14, hy + 0.06, Math.min(ceilFront, d.H) - 0.005, 0.02, 0.27);
      }
      if ((hood === "i" || hood === "d") && island) {
        const c = (u0 + u1) / 2;
        const ceil = d.H;
        if (hood === "i") {
          add(`${id}-hoodIsland`, "steel", c - 0.45, c + 0.45, topY + 0.7, topY + 0.76, 0.05, 0.6);
          add(`${id}-hoodIslandChimney`, "steel", c - 0.14, c + 0.14, topY + 0.76, ceil - 0.005, 0.2, 0.45);
        } else {
          add(`${id}-hoodCeiling`, "steelDark", c - 0.5, c + 0.5, ceil - 0.05, ceil - 0.004, 0.0, 0.62);
        }
      }
      if (hood === "d" && !island) add(`${id}-hoodCeiling`, "steelDark", u0, u1, d.H - 0.05, d.H - 0.004, 0.05, 0.62);
    }
    if (m.t === "spuele") {
      const bType = opt(m, "b");
      const bw = Math.min(w - 0.12, bType === "2" ? 0.84 : bType === "5" ? 0.7 : 0.6);
      const c0 = u0 + (w - bw) / 2;
      const c1 = c0 + bw;
      const v0 = 0.12;
      const v1 = 0.52;
      const mount = plan.sink;
      const basins = bType === "2" ? [[c0, c0 + bw / 2 - 0.02], [c0 + bw / 2 + 0.02, c1]] : bType === "5" ? [[c0, c0 + bw * 0.62], [c0 + bw * 0.62 + 0.03, c1]] : [[c0, c1]];
      if (mount === "aufliegend") {
        add(`${id}-sink`, "sinkBasin", c0 - 0.015, c1 + 0.015, topY - 0.003, ty + 0.003, v0 - 0.015, v1 + 0.015);
        basins.forEach(([b0, b1], k) => add(`${id}-bowl${k}`, "sinkInner", b0 + 0.01, b1 - 0.01, ty + 0.0035, ty + 0.004, v0 + 0.01, v1 - 0.01));
      } else {
        cuts.push([c0, c1, v0, v1]);
        add(`${id}-sink`, "sinkBasin", c0, c1, topY - d.topT - 0.2, topY - d.topT - 0.19, v0, v1);
        basins.forEach(([b0, b1], k) => {
          const by0 = topY - d.topT - 0.19;
          const by1 = topY - (mount === "flach" ? 0.001 : d.topT);
          add(`${id}-bowl${k}L`, "sinkInner", b0, b0 + 0.008, by0, by1, v0, v1);
          add(`${id}-bowl${k}R`, "sinkInner", b1 - 0.008, b1, by0, by1, v0, v1);
          add(`${id}-bowl${k}B`, "sinkInner", b0, b1, by0, by1, v0, v0 + 0.008);
          add(`${id}-bowl${k}F`, "sinkInner", b0, b1, by0, by1, v1 - 0.008, v1);
        });
        if (mount === "flach") add(`${id}-rim`, "steel", c0, c1, topY - 0.0015, topY - 0.0005, v0, v0 + 0.004);
        if (basins.length > 1) add(`${id}-divider`, "sinkInner", basins[0][1], basins[1][0], topY - d.topT - 0.19, topY - d.topT - 0.005, v0, v1);
      }
      const tu = (u0 + u1) / 2;
      const tv = island ? 0.06 : 0.08;
      // Armatur als Bogen (Scene3D baut daraus eine Röhre; der Grundriss ignoriert sie).
      add(`${id}-tap`, "steel", tu - 0.015, tu + 0.015, topY, topY + 0.34, tv, tv + 0.03, { geom: "tap" });
    }
    labels.push({ id: `${tag}-${i}`, text: def.short, title: def.label, w: m.w, type: m.t, ...centerOf(frame, (u0 + u1) / 2, carcassD / 2), over });
    mods.push({
      id: `${tag}-${i}`, wall: tag, i, t: m.t, kind: def.kind, w: m.w, o: m.o, x0: m.x0, x1: m.x1,
      y0: 0, y1: top, island, over, slopeHit, corner, front: { u0: fu0, u1: fu1, v: frontV },
      quad: [toWorld(frame, u0, 0), toWorld(frame, u1, 0), toWorld(frame, u1, frontV), toWorld(frame, u0, frontV)],
      frontQuad: [toWorld(frame, fu0 + 0.01, frontV), toWorld(frame, fu1 - 0.01, frontV), toWorld(frame, fu1 - 0.01, frontV + cm(def.clear || 0)), toWorld(frame, fu0 + 0.01, frontV + cm(def.clear || 0))],
      frame,
    });
  });

  // Passblende für den Rest bis zur Wand (Rest unter 30 cm, letztes Modul kein Hochschrank)
  const last = placed[placed.length - 1];
  const used = last ? cm(last.x1) : start;
  const rest = end - used;
  if (rest > 0.005 && rest < 0.3 && last && MODULES[last.t].kind !== "tall" && (abut.end || cornerAt.end)) {
    add("filler", "front", used, end, d.plinth, topY - d.topT, carcassD - 0.02, frontV);
    add("filler-plinth", "plinth", used, end, 0, d.plinth, 0, carcassD - 0.05);
    addSeg(used, end);
  }
  // Lücken unter 20 cm zwischen Unterschränken: Passblende, Platte läuft durch
  for (let k = 1; k < placed.length; k++) {
    const a = placed[k - 1];
    const b = placed[k];
    const gap = b.x0 - a.x1;
    if (gap > 0.4 && gap < 20 && MODULES[a.t].kind !== "tall" && MODULES[b.t].kind !== "tall") {
      add(`gap${k}`, "front", cm(a.x1), cm(b.x0), d.plinth, topY - d.topT, carcassD - 0.02, frontV);
      add(`gap${k}-plinth`, "plinth", cm(a.x1), cm(b.x0), 0, d.plinth, 0, carcassD - 0.05);
      addSeg(cm(a.x1), cm(b.x0));
    }
  }
  segments.sort((p, q) => p[0] - q[0]);
  // Abschnitte, die nach dem Sortieren aneinanderstoßen, zusammenführen
  const merged = [];
  for (const s of segments) {
    const l = merged[merged.length - 1];
    if (l && s[0] - l[1] < 0.001) l[1] = Math.max(l[1], s[1]);
    else merged.push([...s]);
  }

  // Arbeitsplatte(n) mit Ausschnitten, Gehrungskante, Rückwand, Wangen
  const topOver = island ? cm(plan.island.over) : 0;
  const v0 = island ? -topOver : 0;
  const vEnd = frontV + 0.02;
  const y0t = topY - d.topT;
  const mitre = plan.edge === "gehrung" ? Math.max(d.topT, 0.04) : 0;
  const edgeGeom = plan.edge === "rund" ? { geom: "round", r: 0.005 } : plan.edge === "fase" ? { geom: "round", r: 0.002, seg: 1 } : {};
  const topPieces = [];
  for (const [k, [s0, s1]] of merged.entries()) {
    const inSeg = cuts.filter((c) => c[0] >= s0 - 0.001 && c[1] <= s1 + 0.001).sort((p, q) => p[0] - q[0]);
    let cur = s0;
    let n = 0;
    for (const [c0, c1, cv0, cv1] of inSeg) {
      if (c0 - cur > 0.001) add(`top${k}${n ? `-${n}` : ""}`, "worktop", cur, c0, y0t, topY, v0, vEnd, edgeGeom);
      n++;
      add(`top${k}-${n}b`, "worktop", c0, c1, y0t, topY, v0, cv0);
      add(`top${k}-${n}f`, "worktop", c0, c1, y0t, topY, cv1, vEnd);
      cur = c1;
      n++;
    }
    if (s1 - cur > 0.001) add(`top${k}${n ? `-${n}` : ""}`, "worktop", cur, s1, y0t, topY, v0, vEnd, edgeGeom);
    topPieces.push({ u0: s0, u1: s1, v0, v1: vEnd, cuts: inSeg.length });
    if (mitre > d.topT + 0.001) {
      add(`apron${k}`, "worktop", s0, s1, topY - mitre, y0t, vEnd - d.topT, vEnd);
      if (island) add(`apronB${k}`, "worktop", s0, s1, topY - mitre, y0t, v0, v0 + d.topT);
    }
    // Nischenrückwand
    const splashMat = { platte: "worktop", glas: "splashGlass", edelstahl: "steel" }[plan.splash];
    if (!island && splashMat) {
      const y1 = hasUp ? d.upBottom : topY + 0.6;
      // Ecke (90°): Die Rückwand der Nachbarzeile läuft bis an die Rückwand der Besitzerzeile –
      // sonst bleibt über der Eck-Arbeitsplatte ein 60 cm breiter Streifen nackte Wand.
      const cornerSplash = k === 0 && abut.otherAngle !== undefined && Math.abs(abut.otherAngle - 90) < 0.5 && Math.abs(s0 - start) < 0.005;
      // Fenster aussparen
      const sp0 = cornerSplash ? 0.012 : s0;
      let a0 = sp0;
      const blocks = opens.filter((o) => (o.k === "fenster" || o.k === "tuer") && o.u1 > sp0 && o.u0 < s1 && o.y0 < y1).sort((p, q) => p.u0 - q.u0);
      let sn = 0;
      for (const o of blocks) {
        if (o.u0 - a0 > 0.01) add(`splash${k}${sn ? `-${sn}` : ""}`, splashMat, a0, Math.min(o.u0, s1), topY, Math.min(y1, Math.max(topY + 0.01, o.y0)), 0, 0.012);
        if (o.y0 > topY + 0.02) add(`splash${k}w${sn}`, splashMat, Math.max(o.u0, sp0), Math.min(o.u1, s1), topY, o.y0, 0, 0.012);
        sn++;
        a0 = Math.max(a0, o.u1);
      }
      if (s1 - a0 > 0.01) add(`splash${k}${sn ? `-${sn}` : ""}`, splashMat, a0, s1, topY, y1, 0, 0.012);
    }
    if (island && isMilano) {
      // Wangen ("Wasserfall") an den Inselenden
      add(`wangeL${k}`, "worktop", s0 - d.topT, s0, 0, topY, v0, vEnd);
      add(`wangeR${k}`, "worktop", s1, s1 + d.topT, 0, topY, v0, vEnd);
    }
  }
  // Ecke (90°) mit Hochschrank am Anfang dieser Zeile: Streifen über der Eck-Arbeitsplatte der
  // Besitzerzeile bis zur Seite des Hochschranks ebenfalls mit Rückwand belegen.
  const splashMatC = { platte: "worktop", glas: "splashGlass", edelstahl: "steel" }[plan.splash];
  if (!island && splashMatC && abut.otherAngle !== undefined && Math.abs(abut.otherAngle - 90) < 0.5 && placed[0] && MODULES[placed[0].t].kind === "tall" && Math.abs(cm(placed[0].x0) - start) < 0.005 && start > 0.05) {
    const y1 = hasUp ? d.upBottom : topY + 0.6;
    const free = !opens.some((o) => (o.k === "fenster" || o.k === "tuer") && o.u1 > 0.012 && o.u0 < start && o.y0 < y1);
    if (free) add("splashC", splashMatC, 0.012, start, topY, y1, 0, 0.012);
  }
  // Wangen an freien Zeilenenden (Material Front oder Platte)
  if (plan.panels !== "keine" && placed.length && !(island && isMilano)) {
    const pm = plan.panels === "platte" ? "worktop" : "front";
    const t = plan.panels === "platte" ? Math.max(d.topT, 0.02) : 0.02;
    const first = placed[0];
    const lastM = placed[placed.length - 1];
    const hOf = (m) => (MODULES[m.t].kind === "tall" ? Math.min(d.tallTop, d.H - 0.02) : topY);
    const startFree = island || (!cornerAt.start && !abut.start && !abut.other);
    const endFree = island || (!cornerAt.end && !(abut.end && cm(lastM.x1) >= end - 0.005));
    if (startFree && cm(first.x0) - t >= -0.001) add("wangeS", pm, cm(first.x0) - t, cm(first.x0), 0, hOf(first), island ? v0 : 0, vEnd);
    if (endFree) add("wangeE", pm, cm(lastM.x1), cm(lastM.x1) + t, 0, hOf(lastM), island ? v0 : 0, vEnd);
  }

  // Rückseite der Insel (Sitzseite) mit Frontmaterial verkleidet
  if (island && placed.length) {
    const s0 = cm(placed[0].x0);
    const s1 = cm(placed[placed.length - 1].x1);
    add("backPanel", "front", s0, s1, d.plinth, topY - d.topT, -0.019, 0);
    add("backPlinth", "plinth", s0, s1, 0, d.plinth, 0.05, 0.07);
  }
  // Barplatte auf der Sitzseite der Insel (Richtmaß ca. 108 cm, Planungsannahme)
  if (island && plan.island.bar && merged.length) {
    const s0 = merged[0][0];
    const s1 = merged[merged.length - 1][1];
    const by = 1.08;
    add("barTop", "worktop", s0, s1, by - d.topT, by, v0 - 0.08, 0.14);
    add("barRiser", "front", s0, s1, topY, by - d.topT, 0.12, 0.14);
  }

  return { segments: merged, topPieces, placed };
}

/** Fenster/Türen, vor denen kein Hängeschrank hängen darf (u0..u1 in m, ab Unterkante y0). */
function upperBlocker(plan, tag) {
  const opens = openingsOn(plan, tag);
  return (u0, u1, y0) => opens.some((o) => (o.k === "fenster" || o.k === "tuer") && o.u1 > u0 + 0.01 && o.u0 < u1 - 0.01 && o.y1 > y0);
}

/** Hängeschränke einer Wand als Liste { t, u0, u1, y0, … } (automatisch über Unterschränken oder eigene Ebene). */
function upperItems({ plan, tag, run, ext, d }) {
  const mode = upperMode(plan, tag);
  if (mode === "aus") return [];
  const blocked = upperBlocker(plan, tag);
  const items = [];
  if (mode === "auto") {
    for (const m of placeRun(run, ext.start)) {
      const def = MODULES[m.t];
      if (def.kind !== "base" || m.t === "passstueck") continue;
      const u0 = cm(m.x0);
      const u1 = cm(m.x1);
      if (m.t === "kochfeld") {
        const hood = hoodType(plan, m, false, true);
        if (hood === "w" || hood === "d") continue;
        const y0 = Math.max(d.upBottom, d.topY + 0.65);
        if (blocked(u0, u1, y0)) continue;
        items.push({ t: hood === "f" ? "luefterhs" : "haengeschrank", u0, u1, y0, auto: true, i: m.i });
        continue;
      }
      if (blocked(u0, u1, d.upBottom)) continue;
      items.push({ t: "haengeschrank", u0, u1, y0: d.upBottom, auto: true, i: m.i });
    }
  } else {
    const ups = plan.up?.[tag]?.r || [];
    for (const m of placeRun(ups, ext.start)) items.push({ t: m.t, u0: cm(m.x0), u1: cm(m.x1), y0: m.t === "luefterhs" ? Math.max(d.upBottom, d.topY + 0.65) : d.upBottom, o: m.o, i: m.i, w: m.w, x0: m.x0, x1: m.x1 });
  }
  return items;
}

const UPPER_EXTEND_MAX = 0.3; // m: bis 30 cm wird der erste Hängeschrank der Nachbarzeile verbreitert
const UPPER_FILL_MIN = 0.15; // m: ab 15 cm eigener Hängeschrank, darunter Passblende

/** Breite (cm, 1 Nachkommastelle) und x0/x1 eines Elements nach u0/u1 nachziehen (eigene Hängeschränke). */
function syncCm(it) {
  if (it.x0 === undefined) return;
  it.x0 = Math.round(it.u0 * 1000) / 10;
  it.x1 = Math.round(it.u1 * 1000) / 10;
  it.w = Math.round((it.u1 - it.u0) * 1000) / 10;
}

/**
 * Hängeschränke in den Ecken schließen (Bugreport L-Form 3D): Die Unterschränke der
 * Nachbarzeile beginnen mit dem Unterschrank-Abstand (60 cm), ihre Hängeschränke müssen
 * aber schon bei der Hängeschrank-Tiefe (35 cm) beginnen – sonst bleibt über der Ecke ein
 * 25-cm-Spalt mit nackter Wand, und die Tür des Eck-Hängeschranks liegt hinter der
 * Nachbarzeile. Genau eine Zeile besitzt die Ecke (wie bei den Unterschränken): Ihr
 * Hängeschrank läuft bis in die Ecke und wird zum Eck-Hängeschrank mit Blindecke (Tür nur
 * am zugänglichen Teil); die andere Zeile beginnt bei cornerClearance(Winkel, 35 cm) –
 * erster Hängeschrank verbreitert (bis 30 cm), sonst eigener Hängeschrank bzw. Passblende.
 * Steht an der Nachbarzeile ein Hochschrank in der Ecke, bekommt der Eck-Hängeschrank eine
 * Blindecke in Unterschrank-Tiefe (Tür schlägt sonst an den Hochschrank). Ohne Hängeschrank
 * in der Ecke (Lücke, Fenster, Haubenschrank) bleibt alles wie es ist.
 */
function closeUpperCorners({ plan, cs, items, exts, placed, d }) {
  const D = WALL_D * 100;
  for (const c of cs) {
    const own = items[c.owner];
    const oth = items[c.other];
    if (!own?.length || !oth?.length) continue;
    const oe = exts[c.owner];
    const xe = exts[c.other];
    const real = (list) => list.filter((it) => it.t !== "luecke");
    const ownList = real(own);
    const corner = c.ownerAt === "start" ? ownList[0] : ownList[ownList.length - 1];
    const ownEdge = c.ownerAt === "start" ? cm(oe.start) : cm(oe.start + oe.length);
    if (!corner || corner.t !== "haengeschrank") continue;
    // Rest bis zur Ecke (unten Passblende, unter 30 cm): Eck-Hängeschrank läuft bis in die Ecke
    const rest = c.ownerAt === "start" ? corner.u0 - ownEdge : ownEdge - corner.u1;
    if (rest < -0.005 || rest > UPPER_EXTEND_MAX - 0.001) continue;
    if (rest > 0.005) {
      if (upperBlocker(plan, c.owner)(Math.min(ownEdge, corner.u0), Math.max(ownEdge, corner.u1), corner.y0)) continue;
      if (c.ownerAt === "start") corner.u0 = ownEdge;
      else corner.u1 = ownEdge;
      syncCm(corner);
    }
    // Blindecke: der Teil der Front, der hinter der Nachbarzeile (Tiefe dep in cm) liegt.
    // Rechtwinklig: bis zum Treffpunkt der Fronten (= dep). Spitz: dazu der Teil, vor dem die
    // schräge Front der Nachbarzeile den Öffnungsraum (clear) der Tür einengt (clear / tan Winkel).
    // Stumpf: so weit die vordere Ecke des ersten Nachbarschranks vor die Front ragt
    // (dep · sin φ · (1 − cos φ), φ = 180° − Winkel).
    const phi = ((180 - c.angle) * Math.PI) / 180;
    const clear = MODULES.haengeschrank.clear;
    const blindFor = (dep) =>
      c.angle <= 90
        ? cm(cornerClearance(c.angle, dep) - wallClearance(c.angle, dep) + (c.angle < 89.5 ? clear / Math.tan((c.angle * Math.PI) / 180) : 0))
        : cm(dep * Math.sin(phi) * (1 - Math.cos(phi)));
    const setBlind = (b) => {
      corner.corner = c.ownerAt;
      corner.blind = Math.max(0, Math.min(b, corner.u1 - corner.u0 - 0.2));
    };
    const baseEdge = c.otherAt === "start" ? cm(xe.start) : cm(xe.start + xe.length);
    // Hochschrank der Nachbarzeile direkt an der Ecke: Tür des Eck-Hängeschranks nur bis zu dessen Seite
    const bp = placed[c.other] || [];
    const firstBase = c.otherAt === "start" ? bp[0] : bp[bp.length - 1];
    if (firstBase && MODULES[firstBase.t]?.kind === "tall" && Math.abs(cm(c.otherAt === "start" ? firstBase.x0 : firstBase.x1) - baseEdge) < 0.005) {
      setBlind(blindFor(BASE_DEPTH));
      continue;
    }
    // Andere Zeile: erster Hängeschrank direkt am Anfang der Unterschränke?
    const othList = [...oth].sort((a, b) => (c.otherAt === "start" ? a.u0 - b.u0 : b.u1 - a.u1));
    const first = othList[0];
    if (!first || (first.t !== "haengeschrank" && first.t !== "luefterhs") || Math.abs((c.otherAt === "start" ? first.u0 : first.u1) - baseEdge) > 0.005) continue;
    // Hängeschrank-Grenze an der Ecke (Winkel wie bei den Unterschränken, nur mit 35 cm Tiefe)
    const dir = c.otherAt === "start" ? 1 : -1;
    const edge0 = c.otherAt === "start" ? cm(cornerClearance(c.angle, D)) : baseEdge;
    // Spitzer Winkel: Die schräge Front der Besitzerzeile engt den Öffnungsraum ein –
    // dort eine Passblende statt einer Tür (clear / tan Winkel, höchstens bis zu den Unterschränken)
    const acute = c.angle < 89.5 ? Math.min(cm(clear / Math.tan((c.angle * Math.PI) / 180)), Math.max(0, dir * (baseEdge - edge0))) : 0;
    const upEdge = edge0 + dir * acute;
    if (upperBlocker(plan, c.other)(Math.min(edge0, baseEdge), Math.max(edge0, baseEdge), first.y0)) continue;
    const piece = (t, a, b, key) => {
      const it = { t, u0: Math.min(a, b), u1: Math.max(a, b), y0: d.upBottom, auto: first.auto, i: first.i, key, corner: null };
      if (first.x0 !== undefined) Object.assign(it, { x0: 0, x1: 0, w: 0 });
      syncCm(it);
      oth.push(it);
    };
    if (acute > 0.005) piece("blende", edge0, upEdge, `b${first.i}`);
    const delta = Math.abs(baseEdge - upEdge);
    if (delta > 0.005) {
      if (first.t === "haengeschrank" && delta <= UPPER_EXTEND_MAX + 1e-6) {
        if (c.otherAt === "start") first.u0 = upEdge;
        else first.u1 = upEdge;
        syncCm(first);
      } else {
        piece(delta >= UPPER_FILL_MIN - 1e-6 ? "haengeschrank" : "blende", upEdge, baseEdge, `e${first.i}`);
      }
    }
    // Besitzerzeile: bei spitzem Winkel bis an die Hängeschrank-Grenze (35 cm statt 60 cm Tiefe)
    const reach = cm(wallClearance(c.angle) - wallClearance(c.angle, D));
    if (reach > 0) {
      if (c.ownerAt === "start") corner.u0 -= reach;
      else corner.u1 += reach;
      syncCm(corner);
    }
    setBlind(blindFor(D));
  }
}

/** Baut die Hängeschränke einer Wand (Liste aus upperItems, Ecken aus closeUpperCorners). */
function buildUppers({ plan, frame, tag, items, parts, mods, d }) {
  if (!items?.length) return;
  const add = makeBuilder(frame, parts, tag);
  const topLim = Math.min(d.tallTop, d.H - 0.02);
  const blocked = upperBlocker(plan, tag);
  for (const it of items) {
    const id = it.key || `${it.i}`;
    const { u0, u1, y0 } = it;
    if (topLim - y0 <= 0.3 && it.t !== "wandbord") continue;
    const [fx, fz] = toWorld(frame, (u0 + u1) / 2, WALL_D);
    const ceil = ceilingAt(plan, fx, fz);
    const slopeHit = ceil < topLim - 0.005;
    const hit = blocked(u0, u1, y0) || slopeHit;
    const pre = it.auto ? "" : "u";
    if (it.t === "luecke") continue;
    if (it.t === "blende") {
      // Passblende in der Ecke (Rest unter 15 cm bzw. spitzer Winkel): geschlossener Korpus, Front ohne Tür
      add(`${pre}${id}-fillerBody`, "carcass", u0 + 0.001, u1 - 0.001, y0, topLim, 0, WALL_D - FRONT_T);
      add(`${pre}${id}-filler`, "front", u0, u1, y0, topLim, WALL_D - FRONT_T, WALL_D);
      continue;
    }
    if (it.t === "wandbord") {
      add(`${pre}${id}-bord`, hit ? "error" : "wood", u0, u1, y0 + 0.3, y0 + 0.33, 0, 0.25);
      mods.push({ id: `${tag}-u${id}`, wall: tag, i: it.i, t: it.t, kind: "upper", x0: it.x0, x1: it.x1, w: it.w, y0: y0 + 0.3, y1: y0 + 0.33, over: hit, slopeHit, quad: [toWorld(frame, u0, 0), toWorld(frame, u1, 0), toWorld(frame, u1, 0.25), toWorld(frame, u0, 0.25)], frame });
      continue;
    }
    const f = it.auto ? "t" : opt({ t: it.t, o: it.o }, "f") || "t";
    // Eck-Hängeschrank: Tür nur am zugänglichen Teil, die Blindecke liegt hinter der Nachbarzeile
    const blind = it.blind || 0;
    const fu0 = it.corner === "start" ? u0 + blind : u0;
    const fu1 = it.corner === "end" ? u1 - blind : u1;
    // Teil-IDs wie bisher (-wc, -wcs, -wcf, -led, -hood) für automatische Hängeschränke
    add(`${pre}${id}-wc`, hit ? "error" : "carcass", u0 + 0.001, u1 - 0.001, y0, topLim, 0, WALL_D - FRONT_T, { module: it.t });
    if (f === "o") {
      add(`${pre}${id}-wcBack`, "front", u0 + 0.02, u1 - 0.02, y0 + 0.02, topLim - 0.02, 0.02, 0.03);
      add(`${pre}${id}-wcShelf`, "carcass", u0 + 0.02, u1 - 0.02, (y0 + topLim) / 2, (y0 + topLim) / 2 + 0.019, 0.03, WALL_D - FRONT_T);
    } else {
      // Fix 2 (P2-5): Schattenfuge 6 mm unter der Oberkante – kein Z-Fighting mit Korpus und Front
      add(`${pre}${id}-wcs`, "gapShade", fu0 + 0.002, fu1 - 0.002, y0 + 0.006, topLim - 0.006, WALL_D - FRONT_T - 0.004, WALL_D - FRONT_T + 0.001);
      // Blindblende (Frontmaterial) hinter der Seitenwand der Nachbarzeile
      if (blind > 0) add(`${pre}${id}-wcb`, "front", it.corner === "start" ? u0 : fu1, it.corner === "start" ? fu0 : u1, y0, topLim, WALL_D - FRONT_T, WALL_D - FRONT_T + 0.006);
      const two = f !== "k" && fu1 - fu0 > 0.65;
      const mat = f === "g" ? "glassFront" : "front";
      if (two) {
        const c = (fu0 + fu1) / 2;
        add(`${pre}${id}-wcf`, mat, fu0 + GAP, c - GAP, y0 + GAP, topLim - GAP, WALL_D - FRONT_T, WALL_D);
        add(`${pre}${id}-wcf2`, mat, c + GAP, fu1 - GAP, y0 + GAP, topLim - GAP, WALL_D - FRONT_T, WALL_D);
      } else if (f === "k" && topLim - y0 > 0.6) {
        const c = (y0 + topLim) / 2;
        add(`${pre}${id}-wcf`, mat, fu0 + GAP, fu1 - GAP, y0 + GAP, c - GAP, WALL_D - FRONT_T, WALL_D);
        add(`${pre}${id}-wcf2`, mat, fu0 + GAP, fu1 - GAP, c + GAP, topLim - GAP, WALL_D - FRONT_T, WALL_D);
      } else {
        add(`${pre}${id}-wcf`, mat, fu0 + GAP, fu1 - GAP, y0 + GAP, topLim - GAP, WALL_D - FRONT_T, WALL_D);
      }
      if (plan.grip === "stange" || plan.grip === "leiste") add(`${pre}${id}-wch`, "grip", fu0 + 0.03, fu1 - 0.03, y0 + 0.02, y0 + 0.032, WALL_D, WALL_D + 0.02);
    }
    if (plan.led) add(`${pre}${id}-led`, "led", u0 + 0.02, u1 - 0.02, y0 - 0.006, y0, 0.05, 0.08, { light: true });
    // Flachschirmhaube, bündig im Hängeschrank integriert (keine schwebende Platte)
    if (it.t === "luefterhs") add(`${pre}${id}-hood`, "steel", u0 + GAP, u1 - GAP, y0 - 0.014, y0, 0.02, WALL_D);
    const clear = cm(MODULES[it.t]?.clear || 0);
    mods.push({
      id: `${tag}-u${id}${it.auto ? "a" : ""}`, wall: tag, i: it.i, t: it.t, kind: "upper", auto: it.auto, x0: it.x0 ?? u0 * 100, x1: it.x1 ?? u1 * 100, w: it.w ?? (u1 - u0) * 100,
      y0, y1: topLim, over: hit, slopeHit, corner: it.corner || null, blind: Math.round(blind * 1000) / 10,
      quad: [toWorld(frame, u0, 0), toWorld(frame, u1, 0), toWorld(frame, u1, WALL_D), toWorld(frame, u0, WALL_D)], frame,
      // Öffnungsraum der Türen (Prüfung: Tür des Eck-Hängeschranks gegen die Nachbarzeile)
      ...(f !== "o" && clear ? { frontQuad: [toWorld(frame, fu0 + 0.01, WALL_D), toWorld(frame, fu1 - 0.01, WALL_D), toWorld(frame, fu1 - 0.01, WALL_D + clear), toWorld(frame, fu0 + 0.01, WALL_D + clear)] } : {}),
    });
  }
}

function centerOf(frame, u, v) {
  const [x, z] = toWorld(frame, u, v);
  return { x, z };
}

/** Insel-Module: Funktion (Kochfeld/Spüle) mittig, Rest Unterschränke. */
export function islandModules(plan) {
  if (plan.runs?.i?.length) return plan.runs.i;
  const g = plan.raster;
  const len = plan.island.len;
  const fnW = plan.island.fn === "keine" ? 0 : Math.round(1.5 * g * 100) / 100;
  if (fnW > len) return [];
  const side = (len - fnW) / 2;
  const fill = (rest) => {
    const out = [];
    const ws = [g, g / 2, g * 0.75].map((x) => Math.round(x * 100) / 100);
    let r = rest;
    let guard = 0;
    while (guard++ < 12) {
      const w = ws.find((x) => x <= r + 0.001);
      if (!w) break;
      out.push({ t: "unterschrank", w });
      r -= w;
    }
    return out;
  };
  const left = fill(side);
  const right = fill(side);
  const mid = fnW ? [{ t: plan.island.fn, w: fnW }] : [];
  return [...left, ...mid, ...right];
}

/** Legacy-Raummaß (Breite, Tiefe, Höhe in m) – für Kamera-Regeln und alte Aufrufer. */
export function roomSize(plan) {
  const b = roomBounds(plan);
  if (plan.shape === "frei") return { w: b.w, d: b.d, h: plan.h / 100, x0: b.minX, z0: b.minZ };
  const A = cm(plan.walls.a);
  const D = plan.shape === "u" || plan.shape === "zweizeilig" ? cm(Math.max(plan.walls.b, plan.walls.c)) : cm(plan.walls.b);
  return { w: A, d: D, h: cm(plan.h), x0: 0, z0: 0 };
}

// ---- Kamera-Regeln (rein rechnerisch, damit sie ohne three.js testbar sind) ----

export const AZIMUTH = 1.05; // ±60° um die offene Raumseite
export const AZIMUTH_TALL = 0.72; // ≈ ±41° auf einer Seite mit Hochschränken

export const WALL_MARGIN = 0.25; // m: Kamera bleibt so weit innerhalb einer Seitenwand

/**
 * Drehgrenze je Grundform (R2, Auflage R4). Zwei Regeln, die engere gilt:
 * 1. Seiten MIT Wand (L: links, U: beide): Die Kamera darf nicht hinter die
 *    Wandebene wandern – sonst blendet das Puppenhaus die Wand aus und man sieht
 *    auf die Rückseiten von Hochschränken und Hängeschränken (Abnahme desktop-04).
 *    Die Grenze hängt vom aktuellen Abstand ab: `view` = { tx: Orbit-Ziel x,
 *    w: Raumbreite, rh: waagrechter Abstand Kamera–Ziel } (alles in m).
 * 2. Seiten OHNE Wand: Steht dort ein Hochschrank am Zeilenende, höchstens ≈ ±41°.
 * min = Kamera wandert nach links (−x), max = nach rechts (+x).
 * Freie Raumform: volle Drehung (Puppenhaus blendet jede Wand einzeln aus).
 */
export function azimuthLimits(plan, view = null) {
  if (plan.shape === "frei") return { min: -Infinity, max: Infinity };
  const isTall = (m) => MODULES[m.t]?.kind === "tall";
  const a = plan.runs?.a || [];
  const wallLeft = ["l", "u", "zweizeilig", "halbinsel"].includes(plan.shape);
  const wallRight = plan.shape === "u" || plan.shape === "zweizeilig";
  let tallLeft = false;
  let tallRight = false;
  if (wallLeft) tallLeft = (plan.runs?.b || []).some(isTall);
  if (wallRight) tallRight = (plan.runs?.c || []).some(isTall);
  if (!wallLeft) tallLeft = a.length > 0 && isTall(a[0]);
  if (!wallRight && a.length > 0 && isTall(a[a.length - 1])) tallRight = true;
  let min = tallLeft ? -AZIMUTH_TALL : -AZIMUTH;
  let max = tallRight ? AZIMUTH_TALL : AZIMUTH;
  if (view && view.rh > 0) {
    const lim = (room) => Math.asin(Math.max(0, Math.min(1, room / view.rh)));
    if (wallLeft) min = Math.max(min, -lim(view.tx - WALL_MARGIN));
    if (wallRight) max = Math.min(max, lim(view.w - WALL_MARGIN - view.tx));
  }
  return { min, max };
}

export const EYE = 1.6;

/**
 * „Ich stehe in der Küche“: Augenhöhe 1,60 m. R2 (Auflage R5): 35 cm weiter
 * zurück als in Runde 1 und ein etwas weiteres Sichtfeld (66° statt 62°), damit
 * nicht nur Platte und Fronten im Bild sind. Die Vorderseite des Raums ist offen,
 * die Kamera darf deshalb bis 10 cm vor die Raumkante.
 * Bei der Insel steht man auf der Sitzseite und schaut darüber.
 */
export function standPose(plan, room) {
  const cx = (room.x0 || 0) + room.w / 2;
  const z0 = room.z0 || 0;
  const islandBack = (BASE_DEPTH + plan.island.aisle + plan.island.depth) / 100;
  const isl = plan.shape === "insel" || plan.shape === "halbinsel";
  const want = isl ? islandBack + 0.85 : Math.max(2.55, room.d * 0.78 + 0.35);
  const z = Math.max(1.5, Math.min(room.d + 0.1, want));
  return { pos: [cx, EYE, z0 + z], target: [cx, 1.15, z0 + 0.3], fov: 66 };
}

/** Stößt eine Zeile an Anfang/Ende an eine Wand (keine Wange, Passblende erlaubt)? */
function abutOf(plan, wall, cs) {
  const other = cs.some((c) => c.other === wall);
  const otherAngle = cs.find((c) => c.other === wall)?.angle;
  if (plan.shape === "frei") return { start: true, end: true, other, otherAngle };
  const side = SHAPES[plan.shape]?.side || {};
  if (wall === "a") return { start: Boolean(side.left), end: Boolean(side.right), other, otherAngle };
  // b und c: Anfang an der Rückwand (zweizeilig) bzw. an der Ecke; vorne offen
  return { start: plan.shape === "zweizeilig", end: false, other, otherAngle };
}

/** Hauptfunktion: Plan → { room, walls, parts, labels, warnings, mods, dims, … } */
export function buildKitchen(plan) {
  const parts = [];
  const labels = [];
  const warnings = [];
  const mods = [];
  const room = roomSize(plan);
  const d = dims(plan);
  const walls = roomWalls(plan);
  const frames = Object.fromEntries(walls.map((w) => [w.id, wallFrame(w)]));
  const cs = corners(plan);
  const runsOut = {};
  const tops = {};
  const upItems = {};
  const exts = {};

  for (const wall of activeWalls(plan)) {
    const run = plan.runs[wall] || [];
    const ext = runExtent(plan, wall);
    if (runUsed(run) > ext.length + 0.01) {
      warnings.push(`Wand ${wall.toUpperCase()}: Module sind ${Math.round(runUsed(run) - ext.length)} cm zu lang.`);
    }
    const cornerAt = {};
    const otherFrames = {};
    for (const c of cs) {
      if (c.owner !== wall) continue;
      cornerAt[c.ownerAt] = c.other;
      otherFrames[c.ownerAt] = { frame: frames[c.other], tag: c.other, start: runExtent(plan, c.other).start };
    }
    const r = buildRun({ plan, frame: frames[wall], run, ext, tag: wall, parts, labels, mods, d, cornerAt, otherFrames, abut: abutOf(plan, wall, cs) });
    runsOut[wall] = r.placed;
    tops[wall] = r.topPieces;
    upItems[wall] = upperItems({ plan, tag: wall, run, ext, d });
    exts[wall] = ext;
  }
  // Hängeschränke erst nach allen Zeilen bauen: Die Ecken hängen von beiden Nachbarzeilen ab.
  closeUpperCorners({ plan, cs, items: upItems, exts, placed: runsOut, d });
  for (const wall of Object.keys(upItems)) buildUppers({ plan, frame: frames[wall], tag: wall, items: upItems[wall], parts, mods, d });

  let island = null;
  if (plan.shape === "insel" || plan.shape === "halbinsel") {
    const frame = islandFrame(plan);
    const run = islandModules(plan);
    if (runUsed(run) > plan.island.len + 0.01) warnings.push(`Insel: Module sind ${Math.round(runUsed(run) - plan.island.len)} cm zu lang.`);
    const r = buildRun({ plan, frame, run, ext: { start: 0, length: plan.island.len }, tag: "i", parts, labels, mods, d, island: true });
    runsOut.i = r.placed;
    tops.i = r.topPieces;
    island = { frame, len: cm(plan.island.len), depth: cm(plan.island.depth), z0: frame.z0, x0: frame.x0 };
    const back = cm(BASE_DEPTH + plan.island.aisle + plan.island.depth);
    if (plan.shape === "insel" && back > room.d - 0.8) warnings.push("Hinter der Insel bleiben weniger als 80 cm Durchgang – Raumtiefe oder Gangbreite prüfen.");
    if (plan.island.aisle < 100) warnings.push("Gang zwischen Zeile und Insel unter 100 cm: bei zwei Personen eng.");
  }

  // Pendelleuchten über Insel (oder über der Zeile A, wenn es keine Insel gibt)
  if (plan.pend > 0) {
    const n = plan.pend;
    let x0;
    let x1;
    let z;
    if (island) {
      x0 = island.x0 + 0.25;
      x1 = island.x0 + island.len - 0.25;
      z = island.z0 + Math.min(0.6, island.frame.carcass) / 2;
    } else {
      const fa = frames.a;
      const ext = runExtent(plan, "a");
      const [ax0, az0] = toWorld(fa, cm(ext.start) + 0.4, 1.2);
      const [ax1] = toWorld(fa, cm(ext.start + ext.length) - 0.4, 1.2);
      x0 = Math.min(ax0, ax1);
      x1 = Math.max(ax0, ax1);
      z = az0;
    }
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * k) / (n - 1);
      const y = (island ? d.topY : 0.75) + 0.75;
      parts.push({ id: `pend-${k}`, mat: "pendant", geom: "pendant", pos: [x, y, z], size: [0.3, 0.25, 0.3], rot: 0, ceil: ceilingAt(plan, x, z), foot: { x, z, w: 0.3, d: 0.3 }, quad: [[x - 0.15, z - 0.15], [x + 0.15, z - 0.15], [x + 0.15, z + 0.15], [x - 0.15, z + 0.15]], light: true });
    }
  }

  const openings = (plan.room?.op || [])
    .map((o, idx) => {
      const w = walls.find((x) => x.id === o.w);
      if (!w) return null;
      const f = frames[o.w];
      return { ...o, idx, wall: w, u0: cm(o.x), u1: cm(o.x + o.b), y0: cm(o.y), y1: cm(o.y + o.h), p0: toWorld(f, cm(o.x), 0), p1: toWorld(f, cm(o.x + o.b), 0) };
    })
    .filter(Boolean);

  return { room, walls, frames, parts, labels, warnings, tallTop: d.tallTop, dims: d, mods, runs: runsOut, tops, island, openings, corners: cs };
}
