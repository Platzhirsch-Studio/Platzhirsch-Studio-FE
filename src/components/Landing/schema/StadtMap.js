// Stadtseiten (Rat 9,5 B7, gesamtwerk M4): Kartenausschnitt mit der Linie vom
// Ort nach Lochau. Formen und Projektion kommen unverändert aus
// src/components/Home/dreilaenderGeo.js (nur gelesen): See und Rhein über das
// statische Sprite (MAP_SPRITE, <use>), Orte über px(lat, lon). Die Linie ist
// eine Luftlinie als Schema, keine Fahrstrecke und keine Fahrzeit (Bibel §12.4:
// Fahrzeiten nur mit „ca.“ und Stand aus OSRM – nicht hier).
// Vier Ausschnitte: mobil 3:1 (flaches Band über der H1), ab sm 5:2, Telefon quer 5:1, ab lg 4:3.
import { MAP_SPRITE, px } from "@/components/Home/dreilaenderGeo";

export const LOCHAU = { lat: 47.5303, lon: 9.7517 };

// Öffentliche Ortskoordinaten (Stadtzentrum, auf 0,001° gerundet).
export const CITY_COORDS = {
  "/designermoebel-bregenz": { name: "Bregenz", lat: 47.503, lon: 9.747 },
  "/designermoebel-dornbirn": { name: "Dornbirn", lat: 47.414, lon: 9.742 },
  "/designermoebel-friedrichshafen": { name: "Friedrichshafen", lat: 47.654, lon: 9.479 },
  "/designermoebel-st-gallen": { name: "St. Gallen", lat: 47.424, lon: 9.377 },
  // Lindau: Altstadt auf der Insel – die vereinfachte OSM-Uferlinie hat die Insel nicht,
  // darum zeichnet MapSvg sie als kleine Landfläche (island, Mittelpunkt/Halbachsen in °).
  "/designermoebel-lindau": { name: "Lindau", lat: 47.546, lon: 9.684, island: { lat: 47.5455, lon: 9.6835, rLat: 0.0035, rLon: 0.0075 } },
  "/designermoebel-kempten": { name: "Kempten", lat: 47.727, lon: 10.314 },
  "/designermoebel-ravensburg": { name: "Ravensburg", lat: 47.782, lon: 9.612 },
  "/designermoebel-konstanz": { name: "Konstanz", lat: 47.66, lon: 9.175 },
  "/designermoebel-feldkirch": { name: "Feldkirch", lat: 47.238, lon: 9.598 },
  "/designermoebel-liechtenstein": { name: "Vaduz", lat: 47.141, lon: 9.521 },
};

const shape = (id) => `${MAP_SPRITE}#${id}`;

/** viewBox um Ort und Lochau mit Rand, im Seitenverhältnis ratio (Breite/Höhe), Mindestbreite minW. */
// QM R1: bei nahen Orten (Bregenz 3 km, Lindau 5 km) lagen die Punkte bei festem Rand
// (60) und Mindestbreite (330) aufeinander. Rand und Mindestbreite wachsen jetzt mit dem
// Abstand – nahe Orte werden größer gezeigt, ferne Ausschnitte bleiben wie bisher.
export function mapBox(a, b, ratio, minW = 240) {
  const [ax, ay] = px(a);
  const [bx, by] = px(b);
  const dist = Math.hypot(ax - bx, ay - by);
  const pad = Math.min(60, Math.max(10, dist * 0.5));
  // QM R3: höchstens so weit vergrößern, dass die vereinfachte Uferlinie (Stützpunkte alle
  // 3–5 Einheiten) nicht als eckiger Polygonzug erscheint – Untergrenze 150 statt 80.
  const minWidth = Math.min(minW, Math.max(150, dist * 4));
  const w = Math.max(minWidth, Math.abs(ax - bx) + 2 * pad, (Math.abs(ay - by) + 2 * pad) * ratio);
  const h = w / ratio;
  const cx = (ax + bx) / 2;
  const cy = (ay + by) / 2;
  return [cx - w / 2, cy - h / 2, w, h].map((n) => Math.round(n * 10) / 10);
}

function MapSvg({ city, ratio, minW, font, scale = 1, className }) {
  const [x, y, w] = mapBox(city, LOCHAU, ratio, minW);
  const h = Math.round((w / ratio) * 10) / 10;
  const [cx, cy] = px(city);
  const [lx, ly] = px(LOCHAU);
  // Strich- und Schriftmaß relativ zur Mindestbreite; `scale` gleicht breitere Kästen aus
  // (Tablet/Handy quer: sonst wuchsen Punkte und Ortsnamen mit der Kastenbreite auf ~36 px).
  const k = (w / 240) * scale;
  const left = cx < lx;
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      {/* Rat 9,5 B18 (Auftrag T4 → T3): echte OSM-Uferlinie, ein Pfad mit Inseln als Löcher (fill-rule im Sprite). */}
      {/* QM R3: Strichstärke in Karteneinheiten × k – vector-effect wirkt nicht in den <use>-Inhalt,
          die Kontur wuchs beim Vergrößern naher Orte mit (Bregenz, Lindau). */}
      <use href={shape("see")} className="fill-see/15 stroke-see/60" strokeWidth={0.6 * k} strokeLinejoin="round" />
      {city.island && (() => {
        const [ix, iy] = px(city.island);
        const [ex] = px({ lat: city.island.lat, lon: city.island.lon + city.island.rLon });
        const [, ey] = px({ lat: city.island.lat - city.island.rLat, lon: city.island.lon });
        return <ellipse cx={ix} cy={iy} rx={ex - ix} ry={ey - iy} className="fill-surface-raised stroke-see/60" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
      })()}
      {/* Rhein durchgezogen (QM R1: gestrichelt las er sich wie eine zweite Route). */}
      <use href={shape("rhein")} className="fill-none stroke-see/60" strokeWidth={0.6 * k} strokeLinejoin="round" />
      <path d={`M${cx} ${cy} L${lx} ${ly}`} className="fill-none stroke-brass-500" strokeWidth="1.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
      <circle cx={cx} cy={cy} r={4 * k} className="fill-ink" />
      <circle cx={lx} cy={ly} r={11 * k} className="fill-none stroke-ink/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r={4.5 * k} className="fill-ink" />
      <text x={cx + (left ? -9 : 9) * k} y={cy + 4 * k} textAnchor={left ? "end" : "start"} className="fill-text" style={{ fontSize: font * k }}>
        {city.name}
      </text>
      <text x={lx + (left ? 15 : -15) * k} y={ly - 9 * k} textAnchor={left ? "start" : "end"} className="fill-text font-semibold" style={{ fontSize: font * k }}>
        Lochau
      </text>
    </svg>
  );
}

/** Kartenausschnitt Ort → Lochau. Rendert nichts für unbekannte Pfade. */
export default function StadtMap({ path }) {
  const city = CITY_COORDS[path];
  if (!city) return null;
  return (
    <>
      <MapSvg city={city} ratio={3} minW={330} font={11} className="block size-full sm:hidden" />
      {/* QM R3: Ausschnitt = Rahmen (StudioSchema): ab sm 5:2 (iPad hoch), Telefon quer 5:1 – vorher
          zeigte der 5:1-Ausschnitt im höheren Rahmen nur einen Streifen, der See lief oben hinaus. */}
      <MapSvg city={city} ratio={2.5} minW={330} font={11} scale={0.45} className="hidden size-full sm:block lg:hidden! [@media(orientation:landscape)_and_(max-height:30rem)]:hidden!" />
      <MapSvg city={city} ratio={5} minW={400} font={11} scale={0.45} className="hidden size-full [@media(orientation:landscape)_and_(max-height:30rem)]:block! lg:hidden!" />
      <MapSvg city={city} ratio={4 / 3} minW={330} font={9} className="hidden size-full lg:block" />
    </>
  );
}
