// Kleine Bausteine des Entwurfs „Präzision“ (ohne Zustand, server-tauglich).

export function Av({ kurz, ton = 1, size = 20, eckig = false, title }) {
  size = Math.max(20, size);
  return (
    <span className="pz-av" data-t={ton} data-sq={eckig ? "" : undefined} style={{ "--s": `${size}px` }} title={title} aria-hidden={title ? undefined : true}>
      {kurz}
    </span>
  );
}

/** Personengruppe: max. zwei Avatare, Rest als „+n“, Überlappung −6 px mit 2-px-Ring. */
export function Avs({ leute, team }) {
  const sicht = leute.slice(0, 2);
  const rest = leute.length - sicht.length;
  return (
    <span className="pz-avs" aria-label={leute.map((k) => team[k].name).join(", ")} role="img">
      {sicht.map((k, i) => (
        <span key={k} style={{ display: "inline-flex", zIndex: 3 - i, position: "relative", marginLeft: i ? -6 : 0, borderRadius: 99, boxShadow: "0 0 0 2px var(--panel)" }}>
          <Av kurz={k} ton={team[k].ton} />
        </span>
      ))}
      {rest > 0 && <span className="pz-av pz-av-more" style={{ marginLeft: -6 }} aria-hidden>+{rest}</span>}
    </span>
  );
}

const BILD = "/entwurf/praezision/";
/** Materialbild (Rendering, Stoff, Holz) statt Initialen – Initialen nur ohne Bild. */
export function Mat({ bild, kurz, ton, size = 32, eckig = true, alt = "" }) {
  if (!bild) return <Av kurz={kurz} ton={ton} size={size} eckig={eckig} />;
  // eslint-disable-next-line @next/next/no-img-element -- Entwurf, lokale Kopien
  return <img className="pz-mat" src={BILD + bild} alt={alt} style={{ "--s": `${size}px` }} />;
}

export function Kbd({ children }) {
  const teile = Array.isArray(children) ? children : [children];
  return (
    <span className="pz-kbds">
      {teile.map((t, i) => (
        <kbd key={i} className="pz-kbd">{t}</kbd>
      ))}
    </span>
  );
}

/** Statusring im Linear-Stil: Farbe nur im Symbol, Text bleibt neutral. */
export function StatusRing({ ton = "grau", stufe = 0 }) {
  // stufe 0..4 → Füllgrad des Rings
  const r = 4.25;
  const u = 2 * Math.PI * r;
  return (
    <svg className="pz-ring" viewBox="0 0 12 12" data-ton={ton} aria-hidden="true">
      <circle cx="6" cy="6" r="5.25" fill="none" stroke="var(--ton)" strokeWidth="1.5" strokeDasharray={stufe === 0 ? "1.6 1.6" : undefined} />
      {stufe > 0 && (
        <circle
          cx="6" cy="6" r={r / 2} fill="none" stroke="var(--ton)" strokeWidth={r}
          strokeDasharray={`${(u / 2) * Math.min(stufe, 4) / 4} ${u}`} transform="rotate(-90 6 6)"
        />
      )}
    </svg>
  );
}

export function Sparkline({ werte, breite = 88, hoehe = 28 }) {
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const sx = (i) => (i / (werte.length - 1)) * (breite - 4) + 2;
  const sy = (v) => hoehe - 3 - ((v - min) / (max - min || 1)) * (hoehe - 6);
  const d = werte.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");
  const last = werte.length - 1;
  return (
    <svg width={breite} height={hoehe} viewBox={`0 0 ${breite} ${hoehe}`} aria-hidden="true" className="pz-metric-spark">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(last)} cy={sy(werte[last])} r="2.5" fill="currentColor" />
    </svg>
  );
}
