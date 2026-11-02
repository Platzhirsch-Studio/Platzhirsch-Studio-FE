// /<locale>/kuechengeraete/produkte – Übersicht des statischen Herstellerkatalogs
// (src/lib/katalog, Anleitung qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md).
// Logik: src/components/Katalog/katalogRoutes.js. 404, solange die Welt keine Produkte hat.
// Inhaber 31.10.2026: Ansicht wie die Küchen-Kategorieseite (KatalogShopListe:
// Filterleiste, 3er-Raster, „Mehr Produkte anzeigen“); Ziel des Menüpunkts „Küchengeräte“.
import KatalogShopListe from "@/components/Katalog/KatalogShopListe";
import { uebersichtMetadata, uebersichtParams, uebersichtProps } from "@/components/Katalog/katalogRoutes";

const WELT = "kuechengeraete";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return uebersichtParams(WELT);
}

export function generateMetadata(props) {
  return uebersichtMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await uebersichtProps(WELT, props);
  return <KatalogShopListe locale={p.locale} welt={p.welt} />;
}
