// ShowroomPoster – Standbild des Rundgangs: LCP der Seite /showroom.
// AVIF (≤ 120 KB je Fassung, Budget in src/lib/showroom/config.js) mit WebP
// als Rückfall; mobil eine eigene 4:5-Fassung (poster.tall), ab 768 px die
// breite. Sofort voll deckend (Bibel §8.2: das LCP-Bild wird nicht eingeblendet).
// Ohne Poster (vor der ersten Aufnahme) eine stehende Fläche, kein Platzhalterbild.
// Server- und Client-tauglich (keine Hooks).
import s from "./showroom.module.css";

const NARROW = "(max-width: 767.98px)";

export default function ShowroomPoster({ poster, alt, dim = false, priority = false }) {
  if (!poster?.avif && !poster?.webp) return <div className={s.posterEmpty} aria-hidden="true" />;
  const tall = poster.tall;
  const wide = tall ? "(min-width: 768px)" : undefined;
  return (
    <picture className={dim ? s.posterDim : s.poster}>
      {poster.avif && <source type="image/avif" srcSet={poster.avif} media={wide} width={poster.width} height={poster.height} />}
      {poster.webp && <source type="image/webp" srcSet={poster.webp} media={wide} width={poster.width} height={poster.height} />}
      {/* QM content-legal r3: the tall sources carry their own media query – without it
          desktop Chromium started poster-mobil.avif and aborted it (net::ERR_ABORTED). */}
      {tall?.avif && <source type="image/avif" srcSet={tall.avif} media={NARROW} width={tall.width} height={tall.height} />}
      {tall?.webp && <source type="image/webp" srcSet={tall.webp} media={NARROW} width={tall.width} height={tall.height} />}
      <img
        src={tall?.webp || poster.webp || poster.avif}
        alt={alt}
        width={tall?.width || poster.width}
        height={tall?.height || poster.height}
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
      />
    </picture>
  );
}
