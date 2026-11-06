// Skeleton in Zielform (Lounge §9.8): Seitenkopf + Kachel mit Zeilen, Fläche tile-2, Schimmer; ohne Bewegung bei reduce.
export default function Laden() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-28 md:pl-[120px] md:pr-8" aria-busy="true" aria-label="Wird geladen">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-[14px] bg-bo-surface-2 motion-reduce:animate-none" />
      <div className="bo-kachel">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="mb-3 h-14 animate-pulse rounded-[16px] bg-bo-surface-2 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
