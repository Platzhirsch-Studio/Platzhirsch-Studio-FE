// /<locale>/accessoires/marke/<marke>/seite/<n> – Folgeseiten (n ≥ 2) einer Marke mit
// mehr als SEITE_GROESSE Produkten (Inhaber-Entscheidung Nr. 25). Seite 1 = …/marke/<marke>.
// Shop-Liste (Inhaber 31.10.2026: „echtes Webshop-Gefühl“) statt der gruppierten Katalogliste.
import AccessoiresListe from "@/components/Katalog/AccessoiresListe";
import { markeMetadata, markeParams, markeProps } from "@/components/Katalog/katalogRoutes";

const WELT = "accessoires";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return markeParams(WELT, true);
}

export function generateMetadata(props) {
  return markeMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await markeProps(WELT, props);
  return <AccessoiresListe {...p} />;
}
