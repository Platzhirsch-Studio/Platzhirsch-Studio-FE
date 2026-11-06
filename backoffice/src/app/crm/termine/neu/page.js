import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import { NeuerTerminKnopf } from "@/components/Backoffice/Crm/Kopfknoepfe";
import { beraterListe, personName, sicher } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termin anlegen · CRM" };

// Direktaufruf des Assistenten A1 (§ 5.5): öffnet den Dialog sofort; ?anfrage= / ?kontakt= füllen vor.
export default async function TerminNeu({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/termine/neu");
  const client = backoffice(session);
  await requireDocRecht(await ladeMeta(client, "PH Termin"), "create", "/crm/termine/neu");
  const [berater, anfrage, kontakt] = await Promise.all([
    beraterListe(client),
    sp?.anfrage ? sicher(() => client.getDoc("PH Anfrage", String(sp.anfrage)), null) : null,
    sp?.kontakt ? sicher(() => client.getDoc("PH Kontakt", String(sp.kontakt)), null) : null,
  ]);
  return (
    <Shell session={session}>
      <Seitenkopf krumen={[{ titel: T.seiten.termine, href: "/crm/termine" }, { titel: T.a1.titel }]} titel={T.a1.titel} untertitel="Kunde, Art und freie Zeit auf einem Bildschirm." />
      <NeuerTerminKnopf autoOffen berater={berater} ich={session.user} titel={T.a1.titel}
        anfrage={anfrage ? { name: anfrage.name, titel: personName(anfrage), email: anfrage.email, modus: anfrage.ort_der_beratung, zugewiesen_an: anfrage.zugewiesen_an, thema: anfrage.projektart, wunschzeiten: anfrage.wunschzeiten } : undefined}
        kontakt={kontakt ? { name: kontakt.name, titel: kontakt.titel, email: kontakt.email } : undefined} />
    </Shell>
  );
}
