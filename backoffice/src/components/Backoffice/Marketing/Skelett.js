// Lade-Skelett des Bereichs Marketing in exakter Kachelform (lounge.md §9 Nr. 8): gleiche Radien, Fläche 2, Schimmer
// 1,2 s (bei reduzierter Bewegung statisch über .bo-skeleton). Kopf, Werkzeugzeile und Zeilen mit Bildquadrat.
import "./marketing.css";

export default function Skelett({ zeilen = 8, bento = false }) {
  return (
    <div className="px-4 pt-28 md:pl-[120px] md:pr-8" aria-busy="true" aria-label="Lädt">
      <div className="bo-skeleton mb-2 h-4 w-40 !rounded-full" />
      <div className="bo-skeleton mb-8 h-9 w-72 !rounded-[12px]" />
      {bento ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="bo-skeleton h-[520px] !rounded-[28px] xl:col-span-7" />
          <div className="grid grid-cols-2 gap-6 xl:col-span-5">
            <div className="bo-skeleton h-56 !rounded-[28px]" />
            <div className="bo-skeleton h-56 !rounded-[28px]" />
            <div className="bo-skeleton col-span-2 h-48 !rounded-[28px]" />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-3">
            <div className="bo-skeleton h-10 w-96 !rounded-full" />
            <div className="bo-skeleton ml-auto h-10 w-64 !rounded-full" />
          </div>
          <div className="rounded-[28px] bg-bo-surface p-5 shadow-(--bo-sh-tile)">
            {Array.from({ length: zeilen }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="bo-skeleton size-12 !rounded-[14px]" />
                <div className="flex-1">
                  <div className="bo-skeleton mb-2 h-4 w-1/3 !rounded-full" />
                  <div className="bo-skeleton h-3 w-1/5 !rounded-full" />
                </div>
                <div className="bo-skeleton h-7 w-28 !rounded-full" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
