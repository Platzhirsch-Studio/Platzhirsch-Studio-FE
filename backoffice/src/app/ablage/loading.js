// Skelett der Ablage in Zielform (Q-E3): Baum-Kachel links, Pfad, Ordnerkacheln, Dateikarten 4:3.
export default function AblageLaden() {
  return (
    <div className="px-4 pt-28 lg:pr-8 lg:pl-[120px]" aria-busy="true" aria-label="Wird geladen">
      <div className="bo-skeleton mb-8 h-10 w-64 rounded-2xl" />
      <div className="bo-abl-drive">
        <div className="bo-skeleton hidden h-96 rounded-[28px] lg:block" />
        <div className="flex flex-col gap-6">
          <div className="bo-skeleton h-11 w-80 rounded-full" />
          <div className="bo-abl-ordnerraster">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bo-skeleton h-[72px] rounded-[20px]" />
            ))}
          </div>
          <div className="bo-abl-raster">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bo-skeleton aspect-[4/4.2] rounded-[20px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
