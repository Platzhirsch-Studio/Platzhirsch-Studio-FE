// /<locale>/kuechengeraete/marke/<marke> – alle Katalog-Produkte einer Marke
// (nur Marken mit ≥ 1 Produkt; sonst 404). Logik: src/components/Katalog/katalogRoutes.js.
import KatalogListe from "@/components/Katalog/KatalogListe";
import { markeMetadata, markeParams, markeProps } from "@/components/Katalog/katalogRoutes";

const WELT = "kuechengeraete";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return markeParams(WELT);
}

export function generateMetadata(props) {
  return markeMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await markeProps(WELT, props);
  return <KatalogListe {...p} />;
}
