// Fehlerkatalog (T9, 10-konzept-service §2.11): Seed aus install.py + „-99 Sonstiges“ je Bereich; Leitung ändert.
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { ladeKatalog, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import KatalogBaum from "@/components/Backoffice/Service/KatalogBaum";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fehlerkatalog · Service" };

export default async function Fehlerkatalog({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("service", "read", "/service/fehlerkatalog");
  const client = serviceClient(session);
  const s = sicht(session);
  const [k, faelle] = await Promise.all([ladeKatalog(client, { inaktive: sp.inaktive === "1" }), client.getList("PH Servicefall", { fields: ["fehlercode"], filters: [["fehlercode", "!=", ""]], limit: 5000 }).catch(() => [])]);
  const jeCode = {};
  for (const f of faelle) jeCode[f.fehlercode] = (jeCode[f.fehlercode] || 0) + 1;
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.katalog.titel} krumen={[{ titel: "Service", href: "/service" }, { titel: T.katalog.titel }]} kennzahlen={[{ wert: k.bereiche.length, text: "Bereiche" }, { wert: k.codes.length, text: "Codes" }]} untertitel={s.leitung ? "Codes anklicken, um Wissen und Standardlösung zu pflegen." : T.katalog.nurLeitung} />
      <KatalogBaum bereiche={k.bereiche} codes={k.codes} leitung={s.leitung} faelleJeCode={jeCode} />
    </Shell>
  );
}
