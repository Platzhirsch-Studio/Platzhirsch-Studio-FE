// Einstellungen Service (T9, 10-konzept-service §2.13) – ändern darf die Leitung, alle anderen lesen.
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { ladeEinstellungen, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import EinstellungenFormular from "@/components/Backoffice/Service/EinstellungenFormular";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Service" };

const VORLAGEN = [["Eingang", "vorlage_eingang"], ["Termin", "vorlage_termin"], ["Abschluss", "vorlage_abschluss"], ["Wartung", "vorlage_wartung"], ["Regress", "vorlage_regress"], ["Ablehnung", "vorlage_ablehnung"], ["Freie Nachricht", "vorlage_frei"], ["Servicebericht", "vorlage_servicebericht"]];

export default async function Einstellungen() {
  const session = await requireRecht("service", "read", "/service/einstellungen");
  const client = serviceClient(session);
  const s = sicht(session);
  const w = await ladeEinstellungen(client);
  const werte = Object.fromEntries(Object.entries(w).filter(([k]) => !["doctype", "name", "owner", "creation", "modified", "modified_by", "docstatus", "idx", "rechtshinweis"].includes(k)));
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.einstellungen.titel} untertitel={T.einstellungen.unter} krumen={[{ titel: "Service", href: "/service" }, { titel: T.einstellungen.titel }]} />
      <EinstellungenFormular werte={werte} leitung={s.leitung} vorlagen={VORLAGEN.map(([t, f]) => [t, w[f] || ""])} />
    </Shell>
  );
}
