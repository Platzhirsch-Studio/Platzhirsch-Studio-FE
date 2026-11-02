// Kino-Lab „Showroom-Film“ – WebGL-Kamera über das eigene Showroom-Foto.
// Ein Fullscreen-Dreieck, ein Fragment-Shader: Cover-Kadrierung mit Kamera
// (Mitte + Zoom), 2.5D-Dolly über eine geschätzte Tiefe (Fluchtpunkt im Bild),
// Tiefenunschärfe mit Fokuswechsel, Licht, das durch die Vorhänge wandert,
// Staub im Licht, anamorphe Lichtstreifen, Abendlicht, Wasserlicht (Szene 4),
// Körnung, Vignette und Schnitt-Abblende. Farben nur aus der Markenpalette
// (globals.css): Ink-deep, Walnut, Stone, Bone, Paper, See, Brass-400.
// Reines Modul ohne React, damit Film.js schlank bleibt.

export const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexSize;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCam;      // Bildmitte (x, y; y nach unten) + Zoom
uniform vec2 uPointer;  // -1..1, gedämpft
uniform float uDolly;
uniform float uFocus;   // Tiefe im Fokus (0 fern, 1 nah)
uniform float uBlur;    // max. Radius in Pixel
uniform float uPhoto;
uniform float uGrade;
uniform float uEvening;
uniform float uLight;
uniform float uDust;
uniform float uStreak;
uniform float uWater;
uniform float uDip;

const vec3 INK_DEEP = vec3(0.1216, 0.1451, 0.1686);
const vec3 WALNUT   = vec3(0.2471, 0.1922, 0.1608);
const vec3 STONE    = vec3(0.9255, 0.9098, 0.8824);
const vec3 BONE     = vec3(0.9686, 0.9608, 0.9451);
const vec3 SEE      = vec3(0.3098, 0.4196, 0.4078);
const vec3 BRASS    = vec3(0.8196, 0.6980, 0.3137);
const vec2 VP       = vec2(0.56, 0.42); // Fluchtpunkt im Foto

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// geschätzte Tiefe: 0 am Fluchtpunkt (fern), 1 vorne unten (nah)
float depthAt(vec2 img) {
  vec2 d = (img - VP) * vec2(0.9, 1.7);
  return clamp(length(d) * 1.15 + max(img.y - 0.75, 0.0) * 0.8, 0.0, 1.0);
}

float dust(vec2 sp, float scale, float speed, float seed) {
  vec2 q = sp * vec2(uRes.x / uRes.y, 1.0) * scale;
  q.y -= uTime * speed;
  q.x += sin(q.y * 0.6 + uTime * 0.17 + seed) * 0.35;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(id + seed);
  vec2 o = vec2(hash(id + 1.3 + seed), hash(id + 7.1 + seed)) - 0.5;
  float dd = length(f - o * 0.7);
  float tw = 0.55 + 0.45 * sin(uTime * (0.8 + h * 1.6) + h * 6.2831);
  return step(0.78, h) * smoothstep(0.075, 0.0, dd) * tw;
}

void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y); // Bildschirm, y nach unten
  float sa = uRes.x / uRes.y;
  float ia = uTexSize.x / uTexSize.y;
  vec2 vis = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  vec2 img = uCam.xy + (sp - 0.5) * vis / uCam.z;

  float d = depthAt(img);
  // 2.5D: Nahes wächst beim Dolly stärker als Fernes, Zeiger verschiebt nach Tiefe
  vec2 im2 = VP + (img - VP) / (1.0 + uDolly * d * 0.16);
  im2 += uPointer * vec2(0.012, 0.008) * (d - 0.35);

  // Tiefenunschärfe (Bokeh, helle Punkte wiegen mehr)
  float r = uBlur * abs(d - uFocus) / uRes.y * vis.y / uCam.z;
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float a = fi * 2.39996;
    float rr = sqrt((fi + 0.5) / 12.0);
    vec2 o = vec2(cos(a) * uTexSize.y / uTexSize.x, sin(a)) * rr * r;
    vec3 c = texture2D(uTex, clamp(im2 + o, 0.001, 0.999)).rgb;
    float w = 1.0 + smoothstep(0.6, 1.0, lum(c)) * 3.0;
    col += c * w;
    wsum += w;
  }
  col /= wsum;

  // Licht wandert durch die Vorhänge (links + hinten)
  float pos = mod(uTime * 0.022, 1.7) - 0.35;
  float curtain = smoothstep(0.46, 0.38, im2.x) * smoothstep(0.02, 0.09, im2.y) * smoothstep(0.80, 0.66, im2.y);
  curtain += 0.6 * smoothstep(0.40, 0.44, im2.x) * smoothstep(0.66, 0.60, im2.x) * smoothstep(0.26, 0.30, im2.y) * smoothstep(0.50, 0.44, im2.y);
  float proj = im2.x * 0.95 + im2.y * 0.32;
  float band = exp(-pow((proj - pos) * 5.5, 2.0));
  float folds = 0.7 + 0.3 * sin(im2.x * 230.0 + sin(im2.y * 4.0 + uTime * 0.3) * 2.0);
  float lightC = curtain * band * folds * (0.35 + lum(col));
  float pool = exp(-pow((im2.x - (pos * 0.7 + 0.15)) * 4.5, 2.0)) * smoothstep(0.70, 0.86, im2.y) * 0.5;
  col += (lightC * 0.38 + pool * 0.10) * mix(BONE, BRASS, 0.18) * uLight;

  // anamorphe Lichtstreifen aus hellen Spots
  float st = 0.0;
  for (int k = -6; k <= 6; k++) {
    float fk = float(k);
    vec2 o = vec2(fk * 0.018 * vis.x / uCam.z, 0.0);
    float l = lum(texture2D(uTex, clamp(im2 + o, 0.001, 0.999)).rgb);
    st += smoothstep(0.86, 1.0, l) * (1.0 - abs(fk) / 7.0);
  }
  col += BRASS * st * 0.06 * uStreak;

  // Markenpalette: Schatten Ink-deep, Mitten Walnut, Lichter Stone/Bone
  float g = lum(col);
  vec3 toned = mix(INK_DEEP, WALNUT, smoothstep(0.0, 0.35, g));
  toned = mix(toned, STONE, smoothstep(0.30, 0.85, g));
  toned = mix(toned, BONE, smoothstep(0.85, 1.0, g));
  col = mix(col, toned, 0.38 * uGrade);

  // Abend: warm, Fenster dunkel, Leuchte glüht
  col *= mix(vec3(1.0), vec3(1.05, 0.84, 0.62) * 0.82, uEvening);
  col *= 1.0 - curtain * 0.55 * uEvening;
  vec2 lampD = (im2 - vec2(0.506, 0.35)) * vec2(ia, 1.0);
  float glow = exp(-dot(lampD, lampD) * 90.0) * (0.85 + 0.15 * sin(uTime * 1.1));
  col += BRASS * glow * 0.45 * uEvening;

  col *= uPhoto;

  // Wasser & Wärme: Wasserlicht aus See und Brass auf Ink-deep
  if (uWater > 0.001) {
    vec2 q = sp * vec2(sa, 1.0) * 2.6;
    float t = uTime * 0.28;
    for (int j = 0; j < 3; j++) {
      q += vec2(sin(q.y * 1.4 + t), cos(q.x * 1.2 - t * 0.9)) * 0.42;
    }
    float ca = pow(abs(sin(q.x) * cos(q.y)), 3.0);
    vec3 water = INK_DEEP + SEE * ca * 0.55 + BRASS * pow(ca, 4.0) * 0.18;
    float edge = smoothstep(0.15, 0.75, length((sp - 0.5) * vec2(sa, 1.0)) / max(sa, 1.0) * 1.6);
    col = mix(col, water * (0.7 + 0.3 * edge), uWater);
  }

  // Staub im Licht: in einer schrägen Lichtbahn
  float shaft = exp(-pow((sp.x - sp.y * 0.45 - (pos - 0.05)) * 3.2, 2.0));
  float dd = dust(sp, 18.0, 0.010, 0.0) + dust(sp + 3.7, 9.0, 0.016, 5.0) * 0.8;
  col += BONE * dd * (0.12 + shaft * 0.5) * uDust * 0.55;

  // Vignette, Körnung, Abblende
  float v = smoothstep(1.15, 0.30, length((vUv - 0.5) * vec2(1.25, 1.0)));
  col *= mix(0.5, 1.0, v);
  col += (hash(vUv * uRes + fract(uTime * 7.31) * 113.0) - 0.5) * 0.055;
  col = mix(col, INK_DEEP * 0.6, uDip);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// Szenen-Drehbuch: Kamera (von → nach, Querformat L / Hochformat P) und Licht.
// m (0..1) mischt von → nach: Scrollen in der Szene + langsame Zeitdrift.
export const SCENES = [
  // 1 Die Linie – weit, ruhig, dunkler, damit die Bleistiftlinie trägt
  { L: [[0.5, 0.5, 1.0], [0.52, 0.48, 1.08]], P: [[0.44, 0.52, 1.0], [0.47, 0.5, 1.08]], dolly: [0, 0.5], focus: [0.25, 0.25], blur: 2.5, photo: 0.62, grade: 1, evening: 0, light: 1, dust: 1, streak: 0.6, water: 0 },
  // 2 Der Raum – Dolly in den Raum, Fokus wandert von nah nach fern
  { L: [[0.5, 0.56, 1.0], [0.55, 0.46, 1.4]], P: [[0.5, 0.58, 1.0], [0.54, 0.47, 1.3]], dolly: [0, 1.2], focus: [0.95, 0.12], blur: 7, photo: 0.9, grade: 0.6, evening: 0, light: 1, dust: 0.8, streak: 1, water: 0 },
  // 3 Titelkarte Minotti – Kaminwand, ganz in Unschärfe
  { L: [[0.78, 0.46, 1.15], [0.7, 0.44, 1.22]], P: [[0.8, 0.48, 1.0], [0.74, 0.46, 1.08]], dolly: [0.3, 0.6], focus: [-0.6, -0.6], blur: 9, photo: 0.4, grade: 1, evening: 0.2, light: 0.4, dust: 0.6, streak: 1.3, water: 0 },
  // 4 Wasser & Wärme – kein Foto, nur Wasserlicht um die Herstellerbilder
  { L: [[0.5, 0.5, 1], [0.5, 0.5, 1]], P: [[0.5, 0.5, 1], [0.5, 0.5, 1]], dolly: [0, 0], focus: [0, 0], blur: 0, photo: 0, grade: 1, evening: 0, light: 0, dust: 0.45, streak: 0, water: 1 },
  // 5 Abend im Café – Abendlicht um die Leuchte
  { L: [[0.5, 0.4, 1.55], [0.51, 0.37, 1.8]], P: [[0.5, 0.42, 1.25], [0.51, 0.39, 1.45]], dolly: [0.2, 0.6], focus: [0.1, 0.1], blur: 6, photo: 0.95, grade: 0.8, evening: 1, light: 0, dust: 0.6, streak: 1.4, water: 0 },
  // 6 Abspann – dunkel, weich
  { L: [[0.5, 0.5, 1.1], [0.48, 0.5, 1.16]], P: [[0.5, 0.5, 1.0], [0.48, 0.5, 1.06]], dolly: [0, 0.3], focus: [-1, -1], blur: 12, photo: 0.28, grade: 1, evening: 0.4, light: 0.3, dust: 0.5, streak: 0.8, water: 0 },
];

const mix = (a, b, t) => a + (b - a) * t;

/**
 * Uniform-Werte für Scroll-Position p (0 = Szene 1 oben, 1 = Szene 2 …),
 * Zeit t (s), Seitenverhältnis von Bild und Bildschirm.
 */
export function sceneState(p, t, screenAspect, imageAspect) {
  const last = SCENES.length - 1;
  const s = Math.min(last, Math.max(0, Math.round(p)));
  const local = p - s + 0.5; // 0..1 innerhalb der Szene
  const sc = SCENES[s];
  const drift = 0.5 + 0.5 * Math.sin(t * 0.055 + s * 1.7);
  const m = Math.min(1, Math.max(0, 0.15 + local * 0.45 + drift * 0.4));
  const cam = (screenAspect < 1 ? sc.P : sc.L).map((v) => v.slice());
  let cx = mix(cam[0][0], cam[1][0], m);
  let cy = mix(cam[0][1], cam[1][1], m);
  const zoom = mix(cam[0][2], cam[1][2], m);
  // Kamera im Bild halten (kein Rand)
  const vis = screenAspect > imageAspect ? [1, imageAspect / screenAspect] : [screenAspect / imageAspect, 1];
  const hx = vis[0] / zoom / 2 + 0.012;
  const hy = vis[1] / zoom / 2 + 0.012;
  cx = Math.min(1 - hx, Math.max(hx, cx));
  cy = Math.min(1 - hy, Math.max(hy, cy));
  // Schnitt: kurze Abblende an jeder Szenengrenze (nicht am Anfang/Ende)
  const edgeIn = s > 0 ? Math.min(1, local / 0.07) : 1;
  const edgeOut = s < last ? Math.min(1, (1 - local) / 0.07) : 1;
  const dip = 1 - Math.min(edgeIn, edgeOut);
  return {
    scene: s,
    cam: [cx, cy, zoom],
    dolly: mix(sc.dolly[0], sc.dolly[1], m),
    focus: mix(sc.focus[0], sc.focus[1], Math.min(1, Math.max(0, local * 1.2 - 0.1) * 0.6 + drift * 0.4)),
    blur: sc.blur,
    photo: sc.photo,
    grade: sc.grade,
    evening: sc.evening,
    light: sc.light,
    dust: sc.dust,
    streak: sc.streak,
    water: sc.water,
    dip: dip * dip * (3 - 2 * dip),
  };
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || "shader");
  }
  return sh;
}

/** Baut das Programm; wirft, wenn WebGL fehlt (dann bleibt die ruhige Fassung). */
export function createFilmRenderer(canvas, image) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) throw new Error("webgl");
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  const names = ["uTex", "uTexSize", "uRes", "uTime", "uCam", "uPointer", "uDolly", "uFocus", "uBlur", "uPhoto", "uGrade", "uEvening", "uLight", "uDust", "uStreak", "uWater", "uDip"];
  const u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)]));
  gl.uniform1i(u.uTex, 0);
  gl.uniform2f(u.uTexSize, image.naturalWidth || image.width, image.naturalHeight || image.height);

  return {
    gl,
    render(state, t, pointer) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, t);
      gl.uniform3f(u.uCam, state.cam[0], state.cam[1], state.cam[2]);
      gl.uniform2f(u.uPointer, pointer[0], pointer[1]);
      gl.uniform1f(u.uDolly, state.dolly);
      gl.uniform1f(u.uFocus, state.focus);
      // Unschärfe-Radius in Gerätepixeln
      gl.uniform1f(u.uBlur, state.blur * (canvas.height / 900) * 1.4);
      gl.uniform1f(u.uPhoto, state.photo);
      gl.uniform1f(u.uGrade, state.grade);
      gl.uniform1f(u.uEvening, state.evening);
      gl.uniform1f(u.uLight, state.light);
      gl.uniform1f(u.uDust, state.dust);
      gl.uniform1f(u.uStreak, state.streak);
      gl.uniform1f(u.uWater, state.water);
      gl.uniform1f(u.uDip, state.dip);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
