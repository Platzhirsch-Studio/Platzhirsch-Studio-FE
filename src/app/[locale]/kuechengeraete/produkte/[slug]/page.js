// /<locale>/kuechengeraete/produkte/<slug> – Produktdetail des statischen Herstellerkatalogs.
// Logik: src/components/Katalog/katalogRoutes.js, Darstellung: ProduktDetail.js.
import ProduktDetail from "@/components/Katalog/ProduktDetail";
import { produktMetadata, produktParams, produktProps } from "@/components/Katalog/katalogRoutes";

const WELT = "kuechengeraete";
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return produktParams(WELT);
}

export function generateMetadata(props) {
  return produktMetadata(WELT, props);
}

export default async function Page(props) {
  const p = await produktProps(WELT, props);
  return <ProduktDetail {...p} />;
}
