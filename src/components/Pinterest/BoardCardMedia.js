// Bildfläche einer Ideenboard-Karte (Server-sicher). Fester Rahmen 4:5
// (CLS 0), Platzhalter in linen ohne Shimmer (Bibel §8.2). Notiz-Karten
// zeigen ihren Text auf der ruhigen Bandfläche statt eines Bildes.
// Plain <img>: die Bilder sind schon optimiert (Ezarri -600.webp, /cmx-Proxy,
// Stil-Palette als PNG-Route); next/image würde sie ein zweites Mal rechnen.
// data-pin-nopin an allem, was nicht auf Pinterest darf (Herstellerbilder,
// Projekte ohne Einwilligung „pinterest“): die Browsererweiterung bietet es
// dann nicht an (QA Recht P2-4).
import { pinnable } from "@/lib/ideenboard/model";

export default function BoardCardMedia({ card, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" }) {
  if (card.type === "notiz") {
    return (
      <div className="flex aspect-[4/5] items-end bg-surface-band p-6">
        <p className="line-clamp-[10] whitespace-pre-line text-lead text-text">{card.note || card.title}</p>
      </div>
    );
  }
  const src = card.image;
  // Stil-Palette ist eine 2:3-Grafik: ganz zeigen statt beschneiden
  const contain = card.type === "stil";
  return (
    <div className={contain ? "aspect-[4/5] overflow-hidden bg-surface-band p-4" : "aspect-[4/5] overflow-hidden bg-linen"}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- vorab optimierte Dateien, siehe Kopf
        <img src={src} alt="" sizes={sizes} loading="lazy" decoding="async" width={800} height={1000} className={contain ? "size-full object-contain" : "size-full object-cover"} data-pin-nopin={pinnable(card) ? undefined : "true"} />
      ) : null}
    </div>
  );
}
