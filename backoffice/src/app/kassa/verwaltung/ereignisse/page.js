import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "Ereignisse · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – Ereignisse (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Ereignisse({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH Kassa Ereignis" pfad="/kassa/verwaltung/ereignisse" titel="Ereignisse" untertitel="Ausfälle der Signatureinheit und der Kasse, Meldungen an FinanzOnline, Startbeleg." sp={sp} spalten={["name", "zeitpunkt", "kasse", "art", "status", "meldung_finanzonline_noetig", "dauer_h"]} sortStandard={"zeitpunkt desc"} recht="read" />;
}
