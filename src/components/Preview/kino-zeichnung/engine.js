// Kino-Lab 3 – Zeichen-Engine (rein, ohne React).
//
// Zwei Canvas-Ebenen über dem Bild:
//   ink – die gezeichnete Linie. Inkrementell: pro Frame kommen nur die neuen
//         Segmente dazu (kein Neuzeichnen der ganzen Szene → 60 fps).
//   fx  – pro Frame gelöscht: glühende Spur an der Federspitze, Funken,
//         nach dem Zeichnen Lichtstaub und weiche Bokeh-Scheiben (nur Hero).
// Pfade kommen aus dem statischen SVG (dieselben <path>, die die ruhige
// Fassung zeigt) und werden einmal mit getPointAtLength abgetastet.
// Farben = Markenpalette (globals.css): Brass-400 #d1b250, Brass-500
// #9a7a2a, Paper #faf8f4 – nur auf dunklem Grund.

const BRASS = "209,178,80";
const BRASS_500 = "154,122,42";
const PAPER = "250,248,244";
const STEP = 3; // Abtastabstand in viewBox-Einheiten

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (u) => u * u * (3 - 2 * u);

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sprite(rgb, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${PAPER},1)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.85)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/**
 * @param {object} o
 * @param {SVGSVGElement} o.svg      statische Zeichnung (Quelle der Pfade)
 * @param {HTMLCanvasElement} o.ink
 * @param {HTMLCanvasElement} o.fx
 * @param {HTMLElement} o.panel      Fläche, auf die Canvas und Bild passen
 * @param {[number, number]} o.viewBox
 * @param {[number, number]} o.licht Lichtpunkt (viewBox)
 * @param {"cover"|"contain"} o.fit
 * @param {boolean} o.hero           Hero: längere Zeichnung, Staub bleibt
 * @param {(p: "draw"|"fill"|"done") => void} o.onPhase
 */
export function createEngine({ svg, ink, fx, panel, viewBox, licht, fit, hero, onPhase }) {
  const [vw, vh] = viewBox;
  const mobil = window.matchMedia("(max-width: 47.99rem)").matches;
  const ictx = ink.getContext("2d");
  const fctx = fx.getContext("2d");
  const rnd = mulberry(7);
  const glow = sprite(BRASS);

  // ── Pfade abtasten ───────────────────────────────────────────────────
  const strokes = [...svg.querySelectorAll("path")].map((p, i) => {
    const len = p.getTotalLength();
    const n = Math.max(2, Math.ceil(len / STEP) + 1);
    const pts = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) {
      const pt = p.getPointAtLength((len * k) / (n - 1));
      pts[2 * k] = pt.x;
      pts[2 * k + 1] = pt.y;
    }
    return { pts, n, len, w: Number(p.dataset.w || 1), g: p.dataset.g === "1", seed: i * 1.913 + 0.37, done: 0, t0: 0, t1: 0 };
  });

  // ── Zeitplan: Tempo wie eine Hand – Linie für Linie, kurze Absetzer ──
  const DRAW = hero ? (mobil ? 4600 : 6200) : 3000;
  const FILL = hero ? 2200 : 1700;
  const weight = (s) => s.len * (s.g ? 0.45 : 1);
  const total = strokes.reduce((a, s) => a + weight(s), 0) || 1;
  const lift = Math.min(70, (DRAW * 0.22) / Math.max(1, strokes.length));
  const speed = total / (DRAW - lift * strokes.length);
  let tt = 0;
  for (const s of strokes) {
    s.t0 = tt;
    s.t1 = tt + weight(s) / speed;
    tt = s.t1 + lift;
  }

  // ── Geometrie ────────────────────────────────────────────────────────
  let dpr = 1;
  let W = 0;
  let H = 0;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  const basePx = hero ? (mobil ? 1.7 : 2.3) : mobil ? 1.6 : 2;

  function setVB(ctx) {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
  }

  function jit(s, k, axis) {
    const a = 0.85 / scale; // leichtes Zittern ≈ 0,85 px
    const ph = s.seed * (axis ? 2.3 : 1);
    return a * (Math.sin(k * 0.11 + ph) + 0.5 * Math.sin(k * 0.37 + ph * 1.7));
  }

  function pressure(s, k) {
    if (s.g) return 0.55;
    const u = k / (s.n - 1);
    return (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * clamp(u)), 0.45)) * (0.9 + 0.12 * Math.sin(k * 0.23 + s.seed));
  }

  function drawSeg(s, to) {
    to = Math.min(to, s.n);
    if (to <= s.done) return;
    const from = Math.max(1, s.done);
    const { pts } = s;
    const X = (k) => pts[2 * k] + jit(s, k, 0);
    const Y = (k) => pts[2 * k + 1] + jit(s, k, 1);
    const jump = (k) => {
      const dx = pts[2 * k] - pts[2 * k - 2];
      const dy = pts[2 * k + 1] - pts[2 * k - 1];
      return dx * dx + dy * dy > STEP * STEP * 9; // Teilpfad-Sprung = Feder abgesetzt
    };
    // Halbtransparente Ebenen als EIN Pfad pro Abschnitt – sonst addieren
    // sich die Rundkappen der Einzelsegmente zu einer Perlenkette.
    const polyline = () => {
      ictx.beginPath();
      ictx.moveTo(X(from - 1), Y(from - 1));
      for (let k = from; k < to; k++) {
        if (jump(k)) ictx.moveTo(X(k), Y(k));
        else ictx.lineTo(X(k), Y(k));
      }
      ictx.stroke();
    };
    ictx.lineCap = "round";
    ictx.lineJoin = "round";
    if (s.g) {
      ictx.globalCompositeOperation = "source-over";
      ictx.strokeStyle = `rgba(${BRASS_500},0.6)`;
      ictx.lineWidth = (basePx * 0.55) / scale;
      polyline();
      s.done = to;
      return;
    }
    const mid = pressure(s, Math.floor((from + to) / 2));
    ictx.globalCompositeOperation = "lighter";
    ictx.strokeStyle = `rgba(${BRASS},0.07)`;
    ictx.lineWidth = (basePx * s.w * mid * 5) / scale;
    polyline();
    // Kern: deckend, Segment für Segment mit eigener Strichstärke (Druck)
    ictx.globalCompositeOperation = "source-over";
    ictx.strokeStyle = `rgb(${BRASS})`;
    for (let k = from; k < to; k++) {
      if (jump(k)) continue;
      ictx.lineWidth = (basePx * s.w * pressure(s, k)) / scale;
      ictx.beginPath();
      ictx.moveTo(X(k - 1), Y(k - 1));
      ictx.lineTo(X(k), Y(k));
      ictx.stroke();
    }
    s.done = to;
  }

  function resize() {
    // clientWidth statt getBoundingClientRect: die Kamerafahrt skaliert per transform
    const r = { width: panel.clientWidth, height: panel.clientHeight };
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, mobil ? 1.5 : 2);
    W = r.width;
    H = r.height;
    for (const c of [ink, fx]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    scale = fit === "cover" ? Math.max(W / vw, H / vh) : Math.min(W / vw, H / vh);
    ox = (W - vw * scale) / 2;
    oy = (H - vh * scale) / 2;
    panel.style.setProperty("--lx", `${(licht[0] * scale + ox).toFixed(1)}px`);
    panel.style.setProperty("--ly", `${(licht[1] * scale + oy).toFixed(1)}px`);
    setVB(ictx);
    for (const s of strokes) {
      const upto = s.done;
      s.done = 0;
      drawSeg(s, upto);
    }
  }

  // ── Partikel ─────────────────────────────────────────────────────────
  const sparks = [];
  const dust = [];
  const bokeh = [];
  const MAX_SPARKS = mobil ? 45 : 110;

  function seedDust() {
    const n = hero ? (mobil ? 26 : 64) : mobil ? 14 : 30;
    for (let i = 0; i < n; i++) {
      dust.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.3) * 0.12, vy: -0.05 - rnd() * 0.12, r: 0.6 + rnd() * 1.8, a: 0.15 + rnd() * 0.45, ph: rnd() * 6.28 });
    }
    if (hero) {
      for (let i = 0; i < (mobil ? 4 : 8); i++) {
        bokeh.push({ x: rnd() * W, y: H * (0.15 + rnd() * 0.8), vx: (rnd() - 0.5) * 0.06, r: 18 + rnd() * 46, a: 0.04 + rnd() * 0.07 });
      }
    }
  }

  // ── Schleife ─────────────────────────────────────────────────────────
  let phase = "idle";
  let clock = 0;
  let last = null;
  let fillAt = 0;
  let raf = 0;
  let visible = true;
  let tip = null;

  function advance() {
    tip = null;
    for (const s of strokes) {
      if (clock < s.t0 || s.done >= s.n) continue;
      const u = clamp((clock - s.t0) / (s.t1 - s.t0));
      const e = 0.62 * u + 0.38 * smooth(u);
      drawSeg(s, Math.floor(e * (s.n - 1)) + 1);
      if (u < 1) tip = s;
    }
  }

  function renderFx(dt) {
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, W, H);
    fctx.globalCompositeOperation = "lighter";

    if (phase === "draw" && tip && !tip.g) {
      // glühende Spur: die letzten Punkte heller nachziehen
      const s = tip;
      const end = s.done;
      const start = Math.max(1, end - 26);
      setVB(fctx);
      fctx.lineCap = "round";
      for (let k = start; k < end; k++) {
        const f = (k - start) / (end - start);
        const lw = (basePx * s.w * pressure(s, k)) / scale;
        fctx.strokeStyle = `rgba(${PAPER},${0.65 * f})`;
        fctx.lineWidth = lw * 0.6;
        fctx.beginPath();
        fctx.moveTo(s.pts[2 * k - 2], s.pts[2 * k - 1]);
        fctx.lineTo(s.pts[2 * k], s.pts[2 * k + 1]);
        fctx.stroke();
      }
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tx = s.pts[2 * end - 2] * scale + ox;
      const ty = s.pts[2 * end - 1] * scale + oy;
      const r = mobil ? 16 : 24;
      fctx.globalAlpha = 0.9;
      fctx.drawImage(glow, tx - r, ty - r, 2 * r, 2 * r);
      if (sparks.length < MAX_SPARKS) {
        for (let i = 0; i < 2; i++) {
          const a = rnd() * 6.28;
          const v = 0.2 + rnd() * 0.9;
          sparks.push({ x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.25, life: 0, max: 450 + rnd() * 700, r: 1 + rnd() * 2.2 });
        }
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life += dt;
      if (p.life >= p.max) {
        sparks.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy -= 0.0006 * dt; // Glut steigt
      const a = 1 - p.life / p.max;
      fctx.globalAlpha = a * 0.8;
      fctx.drawImage(glow, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
    }

    if (phase !== "draw") {
      const t = clock * 0.001;
      for (const b of bokeh) {
        b.x += b.vx * dt;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        fctx.globalAlpha = b.a * (phase === "fill" ? clamp((clock - fillAt) / FILL) : 1);
        fctx.drawImage(glow, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      for (const d of dust) {
        d.x += d.vx * dt * 0.06 + Math.sin(t + d.ph) * 0.05;
        d.y += d.vy * dt * 0.06;
        if (d.y < -4) d.y = H + 4;
        if (d.x > W + 4) d.x = -4;
        if (d.x < -4) d.x = W + 4;
        fctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(t * 1.3 + d.ph));
        fctx.drawImage(glow, d.x - d.r * 2.5, d.y - d.r * 2.5, d.r * 5, d.r * 5);
      }
    }
    fctx.globalAlpha = 1;
  }

  function frame(now) {
    raf = 0;
    const dt = last === null ? 16 : Math.min(50, now - last);
    last = now;
    clock += dt;
    if (phase === "draw") {
      advance();
      if (clock >= tt) {
        phase = "fill";
        fillAt = clock;
        seedDust();
        onPhase("fill");
      }
    } else if (phase === "fill" && clock - fillAt >= FILL) {
      phase = "done";
      onPhase("done");
      if (!hero) {
        // Herstellerbild bleibt unverändert: nichts mehr darüber zeichnen
        fctx.setTransform(1, 0, 0, 1, 0, 0);
        fctx.clearRect(0, 0, fx.width, fx.height);
        return;
      }
    }
    renderFx(dt);
    schedule();
  }

  function schedule() {
    if (!raf && visible && !document.hidden && phase !== "idle") raf = requestAnimationFrame(frame);
  }

  function onVis() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      last = null;
      schedule();
    }
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(panel);
  document.addEventListener("visibilitychange", onVis);
  resize();

  return {
    start() {
      if (phase !== "idle") return;
      phase = "draw";
      onPhase("draw");
      schedule();
    },
    setVisible(v) {
      visible = v;
      if (!v) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        last = null;
        schedule();
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      ictx.setTransform(1, 0, 0, 1, 0, 0);
      ictx.clearRect(0, 0, ink.width, ink.height);
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, fx.width, fx.height);
    },
  };
}
