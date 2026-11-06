// Arbeitsplatz Technik mobil (10-konzept-service §7, Entscheidung Nr. 49): eigene Einsätze heute und diese Woche.
import { kioskZugang } from "../kiosk";
import { isoDatum } from "@/lib/backoffice/format";
import { verschiebe, wochenStart } from "@/lib/backoffice/datum";
import { serviceClient } from "@/lib/backoffice/service/daten";
import { TechnikStart } from "@/components/Backoffice/Service/Technik";

export const metadata = { title: "Technik" };
export const dynamic = "force-dynamic";

const FELDER = ["name", "titel", "status", "art", "datum", "zeit_von", "zeit_bis", "kunde_name", "ort", "strasse", "plz", "servicefall", "mitzubringen", "bestaetigt_kunde_am", "techniker", "techniker_2"];

export default async function TechnikPage() {
  const { session, geraet, benutzer } = await kioskZugang("technik");
  const client = serviceClient(session);
  const heute = isoDatum();
  const start = wochenStart(heute);
  const alle = await client.getList("PH Serviceeinsatz", { fields: FELDER, filters: [["datum", "between", [start, verschiebe(start, { tage: 6 })]], ["status", "!=", "Abgebrochen"]], orderBy: "datum asc, zeit_von asc", limit: 300 });
  const eigene = alle.filter((e) => e.techniker === session.user || e.techniker_2 === session.user);
  const zeigeAlle = !eigene.length && !session.roles.includes("PH Techniker");
  const woche = zeigeAlle ? alle : eigene;
  return <TechnikStart heute={woche.filter((e) => e.datum === heute)} woche={woche} benutzer={benutzer} geraet={geraet} alle={zeigeAlle} heuteIso={heute} />;
}
