"use client";
// Kartenbild mit Ersatz (QA R2 P2-3): Lädt das Herstellerbild nicht, erscheint die
// eigene Axonometrie des Raumbedarfs (fallback), sonst eine neutrale Fläche mit dem
// Produktnamen. Ein kaputtes Bild-Symbol erscheint nie. Herstellerbilder unverändert
// (object-contain, kein Zuschnitt).
import Image from "next/image";
import { useState } from "react";

export default function CardImage({ src, fallback = null, cutout = false, alt = "", name, sizes, eager = false }) {
  // Fehlerzustand je Quelle: wechselt src (neue Seite der Liste), gilt er nicht mehr.
  const [failed, setFailed] = useState({});
  const current = !failed[src] && src ? src : fallback && !failed[fallback] ? fallback : null;
  if (!current) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-linen px-4 text-center text-small text-text-soft" data-testid="arv-bild-ersatz">
        <span>
          {name}
          <span className="sr-only"> – Bild gerade nicht verfügbar</span>
        </span>
      </div>
    );
  }
  const isCutout = current === src ? cutout : true;
  return (
    <Image
      key={current}
      src={current}
      alt={current === src ? alt : `${name}: Raumbedarf als Zeichnung`}
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      // freigestellte Poster/Axonometrien sind fertige WebP – kein Optimizer nötig
      unoptimized={isCutout}
      onError={() => setFailed((f) => ({ ...f, [current]: true }))}
      className={`object-contain ${isCutout ? "p-[10%]" : "p-[6%]"}`}
    />
  );
}
