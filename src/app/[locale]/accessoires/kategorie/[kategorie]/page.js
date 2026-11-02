// /<locale>/accessoires/kategorie/<kategorie> – alle Katalog-Produkte einer Kategorie
// (Inhaber-Entscheidung Nr. 25), Seite 1. Logik: src/components/Katalog/katalogRoutes.js.
// Shop-Liste (Inhaber 31.10.2026: „echtes Webshop-Gefühl“) statt der gruppierten Katalogliste.
import AccessoiresListe from "@/components/Katalog/AccessoiresListe";
import { kategorieMetadata, kategorieParams, kategorieProps } from "@/components/Katalog/katalogRoutes";

const WELT = "accessoires";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return kategorieParams(WELT);
}

export function generateMetadata(props) {
  return kategorieMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await kategorieProps(WELT, props);
  return <AccessoiresListe {...p} />;
}
