// src/lib/raumzwilling/platzierung.js
// Platzierungs-JSON des Team-Werkzeugs: weiche Volumen aus Katalogmaßen,
// kein nachgebautes Design. Rein (zod + Mathe), Browser und Server.
//
// Koordinaten in Welt-Metern nach der Maßstab-Transformation (massstab.js):
// Boden y = 0, x nach rechts, z nach vorne. Ein Volumen ist ein Quader mit
// Mittelpunkt (x, z) auf dem Boden, Grundfläche B × T, Höhe H (cm, wie im
// Katalog) und einer Drehung um die Hochachse in Grad.

import { z } from "zod";
// Client-reachable (team tool in the browser): zod must not compile with
// new Function() under the CSP (tests/unit/r6-leads-fix.test.mjs P2-2).
z.config({ jitless: true });
import { RAUM_CONFIG } from "./config.js";
import { cmText, meterText } from "./massstab.js";

const M = RAUM_CONFIG.placement.maxRoomMeters;
const cm = z.number().finite().min(5).max(1200);
const meter = z.number().finite().min(-M).max(M);
const text = (max) => z.string().trim().max(max);

export const MASSQUELLEN = Object.freeze({
  hersteller: "Herstellerangabe",
  backoffice: "Backoffice-Angabe, ungeprüft",
  hand: "Von Hand eingetragen",
});

export const volumenSchema = z
  .object({
    id: z.string().regex(/^v-[a-z0-9]{6,24}$/),
    produktId: text(140).optional().nullable(),
    name: text(120).min(1),
    marke: text(60).optional().nullable(),
    w: cm,
    d: cm,
    h: cm,
    quelle: z.object({
      art: z.enum(Object.keys(MASSQUELLEN)),
      text: text(300).optional().nullable(),
      url: z.string().url().max(500).optional().nullable(),
    }),
    x: meter,
    y: z.number().finite().min(0).max(5).default(0),
    z: meter,
    rotY: z.number().finite().min(-360).max(360),
    notiz: text(300).optional().nullable(),
  })
  .strict();

export const platzierungSchema = z
  .object({
    version: z.literal(1),
    volumen: z.array(volumenSchema).max(RAUM_CONFIG.placement.maxVolumes),
  })
  .strict()
  .superRefine((p, ctx) => {
    const ids = new Set();
    p.volumen.forEach((v, i) => {
      if (ids.has(v.id)) ctx.addIssue({ code: "custom", path: ["volumen", i, "id"], message: "doppelte id" });
      ids.add(v.id);
    });
  });

export function neueVolumenId(zufall = Math.random) {
  let s = "";
  while (s.length < 10) s += Math.floor(zufall() * 36).toString(36);
  return `v-${s}`;
}

/** Ecken der Grundfläche in Metern (x, z), gegen den Uhrzeigersinn. */
export function grundflaeche(v) {
  const hw = v.w / 200;
  const hd = v.d / 200;
  const r = (v.rotY * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([px, pz]) => [v.x + px * c + pz * s, v.z - px * s + pz * c]);
}

function projiziere(ecken, achse) {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, zz] of ecken) {
    const p = x * achse[0] + zz * achse[1];
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return [min, max];
}

/** Trennende-Achsen-Test für zwei gedrehte Rechtecke (mit Toleranz in m). */
export function ueberlappen(a, b, toleranz = 0.005) {
  const ea = grundflaeche(a);
  const eb = grundflaeche(b);
  for (const ecken of [ea, eb]) {
    for (let i = 0; i < 2; i++) {
      const [x1, z1] = ecken[i];
      const [x2, z2] = ecken[i + 1];
      const l = Math.hypot(x2 - x1, z2 - z1) || 1;
      const achse = [-(z2 - z1) / l, (x2 - x1) / l];
      const [amin, amax] = projiziere(ea, achse);
      const [bmin, bmax] = projiziere(eb, achse);
      if (amax - toleranz <= bmin || bmax - toleranz <= amin) return false;
    }
  }
  return true;
}

/** Hinweise (keine Fehler): Überschneidungen, außerhalb des Grundrisses, zu hoch. */
export function pruefePlatzierung(platzierung, grundriss) {
  const hinweise = [];
  const vs = platzierung.volumen;
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      if (ueberlappen(vs[i], vs[j])) hinweise.push({ art: "ueberlappung", ids: [vs[i].id, vs[j].id], text: `${vs[i].name} und ${vs[j].name} überschneiden sich.` });
    }
    if (grundriss) {
      const raus = grundflaeche(vs[i]).some(([x, zz]) => x < grundriss.x0 - 0.01 || x > grundriss.x1 + 0.01 || zz < grundriss.z0 - 0.01 || zz > grundriss.z1 + 0.01);
      if (raus) hinweise.push({ art: "ausserhalb", ids: [vs[i].id], text: `${vs[i].name} ragt über den Grundriss hinaus.` });
      if (grundriss.hoehe && vs[i].y + vs[i].h / 100 > grundriss.hoehe) {
        hinweise.push({ art: "zu-hoch", ids: [vs[i].id], text: `${vs[i].name} ist höher als der Raum.` });
      }
    }
  }
  return hinweise;
}

// Im Dativ, weil sie in „vor der …“ / „von der …“ stehen. Eigene Namen
// (grundriss.waende, z. B. „Fensterwand“) sind im Dativ gleich.
export const STANDARD_WAENDE = Object.freeze({ hinten: "hinteren Wand", vorne: "vorderen Wand", links: "linken Wand", rechts: "rechten Wand" });

/**
 * Position in Worten für Tabelle und Screenreader, z. B.
 * „0,40 m vor der Fensterwand, 1,10 m von der linken Wand, gedreht um 90°“.
 */
export function positionInWorten(v, grundriss) {
  const teile = [];
  if (grundriss) {
    const w = { ...STANDARD_WAENDE, ...(grundriss.waende || {}) };
    const ecken = grundflaeche(v);
    const xs = ecken.map((e) => e[0]);
    const zs = ecken.map((e) => e[1]);
    const abst = [
      { wand: w.hinten, m: Math.min(...zs) - grundriss.z0 },
      { wand: w.vorne, m: grundriss.z1 - Math.max(...zs) },
      { wand: w.links, m: Math.min(...xs) - grundriss.x0 },
      { wand: w.rechts, m: grundriss.x1 - Math.max(...xs) },
    ].sort((a, b) => a.m - b.m);
    const [n1, n2] = abst;
    teile.push(`${meterText(Math.max(0, n1.m))} vor der ${n1.wand}`);
    teile.push(`${meterText(Math.max(0, n2.m))} von der ${n2.wand}`);
  } else {
    teile.push(`Mitte bei x ${meterText(v.x)}, z ${meterText(v.z)}`);
  }
  const grad = ((Math.round(v.rotY) % 360) + 360) % 360;
  if (grad) teile.push(`gedreht um ${grad}°`);
  if (v.y > 0.005) teile.push(`${meterText(v.y)} über dem Boden`);
  return teile.join(", ");
}

export const masseText = (v) => `B ${cmText(v.w)} × T ${cmText(v.d)} × H ${cmText(v.h)}`;

/** Grundriss-Rechteck aus Splat-Weltpunkten (robust: 2.–98. Perzentil). */
export function grundrissAusPunkten(punkte, hoeheFallback = 2.5) {
  if (!punkte.length) return null;
  const q = (arr, p) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
  };
  const xs = punkte.map((p) => p[0]);
  const ys = punkte.map((p) => p[1]);
  const zs = punkte.map((p) => p[2]);
  const r = (v) => Math.round(v * 100) / 100;
  return { x0: r(q(xs, 0.02)), x1: r(q(xs, 0.98)), z0: r(q(zs, 0.02)), z1: r(q(zs, 0.98)), hoehe: r(Math.max(q(ys, 0.98), hoeheFallback * 0.6)) };
}
