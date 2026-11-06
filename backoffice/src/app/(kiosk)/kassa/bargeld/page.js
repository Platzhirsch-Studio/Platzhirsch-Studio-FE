import BargeldKiosk from "@/components/Backoffice/Kassa/BargeldKiosk";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kassaClient, kassenbuch } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { getGeraet } from "@/lib/backoffice/auth/dal";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Bargeld · Kassa" };
export const dynamic = "force-dynamic";

// Bargeld einlegen/entnehmen (Team B-KAS, Konzept §3.7, F8) – als eigene Route für den Rücksprung.
export default async function BargeldSeite({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet } = await kioskZugang("kassa");
  const client = kassaClient(session);
  const g = await getGeraet().catch(() => null);
  let kontext;
  try {
    kontext = await rufe(client, "kontext", { kasse: g?.kasse || undefined });
  } catch (err) {
    return <KassaFehler session={session} geraet={geraet} code={err?.code || "unavailable"} message={err?.message} />;
  }
  if (!kontext?.kasse) return <KassaFehler session={session} geraet={geraet} code="ohne-kasse" />;
  const heute = new Date();
  const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}-${String(heute.getDate()).padStart(2, "0")}`;
  const [zeilen, projekte, faehig] = await Promise.all([
    kassenbuch(session, { kasse: kontext.kasse }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "status"], filters: [["status", "not in", ["Abgeschlossen", "Storniert", "Archiviert"]]], orderBy: "modified desc", limit: 40 }).catch(() => []),
    kassaFaehigkeiten(session, { client }),
  ]);
  const buchungen = zeilen.filter((z) => z.datum === tag && z.status === "Gebucht" && ["Einlage", "Entnahme", "Anfangsbestand"].includes(z.art)).map((z) => ({ name: z.name, art: z.art, betrag_cent: z.betrag_cent, grund: z.grund, zeitpunkt: z.zeitpunkt }));
  return <BargeldKiosk kontext={kontext} buchungen={buchungen} projekte={projekte.map((p) => ({ name: p.name, titel: p.titel }))} faehig={faehig} benutzer={{ name: session.name }} tagesstart={sp?.tagesstart === "1"} />;
}
