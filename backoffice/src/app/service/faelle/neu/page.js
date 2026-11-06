// S1-Vollständig (10-konzept-service §2.3.2): vier Schritte mit Gewährleistungs-Vorschau.
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { ladeEinstellungen, ladeKatalog, serviceClient } from "@/lib/backoffice/service/daten";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import MeldenVollstaendig from "@/components/Backoffice/Service/MeldenVollstaendig";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servicefall melden · Service" };

export default async function FallNeu() {
  const session = await requireRecht("service", "create", "/service/faelle/neu");
  const client = serviceClient(session);
  const [katalog, einst] = await Promise.all([ladeKatalog(client), ladeEinstellungen(client)]);
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.melden.titel} krumen={[{ titel: "Service", href: "/service" }, { titel: "Servicefälle", href: "/service/faelle" }, { titel: T.melden.titel }]} zurueck="/service/faelle" />
      <MeldenVollstaendig katalog={katalog} einst={{ standard_prioritaet: einst.standard_prioritaet, gewaehrleistung_monate: Number(einst.gewaehrleistung_monate) || 24 }} />
    </Shell>
  );
}
