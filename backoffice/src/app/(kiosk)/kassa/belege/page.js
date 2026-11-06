import BelegeKiosk from "@/components/Backoffice/Kassa/BelegeKiosk";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kioskDaten, kassaClient } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Belege · Kassa" };
export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,79}$/;

// Belege heute / Beleg suchen (Team B-KAS, Konzept §3.9, F7). ?beleg= öffnet einen Beleg (Bon-QR-Scan),
// ?retoure=1 kommt von Umschalt+F7.
export default async function BelegeSeite({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet } = await kioskZugang("kassa");
  let daten;
  try {
    daten = await kioskDaten(session, {});
  } catch (err) {
    return <KassaFehler session={session} geraet={geraet} code={err?.code || "unavailable"} message={err?.message} />;
  }
  if (!daten.kontext?.kasse) return <KassaFehler session={session} geraet={geraet} code="ohne-kasse" />;
  const belege = await rufe(kassaClient(session), "belege_heute", { kasse: daten.kontext.kasse, limit: 60 }).catch(() => []);
  const auswahl = NAME.test(sp?.beleg || "") ? sp.beleg : null;
  return <BelegeKiosk kontext={daten.kontext} belege={belege} leitung={daten.leitung} faehig={daten.faehig} benutzer={{ name: session.name }} auswahl={auswahl} retoure={sp?.retoure === "1"} />;
}
