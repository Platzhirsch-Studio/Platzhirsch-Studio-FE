// Lade-Skelett für alle Seiten (Streaming): grobe Form der Shell + Inhalt.
export default function Loading() {
  return (
    <div className="p-6" aria-busy="true" aria-label="Lädt">
      <div className="bo-skeleton mb-4 h-7 w-64" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bo-skeleton h-20" />
        ))}
      </div>
      <div className="bo-skeleton mt-4 h-64 w-full" />
    </div>
  );
}
