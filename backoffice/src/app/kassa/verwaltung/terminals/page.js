import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "Terminals · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – Terminals (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Terminals({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH Terminal" pfad="/kassa/verwaltung/terminals" titel="Terminals" untertitel="Kartenterminals je Kasse." sp={sp} spalten={["reader_id", "bezeichnung", "kasse", "status", "testmodus", "letzter_kontakt"]} sortStandard={undefined} recht="write" />;
}
