// Entwurfs-Hinweis des Schweiz-Hubs (Server Component). Steht vor dem Hero,
// im Fluss (nicht sticky, kein Overlay), Farbe `notice` als Linie, Text in
// `text` (Kontrast ≥ 4.5:1). Fällt erst mit der Freigabe durch Steuerberater
// und Zollspediteur weg (dann auch robots auf index stellen).
export default function DraftBanner({ title, text, ariaLabel = "Hinweis zum Stand dieser Seite" }) {
  return (
    <aside aria-label={ariaLabel} className="border-b border-line bg-surface-band">
      <div className="mx-auto w-full max-w-page px-gutter py-4">
        <p className="border-l-4 border-notice pl-4 text-small text-text">
          <strong className="font-semibold">{title}.</strong> {text}
        </p>
      </div>
    </aside>
  );
}
