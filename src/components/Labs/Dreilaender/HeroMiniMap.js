// Mini-Karte für den Desktop-Hero (P3-12): rein dekorativ (aria-hidden), ohne
// JavaScript, gleiche Geodaten wie die große Karte. Erst ab lg sichtbar – mobil
// folgt die interaktive Karte direkt nach dem Hero.
import { COUNTRY_LABELS, HOME_XY, PLACES, SHAPES, VIEW, routePath } from "./geo";
import s from "./dreilaender.module.css";

// `countries`: Länderbeschriftungen der Sprache (EN/FR/IT), sonst die deutschen aus geo.js.
export default function HeroMiniMap({ countries = null }) {
  return (
    <div aria-hidden="true" className="hidden lg:block">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className={s.mini} focusable="false">
        {SHAPES.lakes.map((d, i) => (
          <path key={`l${i}`} d={d} className={s.miniLake} />
        ))}
        {SHAPES.rivers.map((d, i) => (
          <path key={`r${i}`} d={d} className={s.miniRiver} />
        ))}
        {SHAPES.borders.map((d, i) => (
          <path key={`b${i}`} d={d} className={s.miniBorder} />
        ))}
        {PLACES.map((p) => (
          <path key={`rt${p.id}`} d={routePath(p.xy)} className={s.miniRoute} />
        ))}
        {COUNTRY_LABELS.map((c) => (
          <text key={c.code} x={c.xy[0]} y={c.xy[1]} textAnchor="middle" fontWeight="600" className={s.miniCountry}>
            {countries?.[c.code] || c.text}
          </text>
        ))}
        {PLACES.map((p) => (
          <circle key={p.id} cx={p.xy[0]} cy={p.xy[1]} r="4.5" className={s.miniDot} />
        ))}
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="14" className={s.pulse} />
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="14" className={`${s.pulse} ${s.pulse2}`} />
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="8" className={s.miniHome} />
        <text x={HOME_XY[0] + 14} y={HOME_XY[1] + 10} fontWeight="600" className={s.miniHomeLabel}>
          Lochau
        </text>
      </svg>
    </div>
  );
}
