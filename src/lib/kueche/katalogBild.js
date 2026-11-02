// src/lib/kueche/katalogBild.js
// Inhaber 31.10.2026 („alle Vorschaubilder gleich groß“): Marken ohne eigenes
// Bild (GERAETE_MARKEN[].image = null) zeigen ein Bild aus dem
// Herstellerkatalog – Verweis `katalogBild: { produkt, index }` in geraete.js.
// Getrennt von geraete.js, damit dessen Importeure (Navigation, Sitemap,
// Marken-Index) nicht den ganzen Katalog laden. Rein, ohne "@/"-Importe.
import { produktBySlug } from "../katalog/index.js";
import { textOf } from "../katalog/schema.js";

/** {src, width, height, alt} des Katalogbilds einer Gerätemarke oder null. */
export function katalogBild(marke, locale = "de") {
  const ref = marke?.katalogBild;
  const bild = ref ? produktBySlug(ref.produkt)?.bilder?.[ref.index] : null;
  return bild ? { src: bild.src, width: bild.width, height: bild.height, alt: textOf(bild.alt, locale) } : null;
}
