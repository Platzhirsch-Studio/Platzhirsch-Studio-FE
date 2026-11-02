// Küchenplaner – kleine Piktogramme für Palette und Legende (Fix 1, P2-4).
// Reine Linienzeichnungen in currentColor, 24 × 24, immer aria-hidden: der
// Klartext steht daneben.

const P = {
  unterschrank: (
    <>
      <rect x="4" y="5" width="16" height="15" />
      <path d="M4 10h16M4 15h16M10 7.5h4M10 12.5h4M10 17.5h4" />
    </>
  ),
  spuele: (
    <>
      <rect x="4" y="9" width="16" height="11" />
      <path d="M6 9v-1.5h12V9M12 7.5V4h3" />
      <path d="M7 12h10" />
    </>
  ),
  geschirrspueler: (
    <>
      <rect x="4" y="5" width="16" height="15" />
      <path d="M4 8h16M9 6.5h6" />
      <path d="M8 12h8M8 15h8" strokeDasharray="1.5 1.5" />
    </>
  ),
  kochfeld: (
    <>
      <rect x="4" y="6" width="16" height="13" />
      <circle cx="9" cy="10.5" r="2" />
      <circle cx="15" cy="10.5" r="2" />
      <circle cx="9" cy="15.5" r="1.5" />
      <circle cx="15" cy="15.5" r="1.5" />
    </>
  ),
  eckschrank: <path d="M4 4h16v8h-8v8H4z M4 12h8" />,
  hochschrank: (
    <>
      <rect x="7" y="2" width="10" height="20" />
      <path d="M7 12h10M15 6v3M15 15v3" />
    </>
  ),
  backofen: (
    <>
      <rect x="7" y="2" width="10" height="20" />
      <rect x="9" y="9" width="6" height="5" />
      <path d="M7 7h10M7 16h10" />
    </>
  ),
  kuehlschrank: (
    <>
      <rect x="7" y="2" width="10" height="20" />
      <path d="M7 9h10M15 4.5v2.5M15 11v4" />
    </>
  ),
  apotheker: (
    <>
      <rect x="9" y="2" width="6" height="20" />
      <path d="M11 5h2M9 8h6M9 13h6M9 18h6" />
    </>
  ),
  passstueck: <rect x="10.5" y="5" width="3" height="15" />,
};

export function ModuleIcon({ t, size = 20, className = "" }) {
  const g = P[t] || P.unterschrank;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" className={className}>
      {g}
    </svg>
  );
}
