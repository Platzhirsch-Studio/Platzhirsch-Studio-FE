// Hinweise zur Raum-Kalibrierung für AR (Quick Look / Scene Viewer / WebXR).
// Server-sicher. compact = Kurzfassung für die Übersichtsseite.
import { Sun, Move3d, Ruler, Footprints } from "lucide-react";

const TIPS = [
  {
    Icon: Sun,
    title: "Hell und mit Struktur",
    text: "Das Handy erkennt den Boden an Kanten und Mustern. Licht an, und auf einfarbigem Teppich oder glänzendem Stein hilft eine Zeitung als Orientierung.",
  },
  {
    Icon: Move3d,
    title: "Langsam schwenken",
    text: "Halten Sie das Handy auf Brusthöhe und schwenken Sie zwei, drei Sekunden über den Boden, bis das Raster erscheint. Erst dann tippen.",
  },
  {
    Icon: Footprints,
    title: "Grundfläche prüfen",
    text: "Beim AR-Foto zeigt das Rechteck am Boden die echte Breite und Tiefe. Die Linie ist genau, das Foto darüber eine Annäherung.",
    // R2 neuland P2-1: nur der Text der aktiven Ansicht
    byStufe: {
      raumbedarf: "Der helle Quader zeigt die echte Breite, Tiefe und Höhe. So sehen Sie, wie viel Platz das Möbel braucht – seine Form zeigt er nicht.",
      "3d": "Das Modell steht in Originalgröße im Raum. Blenden Sie die Maße ein und prüfen Sie Abstände zu Wand, Tür und Laufweg.",
    },
  },
  {
    Icon: Ruler,
    title: "Mit dem Zollstock gegenprüfen",
    text: "Legen Sie einen Zollstock oder ein A4-Blatt (29,7 cm) daneben. Weicht die Größe ab, Boden neu erkennen lassen: AR schließen und neu starten.",
  },
];

export default function RoomTips({ compact = false, headingLevel = 2, stufe = null }) {
  const H = `h${headingLevel}`;
  const list = (compact ? TIPS.slice(0, 2).concat(TIPS[3]) : TIPS).map((t) => (t.byStufe && stufe && t.byStufe[stufe] ? { ...t, text: t.byStufe[stufe] } : t));
  return (
    <div>
      <H className="text-title">Raum vorbereiten</H>
      <ul className={`mt-3 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        {list.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-text" strokeWidth={1.5} />
            <p className="text-small leading-relaxed text-text-soft">
              <span className="font-medium text-text">{title}. </span>
              {text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
