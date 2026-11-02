// Eigenes Foto eines Atelier-Stücks (Sheet-Spalte foto_url: nur /atelier/…,
// atelierSource.js) oder eine neutrale Fläche ohne Motiv. Nie ein Hersteller- oder
// Ersatzbild (Bibel §7, R5-produkt). Server-Komponente.
import { cx } from "@/components/ui";

export default function AtelierPhoto({ item, priority = false, className }) {
  if (!item?.foto) {
    return (
      <div className={cx("flex aspect-4/5 items-center justify-center bg-linen", className)}>
        <p className="px-6 text-center text-small text-text-soft">Für dieses Stück liegt noch kein Foto vor</p>
      </div>
    );
  }
  return (
    // Foto-Pfade kommen aus dem Sheet (nur /atelier/…); einfaches <img> mit
    // fester Fläche gegen Layout-Verschiebung. Alt-Text: Beschreibung, sonst Titel.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.foto}
      alt={item.fotoAlt || item.titel || "Foto des Ausstellungsstücks"}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cx("aspect-4/5 w-full bg-linen object-cover", className)}
    />
  );
}
