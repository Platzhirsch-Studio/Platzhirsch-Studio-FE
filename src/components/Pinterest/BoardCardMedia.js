// Bildfläche einer Ideenboard-Karte (Server-sicher). Fester Rahmen 4:5
// (CLS 0), Platzhalter in linen ohne Shimmer (Bibel §8.2). Notiz-Karten
// zeigen ihren Text auf der ruhigen Bandfläche statt eines Bildes.
// Plain <img>: die Bilder sind schon optimiert (Ezarri -600.webp, /cmx-Proxy,
// Stil-Palette als PNG-Route); next/image würde sie ein zweites Mal rechnen.
// data-pin-nopin an allem, was nicht auf Pinterest darf (Herstellerbilder,
// Projekte ohne Einwilligung „pinterest“): die Browsererweiterung bietet es
// dann nicht an (QA Recht P2-4).
// Druck 02.11.: Herstellerbilder aus dem Backoffice (/cmx, /cms) kommen in
// Originalgröße – der Ausdruck wurde 3 MB groß. Für Druckmedien liefert eine
// <picture>-Quelle dasselbe Bild über den Bildoptimierer in 640 px Breite
// (A4: drei Karten je Reihe, ca. 230 px); am Bildschirm bleibt alles wie bisher.
import { pinnable } from "@/lib/ideenboard/model";

const PRINT_WIDTH = 640;
const printSrc = (src) => (/^\/(?:cmx|cms)\//.test(src) ? `/_next/image?url=${encodeURIComponent(src)}&w=${PRINT_WIDTH}&q=75` : null);

export default function BoardCardMedia({ card, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" }) {
  if (card.type === "notiz") {
    return (
      // Druck 02.11.: Notiz als Textblock statt hoher Bandfläche.
      <div className="flex aspect-[4/5] items-end bg-surface-band p-6 print:aspect-auto print:items-start print:p-4">
        <p className="line-clamp-[10] whitespace-pre-line text-lead text-text print:text-body">{card.note || card.title}</p>
      </div>
    );
  }
  const src = card.image;
  // Stil-Palette ist eine 2:3-Grafik: ganz zeigen statt beschneiden
  const contain = card.type === "stil";
  const small = src ? printSrc(src) : null;
  const img = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- vorab optimierte Dateien, siehe Kopf
    <img src={src} alt="" sizes={sizes} loading="lazy" decoding="async" width={800} height={1000} className={contain ? "size-full object-contain" : "size-full object-cover"} data-pin-nopin={pinnable(card) ? undefined : "true"} />
  ) : null;
  return (
    <div className={contain ? "aspect-[4/5] overflow-hidden bg-surface-band p-4" : "aspect-[4/5] overflow-hidden bg-linen"}>
      {small ? (
        <picture className="contents">
          <source media="print" srcSet={small} />
          {img}
        </picture>
      ) : (
        img
      )}
    </div>
  );
}
