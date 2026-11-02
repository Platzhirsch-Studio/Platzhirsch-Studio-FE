// Aufnahmehilfe für das Raumvideo: drei Sätze und eine kleine Strichzeichnung
// (eigene Grafik, keine KI). Auch für den Handy-Upload nutzbar (Kategorie
// „Raumvideo“, Integration siehe Feature-Doku neuland.md §3.6).
import { A4_HINWEIS, AUFNAHMEHILFE } from "@/lib/raumzwilling/config";

function Zeichnung() {
  return (
    <svg viewBox="0 0 220 150" className="h-auto w-full max-w-[260px]" role="img" aria-labelledby="ah-t">
      <title id="ah-t">Skizze: Raum von oben, ein Weg mit Pfeilen langsam an allen Wänden entlang, ein A4-Blatt auf dem Boden.</title>
      <rect x="20" y="15" width="180" height="120" fill="#faf8f4" stroke="#30373e" strokeWidth="2" />
      <rect x="85" y="13" width="50" height="4" fill="#9a7a2a" />
      <path d="M 45 112 C 40 60, 60 38, 110 38 S 180 50, 178 82 S 150 118, 95 112" fill="none" stroke="#30373e" strokeWidth="1.6" strokeDasharray="5 4" />
      <path d="M 95 112 l 8 -5 m -8 5 l 8 5" stroke="#30373e" strokeWidth="1.6" fill="none" />
      <g transform="translate(45 112)">
        <rect x="-7" y="-12" width="14" height="24" rx="2" fill="#30373e" />
        <path d="M 0 -14 L -18 -38 M 0 -14 L 18 -38" stroke="#9a7a2a" strokeWidth="1.2" />
      </g>
      <rect x="120" y="70" width="21" height="29.7" fill="#fff" stroke="#9a7a2a" strokeWidth="1.4" transform="rotate(-12 130 85)" />
      <text x="132" y="118" fontSize="9" fill="#5c636a" textAnchor="middle">A4</text>
    </svg>
  );
}

export default function Aufnahmehilfe({ mitA4 = true }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
      <ol className="space-y-3">
        {AUFNAHMEHILFE.map((s, i) => (
          <li key={s.key} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center bg-ink text-xs font-semibold text-white" aria-hidden="true">
              {i + 1}
            </span>
            <p className="text-[15px] leading-relaxed text-ink/90">
              <strong className="font-semibold text-ink">{s.title}.</strong> {s.text}
            </p>
          </li>
        ))}
        {mitA4 && <li className="pl-10 text-sm leading-relaxed text-ink/80">{A4_HINWEIS}</li>}
      </ol>
      <Zeichnung />
    </div>
  );
}
