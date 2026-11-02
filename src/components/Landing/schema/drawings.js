// Haarlinien-Zeichnungen der Studio-Grafiken (Rat 9,5 B7, gesamtwerk M4).
// Dieselbe Sprache wie „Die Linie“ auf /arbeitsweise und die Piktogramme der
// Startseite: 1-px-Linien in Ink, Raster und Nebenlinien in Pebble, EINE
// Akzentlinie in brass-500 (Funktion: Achse, Route, Arbeitsdreieck), Fläche
// höchstens als see/10. Maßzahlen sind feste Schemawerte ohne Projektbezug –
// keine Kundenräume, keine Skizze von Harald, kein Handstrich-Effekt.
// Alle Zeichnungen: viewBox 0 0 400 300, deterministisch, ohne Text auf
// kleinen Bildschirmen (Beschriftungen nur ab xl, sonst < 12 px).
// Reines Modul ohne Hooks: Server- und Client-Komponenten können es nutzen.

const S = { vectorEffect: "non-scaling-stroke", fill: "none" };
const LINE = "stroke-ink";
const SOFT = "stroke-pebble";
const ACCENT = "stroke-brass-500";
// Design-Jury P2-16: Beschriftungen nie unter 12 px Bildschirmgröße. 13 Einheiten
// im viewBox 400 ergeben in der 5er-Spalte ab 1280 px ≥ 13 px; darunter (und in
// schmaleren Spalten) entfallen sie – die Grafik ist dekorativ, die figcaption
// beschriftet sie.
// Halo in der Kastenfarbe (paint-order), damit eine Beschriftung über einer Linie lesbar bleibt.
const LABEL = "fill-text-soft stroke-surface-raised [stroke-width:4px] [paint-order:stroke] [stroke-linejoin:round] text-[13px] tracking-[0.08em] uppercase max-xl:hidden";

/** Maßkette mit Endstrichen (horizontal oder vertikal), Text an der Mitte. */
function Dim({ x1, y1, x2, y2, label, side = 1 }) {
  const h = y1 === y2;
  const tick = (x, y) => (h ? `M${x} ${y - 5} V${y + 5}` : `M${x - 5} ${y} H${x + 5}`);
  return (
    <g>
      <path {...S} className={SOFT} strokeWidth="1" d={`M${x1} ${y1} L${x2} ${y2} ${tick(x1, y1)} ${tick(x2, y2)}`} />
      {label && h && (
        <text x={(x1 + x2) / 2} y={y1 - 8} textAnchor="middle" className="fill-text-soft stroke-surface-raised [stroke-width:4px] [paint-order:stroke] [stroke-linejoin:round] text-[13px] max-xl:hidden tabular-nums">
          {label}
        </text>
      )}
      {/* senkrechte Kette: Zahl gedreht neben der Linie (side -1 links, 1 rechts), bleibt im viewBox */}
      {label && !h && (
        <text
          x={x1 + side * 8}
          y={(y1 + y2) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${x1 + side * 8} ${(y1 + y2) / 2})`}
          className="fill-text-soft stroke-surface-raised [stroke-width:4px] [paint-order:stroke] [stroke-linejoin:round] text-[13px] max-xl:hidden tabular-nums"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Hotel: Zimmergrundriss einer Etage mit Musterzimmer und Achse der Serie. */
export function HotelDrawing({ labels }) {
  const rooms = [20, 110, 200, 290];
  return (
    <g>
      {/* Etage: Zimmer oben, Flur, Nebenräume unten */}
      <path {...S} className={LINE} strokeWidth="1.25" d="M20 40 H380 V280 H20 Z M20 170 H380 M20 200 H380 M110 40 V170 M200 40 V170 M290 40 V170 M140 200 V280 M260 200 V280" />
      {/* Türen vom Flur in jedes Zimmer */}
      {rooms.map((x) => (
        <path key={x} {...S} className={SOFT} d={`M${x + 60} 170 V150 M${x + 60} 150 A20 20 0 0 1 ${x + 80} 170`} />
      ))}
      {/* Musterzimmer (zweites Zimmer): Fläche, Bett, Bad, Schreibtisch */}
      <rect x="110" y="40" width="90" height="130" className="fill-see/10" />
      <path {...S} className={LINE} d="M122 52 H188 V108 H122 Z M122 66 H188 M110 132 H146 V170 M146 132 V170 M190 120 V160" />
      <circle {...S} cx="128" cy="151" r="8" className={LINE} />
      {/* Serie: dieselbe Möblierung in den anderen Zimmern, nur angedeutet */}
      {[20, 200, 290].map((x) => (
        <path key={x} {...S} className={SOFT} d={`M${x + 12} 52 H${x + 78} V108 H${x + 12} Z M${x} 132 H${x + 36} V170`} />
      ))}
      {/* Achse des Musterzimmers und Übertrag auf die Serie */}
      <path {...S} className={ACCENT} strokeWidth="1.25" strokeDasharray="8 4 2 4" d="M155 22 V292" />
      <path {...S} className={ACCENT} strokeDasharray="3 4" d="M200 126 H372 M366 121 L372 126 L366 131" />
      <text x="155" y="16" textAnchor="middle" className={LABEL}>
        {labels.sample}
      </text>
      <text x="290" y="121" textAnchor="middle" className={LABEL}>
        {labels.series}
      </text>
    </g>
  );
}

/** Architekten: Gebäudeschnitt mit versetztem Planungsdaten-Layer (Möbel) und Höhenkette. */
export function ArchitektenDrawing({ labels }) {
  return (
    <g>
      {/* Gelände, Wände, Decke, Dach */}
      <path {...S} className={SOFT} d="M10 270 H390" />
      <path {...S} className={LINE} strokeWidth="1.25" d="M60 270 V110 M330 270 V110 M60 190 H330 M60 196 H330 M46 116 L195 40 L344 116" />
      {/* Fenster im Schnitt */}
      <path {...S} className={LINE} d="M60 214 H54 V250 H60 M330 128 H336 V168 H330" />
      {/* Möbel: Sofa unten, Tisch mit Leuchte oben (Schnitt) */}
      <path {...S} className={LINE} d="M100 270 V246 H190 V270 M100 254 H190 M110 246 V236 H180 V246 M230 190 V164 M290 190 V164 M222 164 H298 M260 118 V140 M248 140 H272 L266 148 H254 Z" />
      {/* Planungsdaten-Layer: dieselben Möbel als versetzte Ebene */}
      <g transform="translate(14 -14)">
        <path {...S} className={ACCENT} strokeDasharray="4 3" d="M100 270 V246 H190 V270 Z M222 190 V164 H298 V190" />
        <path {...S} className={ACCENT} strokeDasharray="2 4" d="M90 280 H310 V150 H90 Z" />
      </g>
      <text x="110" y="128" className={LABEL}>
        {labels.layer}
      </text>
      <Dim x1={366} y1={270} x2={366} y2={196} label="2,74" />
      <Dim x1={366} y1={190} x2={366} y2={116} label="2,60" />
    </g>
  );
}

/** Küche: L-Zeile im Grundriss mit Spüle, Kochfeld, Hochschränken und Arbeitsdreieck. */
export function KuecheDrawing({ labels }) {
  return (
    <g>
      {/* Wände */}
      <path {...S} className={LINE} strokeWidth="2" d="M40 270 V40 H370" />
      {/* Arbeitsplatte oben (Tiefe 60) und links */}
      <path {...S} className={LINE} strokeWidth="1.25" d="M40 100 H280 M100 100 V240 H40" />
      {/* Hochschränke am Ende der Zeile */}
      <path {...S} className={LINE} strokeWidth="1.25" d="M280 40 V100 H340 V40" />
      <path {...S} className={SOFT} d="M280 100 L340 40 M296 100 L340 56 M280 84 L324 40" />
      {/* Fronten (Raster 60) */}
      <path {...S} className={SOFT} d="M100 40 V100 M160 40 V100 M220 40 V100 M40 160 H100 M40 220 H100" />
      {/* Spüle */}
      <rect {...S} x="118" y="52" width="48" height="36" className={LINE} />
      <circle {...S} cx="142" cy="70" r="4" className={LINE} />
      {/* Kochfeld */}
      {[
        [58, 170],
        [82, 170],
        [58, 200],
        [82, 200],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} {...S} cx={cx} cy={cy} r="8" className={LINE} />
      ))}
      {/* Arbeitsdreieck Spüle – Kochfeld – Kühlschrank */}
      <path {...S} className={ACCENT} strokeWidth="1.25" strokeDasharray="5 4" d="M142 70 L70 185 L310 70 Z" />
      <text x="190" y="140" className={LABEL}>
        {labels.triangle}
      </text>
      <Dim x1={40} y1={22} x2={340} y2={22} label="3,60 m" />
      <Dim x1={20} y1={40} x2={20} y2={240} label="2,40 m" side={-1} />
    </g>
  );
}

/** Termin: Café-Tisch von oben, zwei Stühle, Tasse und die Tischkarte. */
export function TerminDrawing() {
  return (
    <g>
      <circle {...S} cx="200" cy="150" r="96" className={LINE} strokeWidth="1.25" />
      {/* Stühle */}
      <path {...S} className={SOFT} d="M86 108 A60 60 0 0 0 86 192 M314 108 A60 60 0 0 1 314 192" />
      <path {...S} className={LINE} d="M70 112 A64 64 0 0 0 70 188 M330 112 A64 64 0 0 1 330 188" />
      {/* Tassen mit Unterteller */}
      <circle {...S} cx="150" cy="170" r="16" className={SOFT} />
      <circle {...S} cx="150" cy="170" r="9" className={LINE} />
      <circle {...S} cx="252" cy="170" r="16" className={SOFT} />
      <circle {...S} cx="252" cy="170" r="9" className={LINE} />
      {/* Tischkarte (gefaltet, leicht perspektivisch) */}
      <rect x="168" y="96" width="64" height="40" className="fill-see/10" />
      <path {...S} className={LINE} strokeWidth="1.25" d="M168 96 H232 V136 H168 Z M172 136 L176 146 H224 L228 136" />
      <path {...S} className={ACCENT} strokeWidth="1.25" d="M180 112 H220 M186 122 H214" />
      {/* Kein Etikett „Ihr Platz“ (Design-Jury P2-16): in der schmalen Termin-Spalte
          läge es unter 12 px; die figcaption „Schema des Studios“ beschriftet. */}
    </g>
  );
}

/** Ideenboard: Pinnwand im Raster mit angehefteten Karten unterschiedlicher Größe. */
export function IdeenboardDrawing({ labels }) {
  const cards = [
    [56, 46, 92, 70, true],
    [160, 46, 76, 104, false],
    [248, 46, 96, 60, true],
    [56, 128, 92, 120, false],
    [160, 162, 76, 86, true],
    [248, 118, 96, 130, false],
  ];
  const grid = [];
  for (let x = 80; x < 360; x += 40) grid.push(`M${x} 30 V270`);
  for (let y = 70; y < 270; y += 40) grid.push(`M40 ${y} H360`);
  return (
    <g>
      <path {...S} className={LINE} strokeWidth="1.25" d="M40 30 H360 V270 H40 Z" />
      <path {...S} className={SOFT} strokeDasharray="1 5" d={grid.join(" ")} />
      {cards.map(([x, y, w, h, swatch]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={w} height={h} className="fill-paper" />
          {swatch && <rect x={x + 8} y={y + 10} width={w - 16} height={h * 0.45} className="fill-see/10" />}
          <rect {...S} x={x} y={y} width={w} height={h} className={LINE} />
          <path {...S} className={SOFT} d={`M${x + 8} ${y + h - 18} H${x + w - 20} M${x + 8} ${y + h - 10} H${x + w - 36}`} />
          <circle cx={x + w / 2} cy={y + 1} r="3" className="fill-brass-500" />
        </g>
      ))}
      <text x="200" y="22" textAnchor="middle" className={LABEL}>
        {labels.board}
      </text>
    </g>
  );
}
