// <picture> mit AVIF und WebP aus den vorab erzeugten Größen (bildPipeline.js).
// Kein next/image: die Bilder liegen hinter einer Session-Route (privat) bzw.
// müssen nach Widerruf sofort verschwinden (kein Optimizer-Plattencache).
// Feste aspect-ratio aus den gespeicherten Maßen → kein Layout-Sprung (CLS).

export function srcSet(url, varianten, fmt) {
  return varianten.map((v) => `${url(`${v.w}.${fmt}`)} ${v.w}w`).join(", ");
}

/**
 * @param {{ foto: {varianten:{w:number,h:number}[], breite:number, hoehe:number}, url: (datei:string)=>string, alt: string, sizes?: string, priority?: boolean, className?: string, imgClassName?: string }} props
 *   url("1280.webp") → vollständige URL dieser Variante
 */
export default function TagebuchBild({ foto, url, alt, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false, fill = false, className = "" }) {
  const v = [...(foto.varianten || [])].sort((a, b) => a.w - b.w);
  const mittel = v.find((x) => x.w >= 1280) || v[v.length - 1];
  return (
    <picture className={`block ${fill ? "h-full w-full" : ""} ${className}`}>
      <source type="image/avif" srcSet={srcSet(url, v, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(url, v, "webp")} sizes={sizes} />
      <img
        src={url(`${mittel.w}.webp`)}
        alt={alt}
        width={mittel.w}
        height={mittel.h}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={fill ? "block h-full w-full bg-stone object-cover" : "block h-auto w-full bg-stone"}
        style={fill ? undefined : { aspectRatio: `${foto.breite} / ${foto.hoehe}` }}
      />
    </picture>
  );
}

/** URL-Bauer für private Tagebuch-Bilder. */
export const privateUrl = (projektId, fotoId) => (datei) => `/api/portal/tagebuch/${encodeURIComponent(projektId)}/bild/${fotoId}-${datei}`;

/** URL-Bauer für öffentliche Referenz-Bilder. */
export const referenzUrl = (freigabeId, fotoId) => (datei) => `/api/portal/tagebuch/referenz/${freigabeId}/${fotoId}-${datei}`;
