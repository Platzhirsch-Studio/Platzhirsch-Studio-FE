import { kioskZugang } from "../kiosk";
import { logistikClient } from "@/lib/backoffice/logistik/client";
import { packtischStart } from "@/lib/backoffice/logistik/daten";
import { PacktischStart } from "@/components/Backoffice/Logistik/Packtisch";
import Fehler from "@/components/Backoffice/Fehler";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const metadata = { title: "Packtisch" };
export const dynamic = "force-dynamic";

// Arbeitsplatz Packtisch (10-konzept-logistik § 6.1, Entscheidung Nr. 49): Scan identifiziert den Vorgang (JTL M1),
// Karten Packen · Abholung · Wareneingang. Daten über packtisch.offene (Mock: Dienst-Nachbildung).
export default async function PacktischPage() {
  const { session, geraet, benutzer } = await kioskZugang("packtisch");
  const packplatz = geraet?.name || "Packtisch 1";
  let daten = null;
  let fehler = null;
  try {
    daten = await packtischStart(logistikClient(session));
  } catch (err) {
    fehler = err;
  }
  if (fehler) {
    return (
      <main className="p-6">
        <Fehler code={istBackofficeError(fehler) ? fehler.code : "unavailable"} message={istBackofficeError(fehler) ? fehler.message : undefined} zurueckHref="/arbeitsplatz" />
      </main>
    );
  }
  return <PacktischStart daten={daten} geraet={geraet} benutzer={benutzer} packplatz={packplatz} />;
}
