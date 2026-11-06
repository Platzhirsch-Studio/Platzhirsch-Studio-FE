import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Fehler from "@/components/Backoffice/Fehler";
import { AkteGeruest, AkteKopf, Vorgangsleiste } from "@/components/Backoffice/Akte";
import { CrmStatus } from "@/components/Backoffice/Crm/Teile";
import Protokoll from "@/components/Backoffice/Crm/Protokoll";
import { beraterListe, istLeitung, ladeGespraech } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { kurzDatum, vorgangsSchritte } from "@/lib/backoffice/crm/vorgang";
import { hrefFuer } from "@/lib/backoffice/crm/zuErledigen";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Gespräche · CRM` };
}

export default async function GespraechAkte({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/crm/gespraeche/${roh}`);
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Beratungsgespraech");
  await requireDocRecht(meta, "read", `/crm/gespraeche/${roh}`);
  let d;
  try {
    d = await ladeGespraech(session, client, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return <Shell session={session}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} zurueckHref="/crm/gespraeche" /></Shell>;
  }
  const { doc: g, kontakt, termin, anfrage, angebote } = d;
  const berater = await beraterListe(client);
  const schritte = vorgangsSchritte({ anfrage, termine: termin ? [termin] : [], gespraeche: [g], angebote }, { href: hrefFuer });
  const titel = `${kurzDatum(g.datum)} · ${kontakt?.titel || g.titel || g.name}`;
  return (
    <Shell session={session}>
      <AkteGeruest
        testid="crm-gespraech-akte"
        vorgangOben
        kopf={<AkteKopf zurueck={{ href: "/crm/gespraeche", titel: T.seiten.gespraeche }} krumen={[{ titel: T.seiten.gespraeche, href: "/crm/gespraeche" }, { titel: kontakt?.titel || g.name }]} titel={titel} nummer={[T.modus[g.ort], g.name].filter(Boolean).join(" · ")} status={<span data-intern=""><CrmStatus objekt="gespraech" wert={g.status} /></span>} />}
        vorgang={<div data-intern=""><Vorgangsleiste titel="Vorgang" schritte={schritte} kompakt mitText /></div>}
      >
        <Protokoll doc={g} kontaktTitel={kontakt?.titel} berater={berater} leitung={istLeitung(session)} nurLesen={!darfDoc(session, meta, "write")} />
      </AkteGeruest>
    </Shell>
  );
}
