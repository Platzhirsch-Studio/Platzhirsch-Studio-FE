import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "DEP-Export · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – DEP-Export (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Dep({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH DEP Export" pfad="/kassa/verwaltung/dep" titel="DEP-Export" untertitel="Datenerfassungsprotokolle (RKSV) mit Prüfsumme." sp={sp} spalten={["name", "kasse", "art", "status", "zeitraum_von", "zeitraum_bis", "anzahl_belege", "erstellt_am"]} sortStandard={"erstellt_am desc"} recht="read" />;
}
