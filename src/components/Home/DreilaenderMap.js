// Schematic map of the four-country corner as inline SVG (server component,
// 0 KB JS). Adapted from the Dreiländereck prototype
// (components/Preview/dreilaendereck/DreilaenderMap.js, copied, not moved):
// real lat/lon, simplified equirectangular projection (cos 47.5°); lake and
// Rhine are drawn roughly – orientation, not a map.
//
// Rat 9,5 (B18): travel times now come from OSRM (bodenseeShore.js, "ca."
// with date, Bibel §12.4), shown as a list under the map. Deliberately NOT interactive:
// SVG labels cannot be 44 px touch targets (Jury P0.5); the links live in the
// list next to the map. Colours only from tokens.
import { MAP_SPRITE, px } from "./dreilaenderGeo.js";
import { DRIVE_MIN } from "./bodenseeShore.js";

const shape = (id) => `${MAP_SPRITE}#${id}`;
const LAKE_AT = { lat: 47.6, lon: 9.3 };

export const LOCHAU = { lat: 47.5303, lon: 9.7517 };
export const PLACES = [
  { id: "lindau", name: "Lindau", lat: 47.546, lon: 9.684, pos: "leftDown" },
  { id: "bregenz", name: "Bregenz", lat: 47.503, lon: 9.747, pos: "rightFar" },
  { id: "dornbirn", name: "Dornbirn", lat: 47.414, lon: 9.742, pos: "right" },
  { id: "friedrichshafen", name: "Friedrichshafen", lat: 47.654, lon: 9.479, pos: "top" },
  { id: "stgallen", name: "St. Gallen", lat: 47.424, lon: 9.377, pos: "left" },
  { id: "ravensburg", name: "Ravensburg", lat: 47.782, lon: 9.612, pos: "left" },
  { id: "vaduz", name: "Vaduz", lat: 47.141, lon: 9.521, pos: "left" },
];

// QM r2: "leftUp" lifts Lindau off the shoreline into the lake (Lindau is an
// island town); the lake name moved west of Friedrichshafen (LAKE_AT).
// QM shell-home r5: the Lochau → Friedrichshafen line ran through "Lindau"
// (Lindau lies almost on it) – the label now sits below-left, in the free
// wedge between that line and the one to St. Gallen. "Bregenz" and "Lochau"
// start outside the 22-unit circle around Lochau instead of touching it.
const offset = (pos) =>
  pos === "leftDown"
    ? { dx: -20, dy: 15, anchor: "end" }
    : pos === "rightFar"
      ? { dx: 26, dy: 6, anchor: "start" }
      : pos === "leftUp"
    ? { dx: -12, dy: -8, anchor: "end" }
    : pos === "left" ? { dx: -12, dy: 6, anchor: "end" } : pos === "top" ? { dx: 0, dy: -14, anchor: "middle" } : { dx: 12, dy: 6, anchor: "start" };

/**
 * @param {{title, desc, caption, lake, countries: {at, de, ch, li}}} labels localized
 */
export default function DreilaenderMap({ labels }) {
  const home = px(LOCHAU);
  return (
    <figure className="m-0">
      <svg viewBox="0 0 660 520" role="img" aria-labelledby="home-map-title home-map-desc" className="h-auto w-full">
        <title id="home-map-title">{labels.title}</title>
        <desc id="home-map-desc">{labels.desc}</desc>
        {/* Label sizes in SVG user units (px = units of the 660-wide viewBox):
            the SVG scales to ~0.52 at 375 px, so mobile uses larger units to
            stay at >= 12 px on screen (QA P3-9).
            QM shell-home r4 (200 % text): in rem the labels doubled while the
            map kept its size – "Ravensburg" lay over "DEUTSCHLAND", "Vaduz"
            over "SCHWEIZ". The labels belong to the picture and scale with it;
            every name and driving time is also real text in the list below
            and in the figure description (WCAG 1.4.4 via the text list). */}
        <g className="fill-text-soft text-[23px] tracking-[0.08em] sm:text-[15px] sm:tracking-[0.14em]">
          <text x="650" y="34" textAnchor="end">{labels.countries.de.toUpperCase()}</text>
          <text x="20" y="470">{labels.countries.ch.toUpperCase()}</text>
          <text x="650" y="440" textAnchor="end">{labels.countries.at.toUpperCase()}</text>
          <text x="200" y="508">{labels.countries.li.toUpperCase()}</text>
        </g>
        {/* B18: real shoreline (OSM), islands as holes – one shape. */}
        <use href={shape("see")} className="fill-see/15 stroke-see/60" strokeWidth="1" strokeLinejoin="round" />
        <use href={shape("rhein")} className="fill-none stroke-see/60" strokeWidth="1.5" strokeDasharray="4 4" />
        <text
          x={px(LAKE_AT)[0]}
          y={px(LAKE_AT)[1]}
          textAnchor="middle"
          className="fill-see text-[24px] italic sm:text-[18px]"
        >
          {labels.lake}
        </text>

        {PLACES.map((c) => {
          const [x, y] = px(c);
          const { dx, dy, anchor } = offset(c.pos);
          return (
            <g key={c.id}>
              <path d={`M${home[0]} ${home[1]} L${x} ${y}`} className="stroke-line-strong" strokeWidth="1" />
              <circle cx={x} cy={y} r="4.5" className="fill-ink" />
              <text x={x + dx} y={y + dy} textAnchor={anchor} className="fill-text text-[23px] sm:text-[17px]">
                {c.name}
              </text>
            </g>
          );
        })}

        <circle cx={home[0]} cy={home[1]} r="22" className="fill-none stroke-ink/30" strokeWidth="1" />
        <circle cx={home[0]} cy={home[1]} r="8" className="fill-ink" />
        <text x={home[0] + 26} y={home[1] - 14} className="fill-text text-[25px] font-semibold sm:text-[20px]">
          Lochau
        </text>
      </svg>
      {/* B18 (gesamtwerk M10): approximate driving times as a list (readable,
          no 44 px problem with SVG labels), sorted by time. */}
      {labels.driveTitle && (
        <div className="mt-4 border-t border-line pt-3" data-drive-times="">
          <p className="text-small text-text-soft">{labels.driveTitle}</p>
          {/* QM shell-home r4: a column grid instead of running text – name
              left, time right, as many 11rem columns as fit (one with
              enlarged text). */}
          <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-x-grid text-small text-text">
            {[...PLACES]
              .filter((c) => DRIVE_MIN[c.id])
              .sort((a, b) => DRIVE_MIN[a.id] - DRIVE_MIN[b.id])
              .map((c) => (
                <li key={c.id} className="tabular flex flex-wrap items-baseline justify-between gap-x-3 border-b border-line py-1.5">
                  <span>{c.name}</span> <span className="ml-auto text-text-soft">{labels.minutes.replace("{n}", DRIVE_MIN[c.id])}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
      <figcaption className="mt-3 text-small text-text-soft">{labels.caption}</figcaption>
    </figure>
  );
}
