// Logo concept "Der Platz" for the Galerie prototype.
// The mark: a fine square (the "Platz", a place you enter like a room or a
// gallery) holding an abstract antler drawn from two hairlines that rise from
// one point, each with two tines. It replaces the gold stag head with
// something quieter that still says "Hirsch". The wordmark sets PLATZHIRSCH
// in widely spaced Garamond capitals; the descriptor line is optional.
// Everything uses currentColor, so the logo works on paper and on walnut.

function Mark({ x = 0, y = 0, size = 48 }) {
  const s = size / 48;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="0.75" y="0.75" width="46.5" height="46.5" strokeWidth="1" />
      {/* stem and the two beams of the antler */}
      <path d="M24 39.5 V33" strokeWidth="1.25" />
      <path d="M24 33 C21 28.5 17.5 22 16.5 9.5" strokeWidth="1.25" />
      <path d="M24 33 C27 28.5 30.5 22 31.5 9.5" strokeWidth="1.25" />
      {/* tines */}
      <path d="M19.4 25.2 C16.6 23.6 13.4 21.4 11 17.5" strokeWidth="1.1" />
      <path d="M17.2 17 C15.2 15.6 13.6 13.6 12.6 11" strokeWidth="1.1" />
      <path d="M28.6 25.2 C31.4 23.6 34.6 21.4 37 17.5" strokeWidth="1.1" />
      <path d="M30.8 17 C32.8 15.6 34.4 13.6 35.4 11" strokeWidth="1.1" />
    </g>
  );
}

export default function Logo({ variant = "full", descriptor = true, className, title = "Platzhirsch Home Living" }) {
  if (variant === "mark") {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label={title}>
        <Mark />
      </svg>
    );
  }

  const height = descriptor ? 48 : 40;
  return (
    <svg viewBox={`0 0 300 ${height}`} className={className} role="img" aria-label={title}>
      <Mark size={descriptor ? 48 : 40} />
      <text
        x={descriptor ? 64 : 56}
        y={descriptor ? 27 : 28}
        fill="currentColor"
        fontSize={descriptor ? 23 : 24}
        textLength="230"
        lengthAdjust="spacing"
        style={{ fontFamily: "var(--gal-font-serif), Georgia, serif", fontWeight: 400 }}
      >
        PLATZHIRSCH
      </text>
      {descriptor && (
        <text
          x="65"
          y="44"
          fill="currentColor"
          fontSize="8.5"
          textLength="228"
          lengthAdjust="spacing"
          style={{ fontFamily: "var(--gal-font-sans), Arial, sans-serif", fontWeight: 500 }}
        >
          HOME LIVING · LOCHAU AM BODENSEE
        </text>
      )}
    </svg>
  );
}
