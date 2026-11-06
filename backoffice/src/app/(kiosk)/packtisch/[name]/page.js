import { notFound } from "next/navigation";
import { kioskZugang } from "../../kiosk";
import { logistikClient } from "@/lib/backoffice/logistik/client";
import { naechsteVorgaenge, packDaten } from "@/lib/backoffice/logistik/daten";
import { istLeitung } from "@/lib/backoffice/logistik/rechte";
import { PackAnsicht } from "@/components/Backoffice/Logistik/Packtisch";
import Fehler from "@/components/Backoffice/Fehler";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const metadata = { title: "Packen" };
export const dynamic = "force-dynamic";

// Pack-Ansicht / Abholkarte (10-konzept-logistik § 6.2/§ 6.3; Lounge-Entwurf „Packtisch“).
export default async function PackenPage({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const { session, geraet, benutzer } = await kioskZugang("packtisch");
  const client = logistikClient(session);
  const packplatz = geraet?.name || "Packtisch 1";
  let daten = null;
  let n = null;
  let fehler = null;
  try {
    [daten, n] = await Promise.all([packDaten(client, name, { packplatz, session }), naechsteVorgaenge(client, name)]);
  } catch (err) {
    fehler = err;
  }
  if (fehler && istBackofficeError(fehler) && fehler.code === "not_found") notFound();
  if (fehler) {
    return (
      <main className="p-6">
        <Fehler code={istBackofficeError(fehler) ? fehler.code : "unavailable"} message={istBackofficeError(fehler) ? fehler.message : undefined} zurueckHref="/packtisch" />
      </main>
    );
  }
  return <PackAnsicht daten={daten} naechster={n.naechster} naechsterPaket={n.paket} naechsterSperrgut={n.sperrgut} geraet={geraet} benutzer={benutzer} leitung={istLeitung(session)} />;
}
