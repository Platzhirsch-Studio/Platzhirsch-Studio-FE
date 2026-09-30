// Small blueprint-style technical drawing: an outline shape (rectangle, or a
// circle when the product is measured by diameter — chandeliers, parasols)
// with dimension lines and value labels, parsed from the product's own
// `dimensions` string (see parseDimensions below). Deliberately schematic, not
// to scale — the point is to show a width/height callout "like on paper", not
// a precise CAD drawing.

// Pulls labeled cm values out of a string like
// "Width: 242 cm · Depth: 98 cm · Height: 74 cm · Seat height: 40 cm" into
// { width: 242, depth: 98, height: 74, "seat height": 40 }. Returns null if
// nothing matched (product has no `dimensions` field, or an unrecognized format).
export function parseDimensions(input) {
  if (!input) return null;
  const result = {};
  const re = /([A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)?):\s*([\d.]+)\s*cm/g;
  let match;
  while ((match = re.exec(input))) {
    result[match[1].toLowerCase()] = parseFloat(match[2]);
  }
  return Object.keys(result).length ? result : null;
}

const DimensionDiagram = ({ dims, size = "sm", dark = false }) => {
  if (!dims) return null;

  const isRound = Boolean(dims.diameter && !dims.width);
  const widthLabel = isRound ? `⌀ ${dims.diameter} cm` : dims.width ? `${dims.width} cm` : null;
  const heightLabel = dims.height ? `${dims.height} cm` : null;

  if (!widthLabel && !heightLabel) return null;

  // The viewBox's internal coordinate space stays fixed — only the rendered
  // width/height attributes scale up, which scales the whole drawing
  // (outline, dimension lines, text) uniformly and proportionally.
  const rendered = size === "lg" ? { width: 280, height: 208 } : { width: 140, height: 104 };
  const outlineColor = dark ? "#ffffff" : "#30373e";
  const labelColor = dark ? "#ffffff" : "#30373e";

  return (
    <svg
      width={rendered.width}
      height={rendered.height}
      viewBox="0 0 140 104"
      className="shrink-0"
      role="img"
      aria-label={[widthLabel, heightLabel].filter(Boolean).join(" × ")}
    >
      {isRound ? (
        <circle cx="55" cy="45" r="28" fill="none" stroke={outlineColor} strokeWidth="1" opacity={dark ? 0.5 : 0.6} />
      ) : (
        <rect x="25" y="16" width="60" height="48" fill="none" stroke={outlineColor} strokeWidth="1" opacity={dark ? 0.5 : 0.6} />
      )}

      {widthLabel && !isRound && (
        <g stroke="#d1b250" strokeWidth="1">
          <line x1="25" y1="78" x2="85" y2="78" />
          <line x1="25" y1="74" x2="25" y2="82" />
          <line x1="85" y1="74" x2="85" y2="82" />
        </g>
      )}
      {widthLabel && (
        <text x={isRound ? 55 : 55} y="96" textAnchor="middle" fontSize="9" fill={labelColor}>
          {widthLabel}
        </text>
      )}

      {heightLabel && !isRound && (
        <>
          <g stroke="#d1b250" strokeWidth="1">
            <line x1="100" y1="16" x2="100" y2="64" />
            <line x1="96" y1="16" x2="104" y2="16" />
            <line x1="96" y1="64" x2="104" y2="64" />
          </g>
          <text x="112" y="44" fontSize="9" fill={labelColor} textAnchor="middle" transform="rotate(90 112 44)">
            {heightLabel}
          </text>
        </>
      )}
    </svg>
  );
};

export default DimensionDiagram;
