// src/lib/einblicke/client.js – Sammler der Besucher-Einblicke (Konzept §2–§3).
//
// Wird NUR vom Lader (src/components/Einblicke/EinblickeLoader.js) und nur
// bei offenem Tor (gate.js) im Leerlauf nachgeladen. Ziel < 4 KB gzip
// (tests/unit/einblicke.test.mjs misst).
//
// Erfasst je Seitenaufruf: Seite (Pfad ohne Query), Gerätegruppe, Viewport,
// Dokumenthöhe, Herkunft (nur Kanal-Label, nur beim Einstieg), Klicks
// (Selektor + Position im Element + Seitenraster), Rage-/tote Klicks,
// Scrolltiefe, Mausraster (nur Desktop mit feinem Zeiger, 250-ms-Takt),
// Sichtzeit je Abschnitt, berührte Formularfelder (NUR Namen), ungültige
// Felder (Name), JS-Fehler (Typ, Chunk, Zeile – nie Text), Ziele und
// Planer-Ereignisse aus event.js.
// Nie: Tastatur, Werte, Text, DOM, Zeitstempel des Geräts, User-Agent, IDs.
//
// Leistung (INP): alle Listener passiv; im pointerdown nur Koordinaten,
// Ziel und Zeit lesen, Selektor und Box im Leerlauf. Versand gebündelt per
// sendBeacon (text/plain, kein Preflight) bei hidden/pagehide, 30 Ereignissen
// oder 20 s; Pakete ≤ 16 KB.
import { einblickeConsentOf, readConsent } from "../attribution.js";
import { ENDPOINT, GRID_COLS, LIMITS as L, SESSION_KEY, SESSION_MS, deviceOf, routeExcluded } from "./config.js";
import { INTERACTIVE, ebSelector } from "./selector.js";

const W = window;
const D = document;
const ss = () => {
  try {
    return W.sessionStorage;
  } catch {
    return null;
  }
};
const now = () => Date.now();
const idle = (f) => (W.requestIdleCallback ? W.requestIdleCallback(f, { timeout: 400 }) : setTimeout(f, 30));
const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(v)));
const name40 = (s) => (/^[A-Za-z][\w-]{0,39}$/.test(s || "") ? s : "");

let on = false;
let S = null; // Sitzung { id, t, seq, n, last }
let P = null; // aktueller Seitenaufruf
let q = [];
let tick = 0;
let io = null;
const plStart = {};
let ac = null;
let channel = "";

function uuid() {
  if (W.crypto?.randomUUID) return W.crypto.randomUUID();
  const b = W.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function session() {
  let s = null;
  try {
    s = JSON.parse(ss()?.getItem(SESSION_KEY) || "null");
  } catch {
    s = null;
  }
  if (!s || typeof s.id !== "string" || !(now() - s.t < SESSION_MS)) s = { id: uuid(), t: now(), seq: 0, n: 0, last: "" };
  return s;
}
function save() {
  try {
    ss()?.setItem(SESSION_KEY, JSON.stringify(S));
  } catch {
    /* gesperrt: Sitzung lebt im Speicher weiter */
  }
}

function push(ev) {
  if (!on || !P) return;
  q.push(ev);
  if (q.length >= L.flushEvents) flush();
}

function send(e) {
  S.seq += 1;
  S.t = now();
  save();
  const body = JSON.stringify({ v: 1, sid: S.id, seq: S.seq, pv: P.i, e });
  let ok = false;
  try {
    ok = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }));
  } catch {
    ok = false;
  }
  if (!ok) fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "same-origin", headers: { "content-type": "text/plain" } }).catch(() => {});
}

function addMs(el, ms) {
  const s = P.sel.get(el);
  if (s) P.att.set(s, Math.min(L.sectionMsCap, (P.att.get(s) || 0) + ms));
}

/** Momentaufnahmen des Seitenaufrufs (kumulativ; der Server nimmt die letzte). */
function snapshot() {
  const t = now();
  for (const [el, since] of P.vis) {
    if (since) addMs(el, t - since);
    P.vis.set(el, D.visibilityState === "visible" ? t : 0);
  }
  depth();
  q.push(["sc", { max: Math.floor(P.max * 20) * 5 }]);
  if (P.cells.size) q.push(["m", [...P.cells].map(([k, n]) => [k % 1000, Math.floor(k / 1000), n])]);
  if (P.att.size) q.push(["a", [...P.att].filter(([, ms]) => ms > 0).slice(0, 60).map(([s, ms]) => [s, Math.round(ms)])]);
  for (const [f, v] of P.forms) q.push(["fo", { f, b: v.b, l: v.l }]);
}

function flush(final) {
  if (!on || !P) return;
  if (!einblickeConsentOf(readConsent(D.cookie))) return stop();
  if (final) snapshot();
  let part = [];
  let size = 60;
  for (const ev of q) {
    const n = JSON.stringify(ev).length + 1;
    if (part.length && (size + n > L.packetBytes - 200 || part.length >= L.eventsPerPacket)) {
      send(part);
      part = [];
      size = 60;
    }
    if (n < L.packetBytes - 260) (part.push(ev), (size += n));
  }
  if (part.length) send(part);
  q = [];
}

function depth() {
  const h = D.documentElement.scrollHeight || 1;
  P.max = Math.max(P.max, Math.min(1, (W.scrollY + W.innerHeight) / h));
}

function scan() {
  if (!P || !io) return;
  for (const el of D.querySelectorAll("[data-eb],main section[id],main section[aria-labelledby],header,footer")) {
    if (P.sel.size >= 60) break;
    if (P.sel.has(el)) continue;
    const s = ebSelector(el, "sec");
    if (!s) continue;
    P.sel.set(el, s);
    io.observe(el);
  }
}

/** Neuer Seitenaufruf (erster Aufruf und jede SPA-Navigation). */
export function nav(path) {
  if (!on) return;
  if (P) {
    if (P.path === path) return;
    flush(true);
  }
  io?.disconnect();
  P = null;
  if (routeExcluded(path)) return;
  S = session();
  S.n += 1;
  const vw = W.innerWidth;
  P = { i: S.n, path, dc: deviceOf(vw), clicks: 0, max: 0, cells: new Map(), att: new Map(), sel: new Map(), vis: new Map(), forms: new Map(), rc: [], err: 0, samples: 0, inv: new Set(), mx: -1, my: 0, moved: false, scrolled: true };
  const pv = { p: path.slice(0, 200), dc: P.dc, vw, vh: W.innerHeight, dh: D.documentElement.scrollHeight };
  if (S.last) pv.prev = S.last.slice(0, 200);
  if (S.n === 1 && channel) pv.ch = channel;
  S.last = path;
  save();
  push(["pv", pv]);
  io = new IntersectionObserver(
    (entries) => {
      const t = now();
      for (const en of entries) {
        if (en.isIntersecting) P.vis.set(en.target, D.visibilityState === "visible" ? t : 0);
        else if (P.vis.has(en.target)) {
          const since = P.vis.get(en.target);
          if (since) addMs(en.target, t - since);
          P.vis.delete(en.target);
        }
      }
    },
    { threshold: 0.5 }
  );
  setTimeout(scan, 800);
  setTimeout(scan, 4000);
}

function onDown(e) {
  if (!P || P.clicks >= L.clicksPerView || !e.isPrimary) return;
  const tg = e.target;
  const x = e.clientX;
  const cy = e.clientY;
  const y = cy + W.scrollY;
  const t = performance.now();
  const page = P;
  // Toter Klick: Beobachtung muss VOR dem click-Handler der Seite starten.
  let dead = null;
  if (tg?.closest && !tg.closest(INTERACTIVE) && !tg.closest("[data-eb-ignore]")) {
    dead = { m: false, a: D.activeElement };
    const mo = new MutationObserver(() => (dead.m = true));
    mo.observe(tg.closest("section") || tg.parentElement || D.body, { subtree: true, childList: true, attributes: true, characterData: true });
    setTimeout(() => {
      mo.disconnect();
      dead.done = true;
      if (!dead.m && D.activeElement === dead.a && P === page && dead.s) push(["sg", { k: "dead", s: dead.s }]);
    }, L.deadWaitMs);
  }
  idle(() => {
    if (P !== page) return;
    const pair = ebSelector(tg, "pair");
    if (!pair) return;
    const [s, el] = pair;
    const r = el.getBoundingClientRect();
    page.clicks += 1;
    if (dead) dead.s = s;
    push(["c", { s, ex: clamp(((x - r.left) / (r.width || 1)) * 1000, 1000), ey: clamp(((cy - r.top) / (r.height || 1)) * 1000, 1000), col: clamp((x / W.innerWidth) * GRID_COLS - 0.5, GRID_COLS - 1), y: clamp(y, 4e4) }]);
    page.rc = page.rc.filter((c) => t - c.t <= L.rageMs);
    page.rc.push({ x, y, t });
    if (page.rc.filter((c) => Math.hypot(c.x - x, c.y - y) <= L.ragePx).length === L.rageCount) push(["sg", { k: "rage", s }]);
  });
}

function field(e) {
  const el = e.target;
  if (!el?.form || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || /^(password|hidden)$/i.test(el.type) || el.closest("[data-eb-ignore]")) return null;
  const fm = el.form;
  const f = name40(fm.getAttribute("data-eb-form")) || name40(fm.getAttribute("name")) || name40(fm.id) || "form";
  const n = name40(el.getAttribute("name")) || name40(el.id);
  return n ? [f, n] : null;
}

function onFocus(e) {
  const fn = P && field(e);
  if (!fn) return;
  const v = P.forms.get(fn[0]) || { b: [], l: "" };
  if (!v.b.includes(fn[1]) && v.b.length < 30) v.b.push(fn[1]);
  v.l = fn[1];
  P.forms.set(fn[0], v);
}

function onInvalid(e) {
  const fn = P && field(e);
  if (!fn || P.inv.has(fn.join(":"))) return;
  P.inv.add(fn.join(":"));
  push(["fi", { f: fn[0], n: fn[1] }]);
}

function onError(e) {
  if (!P || P.err >= L.errorsPerView) return;
  P.err += 1;
  const err = e.error || e.reason;
  const t = /^[A-Za-z]{1,30}$/.test(err?.name || "") ? err.name : e.reason !== undefined ? "Rejection" : "Error";
  const file = String(e.filename || "");
  const ev = { t };
  if (file) ev.src = file.startsWith(location.origin) ? (file.split("?")[0].split("/").pop() || "").replace(/[^\w.-]/g, "").slice(0, 60) || "inline" : "fremd";
  if (e.lineno) ev.l = clamp(e.lineno, 1e7);
  push(["err", ev]);
}

/** Einträge aus event.js (window.__phEb). */
function take([name, d]) {
  if (name === "ziel") push(["g", d.f ? { t: d.t, f: name40(d.f) || "form" } : { t: d.t }]);
  else if (name === "planer") {
    if (d.a === "start") plStart[d.n] = now();
    const ev = { n: d.n, a: d.a };
    if (d.s !== undefined) ev.s = String(d.s);
    if (d.p) ev.p = String(d.p);
    if (plStart[d.n]) ev.d = clamp((now() - plStart[d.n]) / 1000, 86400);
    push(["pl", ev]);
  } else if (name === "form_error") push(["fe", { f: name40(d.f) || "form", st: clamp(d.st, 599) }]);
}

/**
 * Startet den Sammler. `ch` = Kanal-Label der Herkunft (channelOf aus
 * attribution.js, vom Lader übergeben – so bleibt die Kanalregel aus diesem Chunk).
 */
export function start(path, ch) {
  if (on) return nav(path);
  channel = typeof ch === "string" ? ch.slice(0, 40) : "";
  on = true;
  ac = new AbortController();
  const opt = { passive: true, capture: true, signal: ac.signal };
  const pending = Array.isArray(W.__phEb) ? W.__phEb : [];
  W.__phEb = { push: (e) => P && take(e) };
  nav(path);
  pending.forEach((e) => W.__phEb.push(e));
  const fine = W.matchMedia?.("(pointer: fine)").matches;
  D.addEventListener("pointerdown", onDown, opt);
  D.addEventListener("focusin", onFocus, opt);
  D.addEventListener("invalid", onInvalid, opt);
  W.addEventListener("scroll", () => P && (P.scrolled = true), opt);
  if (fine) D.addEventListener("pointermove", (e) => P && ((P.mx = e.clientX), (P.my = e.clientY + W.scrollY), (P.moved = true)), opt);
  W.addEventListener("error", onError, { signal: ac.signal });
  W.addEventListener("unhandledrejection", onError, { signal: ac.signal });
  D.addEventListener("visibilitychange", () => (D.visibilityState === "hidden" ? flush(true) : P && P.vis.forEach((_, el) => P.vis.set(el, now()))), { signal: ac.signal });
  W.addEventListener("pagehide", () => flush(true), { signal: ac.signal });
  let since = now();
  tick = setInterval(() => {
    if (!P || D.visibilityState !== "visible") return;
    if (P.scrolled) (depth(), (P.scrolled = false));
    if (P.moved && P.dc === "d" && P.samples !== L.moveSamplesPerView) {
      P.samples = (P.samples || 0) + 1;
      const k = Math.floor(P.my / 40) * 1000 + clamp((P.mx / W.innerWidth) * GRID_COLS - 0.5, GRID_COLS - 1);
      P.cells.set(k, (P.cells.get(k) || 0) + 1);
      P.moved = false;
    }
    if (now() - since >= L.flushMs) {
      since = now();
      if (q.length) flush();
    }
  }, L.moveTickMs);
}

/** Widerruf: sofort aus, Warteschlange verwerfen, Sitzungs-ID löschen. */
export function stop() {
  on = false;
  ac?.abort();
  clearInterval(tick);
  io?.disconnect();
  q = [];
  P = null;
  S = null;
  try {
    ss()?.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  W.__phEb = undefined;
}
