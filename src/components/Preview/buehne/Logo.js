// Logo concept "Bühne": a monoline antler crown (the "Hirsch") standing on a
// single point (the "Platz" – the place, the showroom in Lochau), set above or
// beside a widely tracked Bodoni wordmark. Pure inline SVG, inherits
// currentColor; the mark carries the gold accent.
// NOTE (prototype): the wordmark uses <text> with the loaded display font. For
// production it must be converted to outlined paths by a type designer.

export function AntlerMark({ className, title = "Platzhirsch Bildmarke", accent = "var(--bu-gold, #d1b250)", decorative = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : title}
      fill="none"
      stroke={accent}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* left antler: main beam + two tines */}
      <path d="M30 46 C26 36 18 29 16 9" />
      <path d="M21.5 31 C15.5 29 11 25 8.5 18" />
      <path d="M18.6 21.5 C22.5 17.5 24.2 13 24 6.5" />
      {/* right antler (mirrored) */}
      <path d="M34 46 C38 36 46 29 48 9" />
      <path d="M42.5 31 C48.5 29 53 25 55.5 18" />
      <path d="M45.4 21.5 C41.5 17.5 39.8 13 40 6.5" />
      {/* the place: a single point the crown rests on */}
      <path d="M32 50.5 L34.5 53 L32 55.5 L29.5 53 Z" fill={accent} stroke="none" />
    </svg>
  );
}

function AntlerPaths({ accent = "var(--bu-gold, #d1b250)" }) {
  return (
    <g fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 46 C26 36 18 29 16 9" />
      <path d="M21.5 31 C15.5 29 11 25 8.5 18" />
      <path d="M18.6 21.5 C22.5 17.5 24.2 13 24 6.5" />
      <path d="M34 46 C38 36 46 29 48 9" />
      <path d="M42.5 31 C48.5 29 53 25 55.5 18" />
      <path d="M45.4 21.5 C41.5 17.5 39.8 13 40 6.5" />
      <path d="M32 50.5 L34.5 53 L32 55.5 L29.5 53 Z" fill={accent} stroke="none" />
    </g>
  );
}

// Horizontal lockup for the header: mark + wordmark.
export function LogoHorizontal({ className }) {
  return (
    <svg viewBox="0 0 420 64" className={className} role="img" aria-label="Platzhirsch Home Living">
      <AntlerPaths />
      <text
        x="78"
        y="38"
        fill="currentColor"
        style={{ fontFamily: "var(--bu-font-display), Georgia, serif", fontSize: "27px", letterSpacing: "0.3em" }}
      >
        PLATZHIRSCH
      </text>
      <text
        x="80"
        y="56"
        fill="currentColor"
        opacity="0.7"
        style={{ fontFamily: "var(--bu-font-text), system-ui, sans-serif", fontSize: "9.5px", letterSpacing: "0.52em" }}
      >
        HOME LIVING · LOCHAU
      </text>
    </svg>
  );
}

// Stacked lockup for signage, footer and the concept board.
export function LogoStacked({ className, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 360 200" className={className} role="img" aria-label="Platzhirsch Home Living">
      <g transform="translate(140 4) scale(1.25)">
        <AntlerPaths />
      </g>
      <text
        x="180"
        y="132"
        textAnchor="middle"
        fill={color}
        style={{ fontFamily: "var(--bu-font-display), Georgia, serif", fontSize: "38px", letterSpacing: "0.26em" }}
      >
        PLATZHIRSCH
      </text>
      <line x1="120" y1="152" x2="240" y2="152" stroke="var(--bu-gold, #d1b250)" strokeWidth="1" />
      <text
        x="180"
        y="176"
        textAnchor="middle"
        fill={color}
        opacity="0.75"
        style={{ fontFamily: "var(--bu-font-text), system-ui, sans-serif", fontSize: "11px", letterSpacing: "0.55em" }}
      >
        HOME LIVING · LOCHAU
      </text>
    </svg>
  );
}
