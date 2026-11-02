// Drei Standbilder aus dem Video (bei Testraum: aus dem Rechenmodell).
// Fallback ohne WebGL2 und bei „nur Fotos“. Bilder kommen über die geschützte Route.
/* eslint-disable @next/next/no-img-element -- private Bilder über geschützte Route, kein next/image-Optimierer */

export default function Standbilder({ projektId, standbilder = [], kennzeichnung }) {
  if (!standbilder.length) return null;
  return (
    <figure className="m-0">
      <ul className="grid gap-3 sm:grid-cols-3">
        {standbilder.map((b) => (
          <li key={b.id}>
            <img
              src={`/api/portal/raum/${projektId}/datei/standbild/${b.id}`}
              alt={b.alt}
              width={b.breite}
              height={b.hoehe}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full border border-ink/10 bg-stone"
            />
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 text-xs text-ink/70">{kennzeichnung ? "Standbilder aus dem synthetischen Testraum." : "Standbilder aus Ihrem Raumvideo."} Maße aus Video, Aufmaß vor Bestellung.</figcaption>
    </figure>
  );
}
