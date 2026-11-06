import { KassaListe } from "@/components/Backoffice/Kassa/Verwaltung";

export const metadata = { title: "Kassen · Kassa" };
export const dynamic = "force-dynamic";

// Kassa-Verwaltung – Kassen (Team B-KAS, Konzept §4). Liste mit Filter, Sortierung, Export nach Recht.
export default async function Kassen({ searchParams }) {
  const sp = await searchParams;
  return <KassaListe doctype="PH Kasse" pfad="/kassa/verwaltung/kassen" titel="Kassen" untertitel="Registrierkassen mit Signatureinheit, Belegzähler und Trainingsmodus." sp={sp} spalten={["kassen_id", "bezeichnung", "standort", "status", "see", "trainings_modus", "letzter_beleg_am"]} sortStandard={undefined} recht="read" />;
}
