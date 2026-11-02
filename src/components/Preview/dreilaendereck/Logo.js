// Logo-Konzept "Vier Enden": ein ruhiges Geweih über der Abendsonne am See.
// Die halbe Sonne steht auf dem Horizont, zwei Linien darunter sind der
// Bodensee. Das Geweih hat genau vier Enden – für Österreich, Deutschland,
// die Schweiz und Liechtenstein. Strichstärke und Rundungen passen zur
// Fraunces-Antiqua der Wortmarke. Reines Inline-SVG, färbt über currentColor.

// Sonne halb über dem Horizont, darunter zwei Wellen (Bodensee), darüber
// zwei Geweihstangen mit je einem Spross = vier Enden.
function MarkPaths() {
  return (
    <>
      <path d="M19 47 A13 13 0 0 1 45 47" />
      <path d="M7 47 H57" />
      <path d="M16 53 H48" opacity="0.7" />
      <path d="M24 59 H40" opacity="0.45" />
      <path d="M27.6 34.6 C25.5 29.5 21.5 25 18 21 C15.5 17 14.5 12 15 6" />
      <path d="M19.6 23.4 C22.5 20.5 23.6 16 23.2 11" />
      <path d="M36.4 34.6 C38.5 29.5 42.5 25 46 21 C48.5 17 49.5 12 49 6" />
      <path d="M44.4 23.4 C41.5 20.5 40.4 16 40.8 11" />
    </>
  );
}

export function LogoMark({ size = 40, className, title = "Platzhirsch Bildmarke", decorative = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <MarkPaths />
    </svg>
  );
}

// Wortmarke mit Bildmarke. `variant="stacked"` für Footer und Visitenkarte.
export function Logo({ variant = "inline", className, tagline = true }) {
  if (variant === "stacked") {
    return (
      <svg
        viewBox="0 0 320 168"
        className={className}
        role="img"
        aria-label="Platzhirsch Home Living, Lochau am Bodensee"
        fill="currentColor"
      >
        <g transform="translate(128 0)" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <MarkPaths />
        </g>
        <text
          x="160"
          y="118"
          textAnchor="middle"
          style={{ fontFamily: "var(--dl-font-display), Georgia, serif", fontSize: 50, fontVariationSettings: '"SOFT" 100, "opsz" 72', letterSpacing: "-0.01em" }}
        >
          Platzhirsch
        </text>
        {tagline && (
          <text
            x="160"
            y="150"
            textAnchor="middle"
            style={{ fontFamily: "var(--dl-font-text), system-ui, sans-serif", fontSize: 12.5, letterSpacing: "0.32em" }}
          >
            HOME LIVING · LOCHAU
          </text>
        )}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 248 48"
      className={className}
      role="img"
      aria-label="Platzhirsch Home Living"
      fill="currentColor"
    >
      <g transform="translate(0 0) scale(0.75)" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <MarkPaths />
      </g>
      <text
        x="58"
        y={tagline ? 27 : 32}
        style={{ fontFamily: "var(--dl-font-display), Georgia, serif", fontSize: 27, fontVariationSettings: '"SOFT" 100, "opsz" 48', letterSpacing: "-0.01em" }}
      >
        Platzhirsch
      </text>
      {tagline && (
        <text
          x="59"
          y="42"
          style={{ fontFamily: "var(--dl-font-text), system-ui, sans-serif", fontSize: 8.6, letterSpacing: "0.3em" }}
        >
          HOME LIVING · LOCHAU
        </text>
      )}
    </svg>
  );
}
