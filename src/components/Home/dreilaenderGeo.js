// Geometry of the four-country map (pure module, no JSX – node --test and the
// sprite generator can load it). Moved out of DreilaenderMap.js (R5-fix P2).
const LON0 = 8.82;
const LAT0 = 47.86;
const KX = 600 * Math.cos((47.5 * Math.PI) / 180);
const KY = 600;
export const px = ({ lat, lon }) => [Math.round((lon - LON0) * KX * 10) / 10, Math.round((LAT0 - lat) * KY * 10) / 10];

// Rat 9,5 (B18, gesamtwerk M10, bewusst geändert): the real shoreline from
// OpenStreetMap (bodenseeShore.js, simplified, © OpenStreetMap-Mitwirkende)
// replaces the hand-traced ~70 shore points and the Catmull-Rom curves. One
// path: the outer ring (Obersee, Überlinger See, Untersee) plus the islands
// as holes (fill-rule evenodd).
import { SHORE_INNER, SHORE_OUTER } from "./bodenseeShore.js";

const RHEIN = [
  [47.503, 9.6], [47.47, 9.625], [47.43, 9.64], [47.39, 9.63], [47.35, 9.6], [47.3, 9.555], [47.25, 9.523],
  [47.2, 9.505], [47.14, 9.5], [47.06, 9.49],
];

// closed (or open) Catmull-Rom spline through the points → cubic Béziers
const r1 = (n) => Math.round(n * 10) / 10;
export function curve(pts, closed = true) {
  const p = pts.map(([lat, lon]) => px({ lat, lon }));
  const n = p.length;
  const at = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${p[0][0]} ${p[0][1]}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [r1(p1[0] + (p2[0] - p0[0]) / 6), r1(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [r1(p2[0] - (p3[0] - p1[0]) / 6), r1(p2[1] - (p3[1] - p1[1]) / 6)];
    d += `C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return closed ? `${d}Z` : d;
}

// R5-fix P2 (HTML size of /de, technik): the four water shapes (~3.7 KB of
// path data) were written into the HTML AND again into the RSC payload. They
// now live once in a static, cacheable sprite (MAP_SPRITE) and are drawn with
// <use>; colour comes from the class on the <use> (fill/stroke inherit into
// the referenced path, which sets none). The sprite file is generated from
// the same data – tests/unit/r9-p2-html-size.test.mjs checks it is current:
//   node --input-type=module -e "import { mapSprite } from './src/components/Home/dreilaenderGeo.js'; import fs from 'node:fs'; fs.writeFileSync('public/Images/Home/dreilaender-map.svg', mapSprite())"
// Labels, dots and lines stay inline (localized, tokens).
export const MAP_SPRITE = "/Images/Home/dreilaender-map.svg";
/** Closed polygon(s) as straight segments in map units ("M…L…Z" per ring). */
export function rings(list) {
  return list
    .map((ring) => ring.map(([lat, lon], i) => {
      const [x, y] = px({ lat, lon });
      return `${i ? "L" : "M"}${x} ${y}`;
    }).join("") + "Z")
    .join("");
}
export const MAP_SHAPES = {
  see: () => rings([...SHORE_OUTER, ...SHORE_INNER]),
  rhein: () => curve(RHEIN, false),
};
const SHAPE_ATTRS = { see: ' fill-rule="evenodd"' };
/** Content of public/Images/Home/dreilaender-map.svg. */
export function mapSprite() {
  const paths = Object.entries(MAP_SHAPES)
    .map(([id, d]) => `<path id="${id}"${SHAPE_ATTRS[id] || ""} d="${d()}"/>`)
    .join("");
  // Legacy ids for other callers (Landing/schema/StadtMap.js, Team T3) until
  // they use "#see": "obersee" now points to the whole lake, the old
  // "untersee" and "reichenau" shapes are part of it and stay empty.
  const legacy = '<use id="obersee" href="#see"/><g id="untersee"/><g id="reichenau"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${paths}${legacy}</svg>
`;
}

