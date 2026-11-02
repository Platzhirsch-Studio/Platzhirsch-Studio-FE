// „Die Linie“ – die Schema-Grafik der Seite /de/arbeitsweise (Konzept §5).
//
// EINE abstrakte 1-px-Linie erzählt das Prinzip „vom Strich zum Raum“:
//   1 Raumumriss · 2 Sonnenbogen (Licht im Tagesverlauf) · 3 Grundriss mit Tür,
//   Sofa, Tisch · 4 Isometrie, die Wände richten sich auf (Modell) ·
//   5 Drahtmodell mit 50-cm-Raster und Maßketten · 6 Drahtmodell tritt zurück
//   (Rendering) · 7 zurück zur Horizontlinie.
// Das ist REINE GRAFIK, beschriftet als „Schema“. Sie ist KEINE Skizze und
// imitiert keinen Handstrich (kein Zittern, keine Bleistift-Textur): Haralds
// echte Zeichnungen kommen nur über src/lib/arbeitsweise/media.js.
// Maßzahlen sind feste Schemawerte ohne Projektbezug.
//
// Zustand über data-phase (1–7) am Wurzelelement; die Übergänge sind CSS
// (transform, opacity, clip-path – Bibel §8.2), Reduced Motion schaltet sie ab.
// Kein "use client": rendert im Server (mobile Standbilder) und in der Insel
// Werkstrecke (Desktop, Phase folgt dem sichtbaren Schritt).
import styles from "./arbeitsweise.module.css";

const cx = (...p) => p.filter(Boolean).join(" ");

// Rasterlinien alle 25 Einheiten (= 50 cm bei 4,80 × 3,60 m).
const GRID_X = [25, 50, 75, 100, 125, 150, 175, 200, 225];
const GRID_Y = [25, 50, 75, 100, 125, 150, 175];

/**
 * @param {1|2|3|4|5|6|7} phase
 * @param {"light"|"dark"} [tone="light"] dark = Messing auf Walnut (nur im dunklen Kapitel)
 * @param {boolean} [reveal] mobiles Standbild: zeichnet sich beim Scrollen ein (CSS view())
 */
export default function Linie({ phase = 1, tone = "light", reveal = false, className, style }) {
  return (
    <div
      aria-hidden="true"
      data-phase={phase}
      data-linie=""
      className={cx(styles.linie, tone === "dark" && styles.linieDark, reveal && styles.linieReveal, className)}
      style={style}
    >
      {/* Sonnenbogen: flach, nicht in der Isometrie */}
      <svg className={styles.sun} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" focusable="false">
        <path className={styles.sunArc} d="M14 26 A36 20 0 0 1 86 26" />
        <g className={styles.sunRays}>
          <path d="M16.2 19.2 L46 27" />
          <path d="M50 6 L51.3 27" />
          <path d="M83.8 19.2 L57 27" />
        </g>
        <circle className={styles.sunDot} style={{ "--i": 0 }} cx="16.2" cy="19.2" r="1.4" />
        <circle className={styles.sunDot} style={{ "--i": 1 }} cx="50" cy="6" r="1.4" />
        <circle className={styles.sunDot} style={{ "--i": 2 }} cx="83.8" cy="19.2" r="1.4" />
      </svg>

      <div className={styles.stage}>
        <div className={styles.plane}>
          <svg className={styles.floor} viewBox="0 0 240 180" preserveAspectRatio="none" focusable="false">
            {/* Raster 50 cm */}
            <g className={styles.grid}>
              {GRID_X.map((x) => (
                <path key={`x${x}`} d={`M${x} 0 V180`} />
              ))}
              {GRID_Y.map((y) => (
                <path key={`y${y}`} d={`M0 ${y} H240`} />
              ))}
            </g>
            {/* Raumumriss mit Fensterlücke (Norden) und Türlücke (Süden) */}
            <g className={styles.room}>
              <path style={{ "--i": 0 }} d="M0 180 V0 H90" />
              <path style={{ "--i": 1 }} d="M160 0 H240 V90" />
              <path style={{ "--i": 2 }} d="M240 90 V180 H110" />
              <path style={{ "--i": 3 }} d="M60 180 H0" />
              <path style={{ "--i": 4 }} className={styles.window} d="M90 -3 H160 M90 3 H160" />
            </g>
            {/* Tür mit Schwenkbogen */}
            <g className={styles.door}>
              {/* Bodenkontur an der Tür geschlossen, damit die Isometrie keine Lücke zeigt (feedback-2 P3-7) */}
              <path className={styles.soft} d="M60 180 H110" />
              <path d="M60 180 V130" />
              <path className={styles.soft} d="M60 130 A50 50 0 0 1 110 180" />
            </g>
            {/* Sofa und Tisch als einfache Körper */}
            <g className={styles.furniture}>
              <path style={{ "--i": 0 }} d="M138 116 H222 V160 H138 Z M138 128 H222" />
              <circle style={{ "--i": 1 }} cx="78" cy="70" r="24" />
              <path style={{ "--i": 2 }} className={styles.soft} d="M112 70 H124 M32 70 H44 M78 36 V24 M78 104 V116" />
            </g>
            {/* Maßketten mit Endstrichen – feste Schemawerte */}
            <g className={styles.dims}>
              {/* an den offenen Seiten (Süd, West), damit die Wände sie nicht verdecken */}
              <path d="M0 202 H240 M-4 206 L4 198 M236 206 L244 198" />
              <text x="120" y="222" textAnchor="middle">
                4,80 m
              </text>
              <path d="M-22 0 V180 M-26 4 L-18 -4 M-26 184 L-18 176" />
              {/* rotate(90), nicht -90: nach der Isometrie (rotateZ -45°) liest sich die
                  Zahl von oben links nach unten rechts statt kopfüber (feedback-1 P2-3). */}
              <text x="-38" y="90" textAnchor="middle" transform="rotate(90 -38 90)">
                3,60 m
              </text>
            </g>
          </svg>
        </div>
        {/* Wände (nur Rand, durchsichtig): richten sich in Phase 4 auf. Eigene
            Ebene neben dem Grundriss mit vollständiger 3D-Matrix je Wand – kein
            preserve-3d, das WebKit sonst teils flach rechnet. */}
        <div className={styles.walls}>
          <div className={cx(styles.wall, styles.wallN)}>
            <span className={styles.wallWindow} />
          </div>
          <div className={cx(styles.wall, styles.wallE)} />
        </div>
      </div>

      {/* Phase 7: zurück zur Horizontlinie */}
      <div className={styles.horizon} />
    </div>
  );
}

// Bildausschnitt je Phase für Standbilder (feedback-2 P3-2): die flachen
// Phasen brauchen kein Quadrat. top = Versatz der Grafik in % der Breite,
// damit der Inhalt mittig im Ausschnitt steht. Isometrie (4–6) bleibt 1:1.
export const CROP = {
  1: { ratio: "4 / 3", top: 12.5 },
  2: { ratio: "4 / 3", top: 2 },
  3: { ratio: "4 / 3", top: 12.5 },
  7: { ratio: "16 / 9", top: 5 },
};

/** Standbild der Linie im passenden Ausschnitt (Auftakt, mobile Schritte). */
export function LinieFrame({ phase = 1, tone = "light", reveal = false, className }) {
  const crop = CROP[phase];
  if (!crop) return <Linie phase={phase} tone={tone} reveal={reveal} className={className} />;
  return (
    <div aria-hidden="true" className={cx(styles.frame, className)} style={{ aspectRatio: crop.ratio }}>
      <Linie phase={phase} tone={tone} reveal={reveal} style={{ marginTop: `-${crop.top}%` }} />
    </div>
  );
}
