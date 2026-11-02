// Kino-Lab „3D-Bühne“ – Drehbuch: Kapitel über den Scrollweg, Kamera je Kapitel.
// Rein (ohne React/three), geteilt von Kino3D (Titelkarten) und Scene (Kamera).
//
// Kamera: Zielpunkt t (Meter, Modellkoordinaten, Front = +z) und Kugel-
// koordinaten um t: az (Drehung um die Hochachse, 0 = von vorn), el (Höhe),
// d (Abstand). cut = harter Schnitt beim Eintritt (kein Kamera-Gleiten).

export const PALETTE = {
  paper: "#faf8f4",
  bone: "#f7f5f1",
  stone: "#ece8e1",
  inkDeep: "#1f252b",
  walnut: "#3f3129",
  see: "#4f6b68",
  brass400: "#d1b250",
  brass500: "#9a7a2a",
  brass700: "#7a5f17",
};

const SOFA = [0, 0.36, 0];
const CHAIR = [0, 0.5, 0];

export const CHAPTERS = [
  // 0 Erst die Linie – Bleistift, dann Volumen
  { id: "linie", from: 0, to: 0.14, cam: [{ t: SOFA, az: -0.5, el: 0.15, d: 5.0 }, { t: SOFA, az: -0.4, el: 0.19, d: 4.1 }] },
  // 1 Dann Ihr Raum – Kamera umkreist das Sofa
  { id: "raum", from: 0.14, to: 0.32, cam: [{ t: SOFA, az: -0.4, el: 0.19, d: 4.1 }, { t: SOFA, az: 1.25, el: 0.36, d: 3.6 }] },
  // 2 Schnitt aufs Detail: Capitonné-Rücken
  { id: "detail", from: 0.32, to: 0.46, cut: true, cam: [{ t: [0.2, 0.52, -0.08], az: 0.75, el: 0.34, d: 1.95 }, { t: [-0.3, 0.5, -0.08], az: 0.2, el: 0.26, d: 1.75 }] },
  // 3 Szenenwechsel: der Sessel materialisiert sich
  { id: "wechsel", from: 0.46, to: 0.64, cut: true, cam: [{ t: CHAIR, az: -1.05, el: 0.22, d: 3.7 }, { t: CHAIR, az: 0.3, el: 0.17, d: 3.1 }] },
  // 4 Abend am See: Leuchte an, warmes Licht
  { id: "abend", from: 0.64, to: 0.8, cam: [{ t: CHAIR, az: 0.3, el: 0.17, d: 3.1 }, { t: [0, 0.85, 0], az: 0.8, el: 0.1, d: 3.9 }] },
  // 5 Welten
  { id: "welten", from: 0.8, to: 0.92, cam: [{ t: [0, 0.85, 0], az: 0.8, el: 0.1, d: 3.9 }, { t: [0.1, 0.6, 0], az: 1.55, el: 0.4, d: 5.0 }] },
  // 6 Termin
  { id: "termin", from: 0.92, to: 1.0001, cam: [{ t: [0.1, 0.6, 0], az: 1.55, el: 0.4, d: 5.0 }, { t: [0.1, 0.6, 0], az: 2.25, el: 0.22, d: 4.4 }] },
];

export const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const ease = (x) => x * x * (3 - 2 * x);

export function chapterAt(p) {
  let index = CHAPTERS.length - 1;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (p < CHAPTERS[i].to) {
      index = i;
      break;
    }
  }
  const c = CHAPTERS[index];
  return { index, local: clamp((p - c.from) / (c.to - c.from)) };
}
