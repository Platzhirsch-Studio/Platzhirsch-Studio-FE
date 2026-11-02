import { LinkArrow, cx } from "@/components/ui";

// Brücke vom Werkzeug zum Menschen (Kern-USP, Inhaber-Entscheidung Nr. 8;
// Marktresearch/digital/features/usp-handzeichnung-designprozess.md, „Alle
// Planer“): „Online starten – Harald zeichnet Ihr Konzept anschließend von Hand“.
// Ruhige Zeile mit Linie links, kein Bild (echtes Material von Harald steht
// noch aus, keine KI-Skizzen). Server-Komponente, kein Client-JS.
// Deutsch: alle Planer- und Geschäftsfeldseiten sind deutsch.

const TEXTS = {
  planer: "Online starten – Harald Menghin zeichnet Ihr Konzept anschließend von Hand. Erst danach planen wir in 3D und zeigen Ihnen den Raum fotorealistisch.",
  feld: "Auch hier gilt unser Prozess: Wir sehen uns den Ort an, Harald Menghin zeichnet das Konzept von Hand, dann folgen 3D-Planung und Rendering.",
};

/**
 * @param {"planer"|"feld"} [variant]  Planer (Werkzeug) oder Geschäftsfeld
 * @param {{href: string, label: string}[]} [links]  weitere Querverweise (z. B. Bodensee-Licht)
 */
// `copy` (optional): { aria, text, link } in der Sprache der Seite (z. B. Dreiländer-Rechner EN/FR/IT).
export default function HandBridge({ variant = "planer", links = [], className, copy = null }) {
  return (
    <aside
      aria-label={copy?.aria || "Von der Handzeichnung zum Rendering"}
      data-hand-bridge={variant}
      className={cx("mx-auto max-w-page px-gutter", className)}
    >
      <div className="max-w-text border-l-2 border-ink py-1 pl-4">
        <p className="max-w-measure text-body text-text">{copy?.text || TEXTS[variant] || TEXTS.planer}</p>
        <p className="mt-2 flex flex-wrap gap-x-6">
          <LinkArrow href="/arbeitsweise">{copy?.link || "So arbeiten wir"}</LinkArrow>
          {links.map((l) => (
            <LinkArrow key={l.href} href={l.href}>
              {l.label}
            </LinkArrow>
          ))}
        </p>
      </div>
    </aside>
  );
}
