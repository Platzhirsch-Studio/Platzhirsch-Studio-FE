import { Media, cx } from "@/components/ui";
import HubPicture from "./HubPicture";
import { hubImageId } from "./hubImage";

// Bild einer Feature-Karte: eigene Ansicht aus dem Werkzeug (public/bilder/leistungen,
// Bildschirmfotos der eigenen Oberflächen, kein Herstellerbild) oder eine
// eigene, gezeichnete Grafik (`feature.visual`), wo es kein freigegebenes Bild
// gibt: AR-Viewer (Beispielmodelle passen nicht zur Marke, Herstellermodelle
// ohne Freigabe), Stil-Finder (Einstiegsfotos ohne Freigabe für diese
// Nutzung), Outdoor (Seite ohne Foto). Mosaik bleibt als Rückfallgrafik. Server-Komponente, kein Client-JS.
// Alle Grafiken sind deterministisch (keine Zufallszahl zur Laufzeit).

// Ezarri: Glasmosaik, 12 × 8 Steine in Seeblau-Tönen.
const SEA = ["#4f6b68", "#5f7d79", "#6f8f8a", "#87a39d", "#a7bdb7", "#c9d6d1", "#3e5654"];
function Mosaic() {
  const cells = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
      const fill = SEA[(x * 7 + y * 13 + ((x * y) % 5)) % SEA.length];
      cells.push(<rect key={`${x}-${y}`} x={x * 10 + 0.6} y={y * 10 + 0.6} width="8.8" height="8.8" fill={fill} />);
    }
  }
  return <g>{cells}</g>;
}

// Stil-Finder: vier Farbpaletten als Streifen, wie die Farbfrage des Quiz.
const PALETTES = [
  ["#ece8e1", "#d8d2c8", "#8a8174", "#3f3129"],
  ["#f7f5f1", "#c9d6d1", "#4f6b68", "#1f252b"],
  ["#e6e1d8", "#d1b250", "#7a5f17", "#30373e"],
  ["#faf8f4", "#b9a48f", "#6b4f3f", "#2b2420"],
];
function Palettes() {
  return (
    <g>
      <rect width="120" height="80" fill="#faf8f4" />
      {PALETTES.map((p, row) =>
        p.map((c, i) => <rect key={`${row}-${i}`} x={10 + i * 25} y={8 + row * 16.5} width="25" height="13" fill={c} />)
      )}
    </g>
  );
}

// Outdoor: Höhenlinien wie auf der Outdoor-Seite, Moos auf Kalkstein.
function Contours() {
  const lines = [];
  for (let i = 0; i < 9; i++) {
    const y = 12 + i * 8;
    const a = 6 + (i % 3) * 3;
    lines.push(
      <path
        key={i}
        d={`M-5 ${y} C 25 ${y - a}, 45 ${y + a}, 65 ${y} S 105 ${y - a}, 125 ${y + 2}`}
        fill="none"
        stroke={i % 3 === 0 ? "#4f6b68" : "#8a8174"}
        strokeWidth={i % 3 === 0 ? 0.8 : 0.4}
      />
    );
  }
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      {lines}
    </g>
  );
}

// AR-Viewer: Würfel (Möbel als Volumen) auf isometrischem Bodenraster, mit
// Maßlinien für Breite, Tiefe und Höhe wie im Viewer („Maße einblenden“).
// Endstriche statt Pfeilspitzen: keine <marker>-ids, die auf einer Seite mit
// mehreren Karten kollidieren könnten.
const ISO = 0.5774; // tan 30°
const pts = (...p) => p.map(([x, y]) => `${x},${y}`).join(" ");
function Dim({ a, b, tick }) {
  const [tx, ty] = tick;
  return (
    <g stroke="#7a5f17" strokeWidth="0.5" fill="none">
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      <line x1={a[0] - tx} y1={a[1] - ty} x2={a[0] + tx} y2={a[1] + ty} />
      <line x1={b[0] - tx} y1={b[1] - ty} x2={b[0] + tx} y2={b[1] + ty} />
    </g>
  );
}
function Measure() {
  const grid = [];
  for (let i = -8; i <= 16; i++) {
    const c = i * 8;
    grid.push(<line key={`a${i}`} x1="0" y1={c} x2="120" y2={c - 120 * ISO} />);
    grid.push(<line key={`b${i}`} x1="0" y1={c - 40} x2="120" y2={c - 40 + 120 * ISO} />);
  }
  // Ecken: F vorne unten, R rechts unten, L links unten, *t oben, Bt hinten oben.
  const F = [60, 62], R = [80.3, 50.3], L = [44.4, 53];
  const h = 22;
  const up = ([x, y]) => [x, y - h];
  const Ft = up(F), Rt = up(R), Lt = up(L), Bt = [64.7, 41.3 - h];
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      <g stroke="#d8d2c8" strokeWidth="0.35">{grid}</g>
      <g stroke="#1f252b" strokeWidth="0.5" strokeLinejoin="round">
        <polygon points={pts(L, F, Ft, Lt)} fill="#87a39d" />
        <polygon points={pts(F, R, Rt, Ft)} fill="#c9d6d1" />
        <polygon points={pts(Ft, Rt, Bt, Lt)} fill="#f7f5f1" />
      </g>
      <Dim a={[F[0] + 5.2, F[1] + 3]} b={[R[0] + 5.2, R[1] + 3]} tick={[0.9, 1.5]} />
      <Dim a={[F[0] - 5.2, F[1] + 3]} b={[L[0] - 5.2, L[1] + 3]} tick={[-0.9, 1.5]} />
      <Dim a={[R[0] + 6, R[1]]} b={[Rt[0] + 6, Rt[1]]} tick={[1.5, 0]} />
    </g>
  );
}

// Bodensee-Licht: Sonnenbahn über dem Horizont mit drei Stundenpunkten.
function Sun() {
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      <rect y="58" width="120" height="22" fill="#c9d6d1" />
      <line x1="0" y1="58" x2="120" y2="58" stroke="#4f6b68" strokeWidth="0.6" />
      <path d="M14 58 C 34 10, 86 10, 106 58" fill="none" stroke="#7a5f17" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <circle cx="38" cy="30" r="1.6" fill="#7a5f17" />
      <circle cx="60" cy="22" r="5" fill="#d1b250" />
      <circle cx="82" cy="30" r="1.6" fill="#7a5f17" />
      <path d="M44 58 L 60 70 L 76 58" fill="#87a39d" opacity="0.6" />
    </g>
  );
}

// Showroom-Rundgang: Grundriss mit sechs Stationen und Laufweg.
const STATIONS = [[22, 22], [52, 18], [92, 24], [96, 56], [60, 60], [24, 56]];
function Plan() {
  return (
    <g>
      <rect width="120" height="80" fill="#faf8f4" />
      <rect x="8" y="8" width="104" height="64" fill="none" stroke="#1f252b" strokeWidth="0.8" />
      <line x1="70" y1="8" x2="70" y2="40" stroke="#1f252b" strokeWidth="0.6" />
      <polyline points={STATIONS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#7a5f17" strokeWidth="0.5" strokeDasharray="2 1.5" />
      {STATIONS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.4" fill="#4f6b68" />
          <text x={x} y={y + 1.3} textAnchor="middle" fontSize="3.6" fill="#faf8f4">{i + 1}</text>
        </g>
      ))}
    </g>
  );
}

// Für KI-Assistenten: Knoten (Katalog, Showroom, Termin) am Haus.
function Nodes() {
  const n = [[24, 22], [96, 22], [24, 60], [96, 60]];
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      {n.map(([x, y], i) => <line key={i} x1="60" y1="40" x2={x} y2={y} stroke="#8a8174" strokeWidth="0.5" />)}
      {n.map(([x, y], i) => <rect key={i} x={x - 7} y={y - 5} width="14" height="10" fill="#faf8f4" stroke="#1f252b" strokeWidth="0.5" />)}
      <circle cx="60" cy="40" r="8" fill="#4f6b68" />
    </g>
  );
}

// Runde 5 (ux P1-4): Upload und Portal als Piktogramm statt Demo-Screenshot.
// Handy-Upload: Handy mit Kamerasucher, daneben drei Fotos auf dem Weg ins Studio.
function Phone() {
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      <rect x="26" y="12" width="30" height="56" rx="4" fill="#faf8f4" stroke="#1f252b" strokeWidth="0.6" />
      <rect x="30" y="20" width="22" height="34" fill="#c9d6d1" />
      <path d="M33 23h4M33 23v4M49 23h-4M49 23v4M33 51h4M33 51v-4M49 51h-4M49 51v-4" stroke="#1f252b" strokeWidth="0.5" fill="none" />
      <circle cx="41" cy="61" r="2.4" fill="none" stroke="#1f252b" strokeWidth="0.5" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={68 + i * 9} y={22 + i * 9} width="18" height="13" fill="#faf8f4" stroke="#8a8174" strokeWidth="0.5" />
      ))}
      <path d="M58 40 C 64 40, 66 34, 70 30" stroke="#4f6b68" strokeWidth="0.6" fill="none" strokeDasharray="1.5 1.5" />
    </g>
  );
}

// Kundenportal: Mappe mit drei Registern (Termine, Dokumente, Nachrichten) und Schlüssel.
function Folder() {
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={30 + i * 16} y={16} width="14" height="6" fill={i === 1 ? "#4f6b68" : "#d8d2c8"} />
      ))}
      <rect x="26" y="22" width="68" height="44" fill="#faf8f4" stroke="#1f252b" strokeWidth="0.6" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="34" y1={32 + i * 8} x2={i === 3 ? 62 : 78} y2={32 + i * 8} stroke="#8a8174" strokeWidth="0.5" />
      ))}
      <circle cx="80" cy="56" r="4" fill="none" stroke="#4f6b68" strokeWidth="0.8" />
      <path d="M84 56h8M89 56v3M91 56v2" stroke="#4f6b68" strokeWidth="0.8" fill="none" />
    </g>
  );
}

// Pflege-Service: Sessel im Profil, daneben ein gefaltetes Tuch und ein Tropfen Pflegemittel.
function Care() {
  return (
    <g>
      <rect width="120" height="80" fill="#ece8e1" />
      <path d="M28 30 h30 a4 4 0 0 1 4 4 v14 h-38 v-14 a4 4 0 0 1 4 -4 z" fill="#faf8f4" stroke="#1f252b" strokeWidth="0.6" />
      <rect x="20" y="40" width="46" height="12" rx="2" fill="#d8d2c8" stroke="#1f252b" strokeWidth="0.6" />
      <path d="M24 52v8M62 52v8" stroke="#1f252b" strokeWidth="0.6" />
      <path d="M78 54h22l-4 6h-22z" fill="#c9d6d1" stroke="#8a8174" strokeWidth="0.5" />
      <path d="M89 24 C 85 31, 84 34, 84 37 a5 5 0 0 0 10 0 C 94 34, 93 31, 89 24 z" fill="none" stroke="#4f6b68" strokeWidth="0.8" />
    </g>
  );
}

const GRAPHICS = { mosaic: Mosaic, palette: Palettes, contours: Contours, measure: Measure, sun: Sun, plan: Plan, nodes: Nodes, phone: Phone, folder: Folder, care: Care };
const LABELS = {
  mosaic: "gezeichnete Mosaik-Grafik",
  palette: "gezeichnete Farbpaletten",
  contours: "gezeichnete Höhenlinien",
  measure: "gezeichneter Würfel mit Maßlinien auf einem Bodenraster",
  sun: "gezeichnete Sonnenbahn über dem Horizont",
  plan: "gezeichneter Grundriss mit sechs Stationen",
  nodes: "gezeichnete Verbindungen zwischen Katalog, Showroom und Termin",
  phone: "gezeichnetes Handy mit Kamerasucher und drei Fotos auf dem Weg zum Studio",
  folder: "gezeichnete Projektmappe mit Registern und Schlüssel",
  care: "gezeichneter Sessel mit Pflegetuch und einem Tropfen Pflegemittel",
};

/**
 * @param {object} feature  Eintrag aus src/lib/features.js
 * @param {string} sizes    echte Layoutbreite für next/image
 */
// Fix-Runde 1 (F2): Für die 3D-Ansicht statt des gezeichneten Würfels ein echtes
// Vorschaubild aus dem Viewer – das frei lizenzierte Beispielmodell (CC0, kein
// Herstellerprodukt) mit Maßlinien wie bei „Maße einblenden“.
// Erzeugt aus public/labs/ar-viewer/posters/mid_century_lounge_chair.webp.
const OWN_IMAGES = {
  measure: { src: "/bilder/leistungen/3d-ansicht.webp", alt: "3D-Ansicht: Sessel als 3D-Beispielmodell mit eingeblendeten Maßen, Breite 101 cm und Höhe 117 cm" },
};

export default function FeatureVisual({ feature: raw, sizes, className }) {
  const own = !raw.image?.src && OWN_IMAGES[raw.visual];
  const feature = own ? { ...raw, image: raw.ownImageAlt ? { ...own, alt: raw.ownImageAlt } : own } : raw; // ownImageAlt: EN/FR/IT (landing-kern)
  const hubId = hubImageId(feature.image?.src);
  if (hubId) {
    // P6 Runde 2: eigene Kartenbilder in festen Größen, ohne /_next/image.
    return (
      <HubPicture
        id={hubId}
        alt={feature.image.alt}
        sizes={sizes}
        className={cx("border border-line", className)}
        imgClassName="transition-transform duration-(--duration-enter) ease-quiet group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    );
  }
  if (feature.image?.src) {
    return (
      <Media
        src={feature.image.src}
        alt={feature.image.alt}
        ratio="3/2"
        sizes={sizes}
        className={cx("border border-line", className)}
        imgClassName="transition-transform duration-(--duration-enter) ease-quiet group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    );
  }
  const kind = GRAPHICS[feature.visual] ? feature.visual : "mosaic";
  const Graphic = GRAPHICS[kind];
  return (
    <div className={cx("relative aspect-[3/2] overflow-hidden border border-line bg-linen", className)}>
      <svg
        viewBox="0 0 120 80"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`${feature.title}: ${feature.visualLabel || LABELS[kind]}`}
        className="absolute inset-0 size-full"
      >
        <Graphic />
      </svg>
    </div>
  );
}
