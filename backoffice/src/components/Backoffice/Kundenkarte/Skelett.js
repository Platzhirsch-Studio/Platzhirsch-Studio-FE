import cx from "../cx";

// Skelette in exakter Kachelform (Lounge §9.8): gleiche Radien, Fläche 2, Schimmer aus .bo-skeleton.

export function KachelSkelett({ hoehe = 160, className, zeilen = 0 }) {
  return (
    <div className={cx("bo-kachel bo-kachel--dicht", className)} style={{ minHeight: hoehe }} aria-busy="true">
      <span className="bo-skeleton block h-4 w-40" aria-hidden="true" />
      <span className="bo-skeleton mt-2 block h-3 w-24" aria-hidden="true" />
      {Array.from({ length: zeilen }, (_, i) => (
        <span key={i} className="bo-skeleton mt-4 block h-11 w-full rounded-2xl" aria-hidden="true" />
      ))}
      <span className="sr-only" role="status">
        Wird geladen …
      </span>
    </div>
  );
}

export function ListenSkelett({ zeilen = 8 }) {
  return (
    <div className="bo-kachel" aria-busy="true">
      <span className="sr-only" role="status">
        Wird geladen …
      </span>
      {Array.from({ length: zeilen }, (_, i) => (
        <span key={i} className="bo-skeleton mb-3 block h-11 w-full rounded-2xl" aria-hidden="true" />
      ))}
    </div>
  );
}
