import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { logistikClient } from "@/lib/backoffice/logistik/client";
import { naechsteVorgaenge, packDaten } from "@/lib/backoffice/logistik/daten";
import { istLeitung } from "@/lib/backoffice/logistik/rechte";
import { PackAnsicht } from "@/components/Backoffice/Logistik/Packtisch";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const metadata = { title: "Packen" };
export const dynamic = "force-dynamic";

// Pack-Ansicht im Backoffice ohne Packtisch-Gerät (§ 4.0): gleiche Ansicht, Band „Kein Packtisch-Gerät – Druck über den Browser“.
export default async function PackenBackoffice({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireRecht("logistik", "write", `/logistik/packen/${roh}`);
  const client = logistikClient(session);
  const [daten, n] = await Promise.all([packDaten(client, name, { session }), naechsteVorgaenge(client, name)]).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  return <PackAnsicht daten={daten} naechster={n.naechster} naechsterPaket={n.paket} naechsterSperrgut={n.sperrgut} geraet={null} benutzer={{ name: session.name }} leitung={istLeitung(session)} ohneGeraet />;
}
