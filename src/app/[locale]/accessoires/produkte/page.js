// /<locale>/accessoires/produkte – Übersicht des statischen Herstellerkatalogs
// (src/lib/katalog, Anleitung qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md).
// Logik: src/components/Katalog/katalogRoutes.js. 404, solange die Welt keine Produkte hat.
// Shop-Liste (Inhaber 31.10.2026: „echtes Webshop-Gefühl“) statt der gruppierten Katalogliste.
import AccessoiresListe from "@/components/Katalog/AccessoiresListe";
import { uebersichtMetadata, uebersichtParams, uebersichtProps } from "@/components/Katalog/katalogRoutes";

const WELT = "accessoires";
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
  return <AccessoiresListe {...p} />;
}
