import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "Belege · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – Belege (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Belege({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH Kassenbeleg" pfad="/kassa/verwaltung/belege" titel="Belege" untertitel="Alle Belege aller Kassen – nur lesen. Stornieren und Zurücknehmen an der Kassa." sp={sp} spalten={["belegnummer", "datum_uhrzeit", "belegart", "kunde_name", "bediener", "gesamt_cent", "status", "kasse"]} sortStandard={"datum_uhrzeit desc"} recht="read" />;
}
