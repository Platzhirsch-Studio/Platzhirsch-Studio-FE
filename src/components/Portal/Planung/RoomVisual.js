import { SCENES } from "./scenes";

// Vector placeholder "visualisation" of a planning variant (resolution
// independent, ~3 KB). Shown while a rendering has no real image file.
// Pure component without hooks: renders on the server and the client.

function Kitchen({ s, uid }) {
  const tall = s.island; // planned variants get a tall larder unit
  return (
    <g>
      {/* back counter run */}
      <rect x={tall ? 540 : 440} y="500" width={tall ? 620 : 720} height="140" fill={s.front} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={(tall ? 540 : 440) + (i + 1) * (tall ? 124 : 144)} y1="506" x2={(tall ? 540 : 440) + (i + 1) * (tall ? 124 : 144)} y2="636" stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
      ))}
      <rect x={tall ? 530 : 430} y="486" width={tall ? 640 : 740} height="16" fill={s.top} />
      <rect x={tall ? 540 : 440} y="360" width={tall ? 620 : 720} height="126" fill={s.wall} />
      <rect x={tall ? 540 : 440} y="360" width={tall ? 620 : 720} height="126" fill={s.top} opacity={s.island ? 0.55 : 0.2} />
      {/* upper cabinets / shelf */}
      {s.island ? (
        <rect x="560" y="300" width="580" height="12" fill={s.accent} opacity="0.9" />
      ) : (
        <rect x="440" y="240" width="720" height="110" fill={s.front} opacity="0.9" />
      )}
      {/* hob + tap */}
      <rect x="760" y="478" width="120" height="8" fill={s.metal} />
      <path d="M1040 486 v-46 h26" fill="none" stroke={s.metal} strokeWidth="6" strokeLinecap="round" />
      {tall && (
        <g>
          <rect x="400" y="190" width="140" height="450" fill={s.front} />
          <line x1="470" y1="196" x2="470" y2="636" stroke="#000" strokeOpacity="0.15" strokeWidth="2" />
        </g>
      )}
      {s.island && (
        <g>
          {/* pendants */}
          {[640, 800, 960].map((x) => (
            <g key={x}>
              <line x1={x} y1="80" x2={x} y2="560" stroke={s.metal} strokeWidth="2" />
              <path d={`M${x - 34} 600 L${x - 14} 560 L${x + 14} 560 L${x + 34} 600 Z`} fill={s.accent} />
              <ellipse cx={x} cy="604" rx="30" ry="5" fill="#fff8e1" opacity="0.8" />
            </g>
          ))}
          {/* island */}
          <polygon points={`${s.seats ? 470 : 540},720 ${s.seats ? 1130 : 1060},720 ${s.seats ? 1190 : 1120},780 ${s.seats ? 410 : 480},780`} fill={s.top} />
          <rect x={s.seats ? 410 : 480} y="780" width={s.seats ? 780 : 640} height="150" fill={s.front} />
          <rect x={s.seats ? 410 : 480} y="780" width={s.seats ? 780 : 640} height="150" fill={`url(#${uid}-shade)`} />
          {s.seats > 0 &&
            Array.from({ length: s.seats }, (_, i) => 560 + i * 240).map((x) => (
              <g key={x} stroke={s.metal} strokeWidth="6" strokeLinecap="round">
                <line x1={x - 30} y1="985" x2={x - 18} y2="880" />
                <line x1={x + 30} y1="985" x2={x + 18} y2="880" />
                <rect x={x - 46} y="866" width="92" height="18" rx="8" fill={s.accent} stroke="none" />
              </g>
            ))}
        </g>
      )}
    </g>
  );
}

function Living({ s, uid }) {
  const planned = !/bestand/i.test(s.label) && s.light > 0.5;
  return (
    <g>
      {/* window */}
      <rect x="560" y="230" width="420" height="300" fill="#e9eef0" />
      <rect x="560" y="230" width="420" height="300" fill={`url(#${uid}-sky)`} />
      <line x1="770" y1="230" x2="770" y2="530" stroke={s.wall} strokeWidth="10" />
      {planned && <rect x="530" y="210" width="60" height="430" fill={s.rug} opacity="0.75" />}
      {/* rug */}
      {planned && <polygon points="420,760 1180,760 1330,940 270,940" fill={s.rug} />}
      {/* sofa */}
      <rect x="430" y="600" width={planned ? 700 : 520} height="110" rx="18" fill={s.sofa} />
      <rect x="410" y="680" width={planned ? 740 : 560} height="110" rx="16" fill={s.sofa} />
      <rect x="410" y="680" width={planned ? 740 : 560} height="110" rx="16" fill={`url(#${uid}-shade)`} />
      {planned && <rect x="1010" y="680" width="140" height="190" rx="16" fill={s.sofa} />}
      {planned &&
        [520, 700, 880].map((x) => <rect key={x} x={x} y="618" width="150" height="70" rx="20" fill="#fff" opacity="0.18" />)}
      {/* coffee table */}
      <ellipse cx="760" cy="880" rx={planned ? 170 : 120} ry="34" fill={planned ? s.accent : s.metal} opacity="0.9" />
      <rect x="752" y="880" width="16" height="60" fill={s.metal} />
      {/* arc lamp */}
      {planned && (
        <g>
          <path d="M1290 940 C1300 520 1080 380 900 470" fill="none" stroke={s.metal} strokeWidth="8" strokeLinecap="round" />
          <path d="M860 470 a40 34 0 0 1 80 0 Z" fill={s.metal} />
          <ellipse cx="900" cy="472" rx="38" ry="6" fill="#fff8e1" />
          <rect x="1255" y="930" width="70" height="40" rx="6" fill="#e6e1d8" />
        </g>
      )}
    </g>
  );
}

export default function RoomVisual({ scene, title, className = "" }) {
  const s = SCENES[scene] || SCENES["wohnen-a"];
  const uid = `rv-${scene}`;
  return (
    <svg viewBox="0 0 1600 1000" className={className} role="img" aria-label={`${title ? `${title}: ` : ""}Platzhalter-Visualisierung, ${s.label}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${uid}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.45 * s.light} />
          <stop offset="1" stopColor="#000" stopOpacity={0.18 * (1.2 - s.light)} />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd3df" />
          <stop offset="0.7" stopColor="#e7eef0" />
          <stop offset="1" stopColor="#9fb3a6" />
        </linearGradient>
      </defs>
      {/* room shell, one-point perspective */}
      <polygon points="0,0 1600,0 1200,180 400,180" fill={s.wall} />
      <polygon points="0,0 400,180 400,640 0,1000" fill={s.wall} />
      <polygon points="0,0 400,180 400,640 0,1000" fill="#000" opacity="0.06" />
      <polygon points="1600,0 1200,180 1200,640 1600,1000" fill={s.wall} />
      <polygon points="1600,0 1200,180 1200,640 1600,1000" fill="#000" opacity="0.1" />
      <rect x="400" y="180" width="800" height="460" fill={s.wall} />
      <polygon points="0,1000 1600,1000 1200,640 400,640" fill={s.floor} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={400 + i * 133} y1="640" x2={-200 + i * 333} y2="1000" stroke="#000" strokeOpacity="0.07" strokeWidth="2" />
      ))}
      {/* side window light on the right wall */}
      <polygon points="1280,250 1420,190 1420,640 1280,600" fill="#f4f1e8" opacity={0.5 * s.light + 0.2} />
      {s.room === "kueche" ? <Kitchen s={s} uid={uid} /> : <Living s={s} uid={uid} />}
      <rect width="1600" height="1000" fill={`url(#${uid}-light)`} />
    </svg>
  );
}
