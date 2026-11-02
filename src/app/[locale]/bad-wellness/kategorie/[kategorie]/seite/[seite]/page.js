// /<locale>/bad-wellness/kategorie/<kategorie>/seite/<n> – Folgeseiten (n ≥ 2) einer Kategorie.
import KatalogListe from "@/components/Katalog/KatalogListe";
import { kategorieMetadata, kategorieParams, kategorieProps } from "@/components/Katalog/katalogRoutes";

const WELT = "bad-wellness";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return kategorieParams(WELT, true);
}

export function generateMetadata(props) {
  return kategorieMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await kategorieProps(WELT, props);
  return <KatalogListe {...p} />;
}
