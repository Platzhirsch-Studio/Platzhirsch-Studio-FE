// Schematische Karte des Dreiländerecks als Inline-SVG (Server Component,
// 0 kB JS). Koordinaten sind echte Längen/Breiten, vereinfacht projiziert
// (equirektangulär, cos 47,5°). See- und Rheinlinien sind grob gezeichnet –
// eine Orientierung, keine Landkarte.
// Interaktion ohne JS: Hover/Fokus auf Stadt (Karte oder Liste) hebt die
// Route hervor – über :has() in einem kleinen, generierten <style>.
import Link from "next/link";
import s from "./dl.module.css";
import { CITIES, LOCHAU } from "./content";

const LON0 = 8.82;
const LAT0 = 47.86;
const KX = 600 * Math.cos((47.5 * Math.PI) / 180);
const KY = 600;
const px = ({ lat, lon }) => [Math.round((lon - LON0) * KX * 10) / 10, Math.round((LAT0 - lat) * KY * 10) / 10];
const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${px({ lat: p[0], lon: p[1] }).join(" ")}`).join(" ") + " Z";

// Bodensee (Obersee + Überlinger See), Uhrzeigersinn ab Lindau.
const OBERSEE = [
  [47.552, 9.69], [47.57, 9.63], [47.6, 9.545], [47.648, 9.475], [47.662, 9.385], [47.672, 9.32],
  [47.69, 9.268], [47.73, 9.21], [47.765, 9.16], [47.805, 9.04], [47.79, 9.03], [47.745, 9.09],
  [47.712, 9.135], [47.68, 9.17], [47.66, 9.18], [47.645, 9.2], [47.625, 9.25], [47.59, 9.33],
  [47.565, 9.38], [47.52, 9.43], [47.485, 9.49], [47.49, 9.56], [47.5, 9.62], [47.49, 9.68],
  [47.505, 9.73], [47.525, 9.75],
];
const UNTERSEE = [
  [47.668, 9.165], [47.7, 9.12], [47.725, 9.04], [47.73, 8.98], [47.705, 8.9], [47.672, 8.86],
  [47.66, 8.9], [47.668, 9.0], [47.665, 9.1],
];
// Alpenrhein: Grenze CH/AT und CH/FL.
const RHEIN = [
  [47.5, 9.62], [47.45, 9.645], [47.4, 9.635], [47.35, 9.6], [47.3, 9.55], [47.25, 9.52], [47.2, 9.5],
  [47.13, 9.5], [47.06, 9.49],
];

const home = px(LOCHAU);

function labelOffset(pos) {
  switch (pos) {
    case "left":
      return { dx: -10, anchor: "end", dy: 4 };
    case "top":
      return { dx: 0, anchor: "middle", dy: -24 };
    default:
      return { dx: 10, anchor: "start", dy: 4 };
  }
}

export default function DreilaenderMap() {
  const highlight = CITIES.map(
    (c) =>
      `[data-dlmap]:has([data-city="${c.id}"]:is(:hover,:focus-visible)) [data-route="${c.id}"]{opacity:1;stroke-width:3}`
  ).join("");

  return (
    <div className={s.mapWrap} data-dlmap="">
      <style>{highlight}</style>
      <figure style={{ margin: 0 }}>
        <svg
          viewBox="0 0 660 520"
          className={s.map}
          role="group"
          aria-labelledby="dl-map-title dl-map-desc"
        >
          <title id="dl-map-title">Karte: Lochau im Dreiländereck</title>
          <desc id="dl-map-desc">
            Schematische Karte des Bodensees mit Lochau am Ostufer und Fahrzeiten zu Städten in Österreich, Deutschland, der
            Schweiz und Liechtenstein.
          </desc>
          <text x="440" y="30" className={s.mapCountry}>DEUTSCHLAND</text>
          <text x="40" y="470" className={s.mapCountry}>SCHWEIZ</text>
          <text x="470" y="440" className={s.mapCountry}>ÖSTERREICH</text>
          <text x="300" y="505" className={s.mapCountry} style={{ fontSize: 11 }}>LIECHTENSTEIN</text>

          <path d={path(OBERSEE)} className={s.mapLake} />
          <path d={path(UNTERSEE)} className={s.mapLake} />
          <path
            d={RHEIN.map((p, i) => `${i ? "L" : "M"}${px({ lat: p[0], lon: p[1] }).join(" ")}`).join(" ")}
            className={s.mapRiver}
          />
          <text x={px({ lat: 47.62, lon: 9.3 })[0]} y={px({ lat: 47.62, lon: 9.3 })[1]} className={s.mapCityTime} style={{ fontStyle: "italic" }}>
            Bodensee
          </text>

          {/* Fahrrouten (schematische Bögen) */}
          {CITIES.map((c) => {
            const [x, y] = px(c);
            const mx = (home[0] + x) / 2;
            const my = (home[1] + y) / 2 - Math.min(60, Math.hypot(x - home[0], y - home[1]) * 0.18);
            return (
              <path
                key={c.id}
                data-route={c.id}
                d={`M${home[0]} ${home[1]} Q${mx} ${my} ${x} ${y}`}
                pathLength="1"
                className={s.mapRoute}
              />
            );
          })}

          {/* Städte */}
          {CITIES.map((c) => {
            const [x, y] = px(c);
            const { dx, dy, anchor } = labelOffset(c.labelPos);
            const content = (
              <>
                <circle cx={x} cy={y} r="4" className={s.mapCity} />
                <text x={x + dx} y={y + dy} textAnchor={anchor} className={s.mapCityLabel}>
                  {c.name}
                </text>
                <text x={x + dx} y={y + dy + 15} textAnchor={anchor} className={s.mapCityTime}>
                  {c.time}
                </text>
              </>
            );
            return c.href ? (
              <a key={c.id} href={c.href} data-city={c.id} className={s.mapCityLink}>
                {content}
              </a>
            ) : (
              <g key={c.id} data-city={c.id}>
                {content}
              </g>
            );
          })}

          {/* Lochau */}
          <circle cx={home[0]} cy={home[1]} r="18" className={s.mapHomeRing} />
          <circle cx={home[0]} cy={home[1]} r="30" className={s.mapHomeRing} style={{ opacity: 0.2 }} />
          <circle cx={home[0]} cy={home[1]} r="7" className={s.mapHome} />
          <text x={home[0] + 16} y={home[1] - 14} className={s.mapHomeLabel}>
            Platzhirsch, Lochau
          </text>
        </svg>
        <figcaption className={s.caption}>
          Fahrzeiten mit dem Auto ab Lochau, Richtwerte ohne Verkehr und Grenzwartezeiten. Karte schematisch.
        </figcaption>
      </figure>

      <div>
        <ul className={s.cityList} aria-label="Fahrzeiten ab Lochau">
          {CITIES.map((c) => {
            const row = (
              <>
                <span className={s.cityCode}>{c.country}</span>
                <span className={s.cityName}>{c.name}</span>
                <span className={`${s.small} ${s.num}`}>{c.time}</span>
              </>
            );
            return (
              <li key={c.id}>
                {c.href ? (
                  <Link href={c.href} data-city={c.id}>
                    {row}
                  </Link>
                ) : (
                  <div data-city={c.id}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
