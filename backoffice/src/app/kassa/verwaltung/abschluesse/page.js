import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "Abschlüsse · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – Abschlüsse (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Abschluesse({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH Kassenabschluss" pfad="/kassa/verwaltung/abschluesse" titel="Abschlüsse" untertitel="Tagesabschlüsse mit Soll, Ist und Differenz." sp={sp} spalten={["name", "datum", "kasse", "status", "umsatz_cent", "bargeld_soll_cent", "bargeld_ist_cent", "differenz_cent"]} sortStandard={"datum desc"} recht="read" />;
}
