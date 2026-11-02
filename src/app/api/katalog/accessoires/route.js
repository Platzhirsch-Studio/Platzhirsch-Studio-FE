// /api/katalog/accessoires – kompakter Index der Accessoire-Welt für die
// Filter-Insel der Shop-Liste (src/components/Katalog/ShopGrid.js).
// Die Insel lädt ihn erst bei der ersten Filter-/Sortier-/„Weitere laden“-
// Aktion (oder wenn die URL schon Filter trägt); die erste Seite der Liste
// steht vollständig im Server-HTML (LCP, Crawler). Statisch erzeugt und
// täglich neu (gleicher Takt wie die Listen: Preise blenden sich nach Ablauf aus).
// Sprachneutral: Kategorie-Beschriftungen reicht die Seite als Props, Bilder
// tragen auf der Kachel alt="" (der Produktname steht als Linktext daneben).
// Inhalt nur aus den Herstellerdaten; keine Lagerstände, keine Bewertungen.
import { produkteByWelt } from "@/lib/katalog";
import { heuteIso } from "@/lib/katalog/config";
import { eintragVon, facettenLabels, markenNamen } from "@/lib/katalog/shopIndex";
import { shopMode } from "@/lib/shop/mode";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const list = produkteByWelt("accessoires");
  const heute = heuteIso();
  const mode = shopMode(process.env);
  const body = {
    v: 1,
    stand: heute,
    marken: markenNamen(list),
    labels: facettenLabels(list),
    // Katalogreihenfolge, ungemischt: die Insel mischt den Ausschnitt (Kategorie/Marke) selbst –
    // gleiche Eingabe wie eintraegeFuer() auf dem Server, also gleiche Reihenfolge.
    items: list.map((p) => eintragVon(p, { heute, mode })),
  };
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
