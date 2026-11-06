// Skelett des Bereichs Service in exakter Kachelform (lounge.md §9 Nr. 8): gleiche Radien, Fläche 2, Schimmer.
export default function Loading() {
  return (
    <div className="px-4 pt-28 md:pl-[120px] md:pr-8" aria-busy="true" aria-label="Lädt">
      <div className="bo-skeleton mb-3 h-4 w-40 rounded-pill" />
      <div className="bo-skeleton mb-8 h-10 w-72 rounded-bo-ctl" />
      <div className="bo-bento">
        <div className="bo-skeleton h-[420px] rounded-bo-kachel md:col-span-8" />
        <div className="grid grid-cols-2 gap-(--bo-bento-gap) md:col-span-4">
          <div className="bo-skeleton h-56 rounded-bo-kachel" />
          <div className="bo-skeleton h-56 rounded-bo-kachel" />
          <div className="bo-skeleton col-span-2 h-40 rounded-bo-kachel" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bo-skeleton h-32 rounded-bo-kachel md:col-span-3" />
        ))}
      </div>
    </div>
  );
}
