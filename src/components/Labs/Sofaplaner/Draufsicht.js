// Sofaplaner – Beispiel-Draufsicht für den Einstieg (R5 neuland P2-1): Auf dem
// Desktop stand rechts neben Überschrift und Vorderansicht nichts. Hier zeigt
// eine eigene Zeichnung (kein Herstellerbild, kein Modellname) ein Ecksofa im
// Grundriss mit Laufweg, Tisch und Fenster – so, wie der Planer später den
// eigenen Raum zeigt. Server-Komponente, reines SVG, ohne JavaScript lesbar.
import { WALKWAY_IDEAL } from "./model";

const RAUM = { w: 520, h: 420 }; // cm
const PAD = 34; // Rand für Maßlinien (SVG-Einheiten = cm)

// Welle 2 (EN): `locale` – the title in English on /en/sofaplaner.
// Rat 9,5 B11/C1: `compact` = mobiler Einstieg (kurze Bildunterschrift); Marker-ID je Instanz (zwei Zeichnungen auf einer Seite).
// Meter mit deutschem Dezimalkomma (5,2 statt 5.2) – QM planer-tools
const m = (cm) => (cm / 100).toLocaleString("de-AT");
const NB = "\u00a0"; // Zahl und Einheit nicht trennen (QM planer-tools)

// Sprachen-Welle FR/IT (01.11.2026): Titel, Beschriftungen und Bildunterschrift
// auf Französisch/Italienisch (Meter mit Dezimalkomma wie DE).
const mi = (cm, loc) => (cm / 100).toLocaleString(loc);
const INTL = {
  fr: {
    title: (o) => `Exemple de vue de dessus${NB}: canapé d’angle ${o.lauf} × ${o.chaise} cm, profondeur d’assise ${o.t} cm, dans une pièce de ${mi(o.w, "fr-FR")} × ${mi(o.h, "fr-FR")} m avec un passage de ${o.walk} cm devant la chaise longue`,
    window: "Fenêtre",
    door: "Porte",
    walk: "Passage",
    short: (o) => `Exemple sur plan${NB}: canapé d’angle ${o.lauf}${NB}×${NB}${o.chaise}${NB}cm, passage ${o.walk}${NB}cm. Dans le configurateur, vous dessinez votre propre pièce.`,
    lead: `Exemple sur plan${NB}:`,
    long: (o) => `canapé d’angle ${o.lauf}${NB}×${NB}${o.chaise}${NB}cm, profondeur d’assise ${o.t}${NB}cm, pièce ${mi(o.w, "fr-FR")}${NB}×${NB}${mi(o.h, "fr-FR")}${NB}m. Dans le configurateur, vous dessinez votre propre pièce, et il vérifie passages et fenêtres.`,
  },
  it: {
    title: (o) => `Esempio di vista dall’alto: divano angolare ${o.lauf} × ${o.chaise} cm, profondità seduta ${o.t} cm, in un ambiente di ${mi(o.w, "it-IT")} × ${mi(o.h, "it-IT")} m con un passaggio di ${o.walk} cm davanti alla chaise longue`,
    window: "Finestra",
    door: "Porta",
    walk: "Passaggio",
    short: (o) => `Esempio in pianta: divano angolare ${o.lauf}${NB}×${NB}${o.chaise}${NB}cm, passaggio ${o.walk}${NB}cm. Nel configuratore disegnate il vostro ambiente.`,
    lead: "Esempio in pianta:",
    long: (o) => `divano angolare ${o.lauf}${NB}×${NB}${o.chaise}${NB}cm, profondità seduta ${o.t}${NB}cm, ambiente ${mi(o.w, "it-IT")}${NB}×${NB}${mi(o.h, "it-IT")}${NB}m. Nel configuratore disegnate il vostro ambiente, con verifica di passaggi e finestre.`,
  },
};

export default function Draufsicht({ depth = 105, className, titleId = "sp-draufsicht-titel", locale = "de", compact = false }) {
  const pfeil = `${titleId}-pfeil`;
  const en = locale === "en";
  const ix = INTL[locale] || null;
  const t = Math.max(80, Math.min(130, Math.round(depth))); // Sitztiefe
  const lauf = 300; // Länge des Hauptteils
  const chaise = 170; // Länge der Chaiselongue
  const x0 = 60; // Abstand von der linken Wand
  const y0 = 0; // Sofa an der Rückwand
  const tisch = { w: 120, h: 70 };
  const tischY = y0 + t + 45; // Tisch vor dem Sofa
  const laufY = y0 + chaise; // Vorderkante der Chaiselongue
  const vb = `${-PAD} ${-PAD} ${RAUM.w + PAD * 2} ${RAUM.h + PAD * 2}`;
  const o = { lauf, chaise, t, w: RAUM.w, h: RAUM.h, walk: WALKWAY_IDEAL };
  const L = `M${x0},${y0} h${lauf} v${t} h${-(lauf - t)} v${chaise - t} h${-t} Z`;
  return (
    <figure className={className} data-sofa-draufsicht="">
      <svg viewBox={vb} role="img" aria-labelledby={titleId} className="block h-auto w-full">
        <title id={titleId}>{ix ? ix.title(o) : en ? `Example top view: corner sofa ${lauf} × ${chaise} cm, seat depth ${t} cm, in a room of ${RAUM.w / 100} × ${RAUM.h / 100} m with a ${WALKWAY_IDEAL} cm walkway in front of the chaise longue` : `Beispiel-Draufsicht: Ecksofa ${lauf} × ${chaise} cm, Sitztiefe ${t} cm, in einem Raum von ${m(RAUM.w)} × ${m(RAUM.h)} m mit ${WALKWAY_IDEAL} cm Laufweg vor der Chaiselongue`}</title>
        {/* Raum */}
        <rect x="0" y="0" width={RAUM.w} height={RAUM.h} fill="var(--color-paper, #faf8f4)" stroke="currentColor" strokeWidth="6" />
        {/* Fenster rechts */}
        <line x1={RAUM.w} y1="90" x2={RAUM.w} y2="270" stroke="var(--color-see, #3c6e7a)" strokeWidth="10" />
        <text x={RAUM.w - 14} y="180" textAnchor="end" fontSize="17" fill="currentColor" opacity="0.7">{ix ? ix.window : en ? "Window" : "Fenster"}</text>
        {/* Tür unten links mit Schwenkbogen */}
        <path d={`M30,${RAUM.h} a90,90 0 0 1 90,-90`} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <line x1="30" y1={RAUM.h} x2="120" y2={RAUM.h} stroke="var(--color-paper, #faf8f4)" strokeWidth="8" />
        <text x="125" y={RAUM.h - 12} fontSize="17" fill="currentColor" opacity="0.7">{ix ? ix.door : en ? "Door" : "Tür"}</text>
        {/* Ecksofa: Sitz + Rücken */}
        <path d={L} fill="var(--color-linen, #ece6dc)" stroke="currentColor" strokeWidth="3" />
        <path d={`M${x0},${y0 + 22} h${lauf} M${x0 + 22},${y0 + 22} v${chaise - 22}`} stroke="currentColor" strokeWidth="1.5" opacity="0.45" fill="none" />
        {[1, 2].map((i) => (
          <line key={i} x1={x0 + t + ((lauf - t) / 3) * i} y1={y0 + 22} x2={x0 + t + ((lauf - t) / 3) * i} y2={y0 + t} stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        ))}
        <line x1={x0} y1={y0 + t} x2={x0 + t} y2={y0 + t} stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        {/* Tisch */}
        <rect x={x0 + t + 40} y={tischY} width={tisch.w} height={tisch.h} fill="none" stroke="currentColor" strokeWidth="2.5" />
        {/* Laufweg zur Tür */}
        <rect x="0" y={laufY} width={x0 + t} height={WALKWAY_IDEAL} fill="var(--color-see, #3c6e7a)" opacity="0.1" />
        <line x1={x0 + t / 2} y1={laufY} x2={x0 + t / 2} y2={laufY + WALKWAY_IDEAL} stroke="var(--color-see, #3c6e7a)" strokeWidth="2.5" markerStart={`url(#${pfeil})`} markerEnd={`url(#${pfeil})`} />
        <text x={x0 + t + 12} y={laufY + WALKWAY_IDEAL - 6} fontSize="18" fill="currentColor">{ix ? ix.walk : en ? "Walkway" : "Laufweg"} {WALKWAY_IDEAL} cm</text>
        {/* Maße */}
        <line x1={x0} y1={-16} x2={x0 + lauf} y2={-16} stroke="currentColor" strokeWidth="1.5" markerStart={`url(#${pfeil})`} markerEnd={`url(#${pfeil})`} />
        <text x={x0 + lauf / 2} y={-22} textAnchor="middle" fontSize="18" fill="currentColor">{lauf} cm</text>
        <line x1={x0 - 16} y1={y0} x2={x0 - 16} y2={y0 + chaise} stroke="currentColor" strokeWidth="1.5" markerStart={`url(#${pfeil})`} markerEnd={`url(#${pfeil})`} />
        <text x={x0 - 22} y={y0 + chaise / 2} textAnchor="middle" fontSize="18" fill="currentColor" transform={`rotate(-90 ${x0 - 22} ${y0 + chaise / 2})`}>
          {chaise} cm
        </text>
        <defs>
          <marker id={pfeil} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
          </marker>
        </defs>
      </svg>
      <figcaption>
        {ix ? (
          compact ? (
            <>{ix.short(o)}</>
          ) : (
            <>
              <span className="font-medium">{ix.lead}</span> {ix.long(o)}
            </>
          )
        ) : compact ? (
          en ? (
            <>Example floor plan: corner sofa {lauf}{NB}×{NB}{chaise}{NB}cm, walkway {WALKWAY_IDEAL}{NB}cm. In the planner you draw your own room.</>
          ) : (
            <>Beispiel im Grundriss: Ecksofa {lauf}{NB}×{NB}{chaise}{NB}cm, Laufweg {WALKWAY_IDEAL}{NB}cm. Im Planer zeichnen Sie Ihren eigenen Raum.</>
          )
        ) : en ? (
          <>
            <span className="font-medium">Example in the floor plan:</span> corner sofa {lauf}{NB}×{NB}{chaise}{NB}cm, seat depth {t}{NB}cm, room {RAUM.w / 100}{NB}×{NB}{RAUM.h / 100}{NB}m. In the planner you draw your own room, and the planner checks walkways and windows.
          </>
        ) : (
          <>
            <span className="font-medium">Beispiel im Grundriss:</span> Ecksofa {lauf}{NB}×{NB}{chaise}{NB}cm, Sitztiefe {t}{NB}cm, Raum {m(RAUM.w)}{NB}×{NB}{m(RAUM.h)}{NB}m. Im Planer zeichnen Sie Ihren eigenen Raum, der Planer prüft Laufwege und Fenster.
          </>
        )}
      </figcaption>
    </figure>
  );
}
