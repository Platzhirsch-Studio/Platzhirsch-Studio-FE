import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import BestellFormular from "@/components/Backoffice/Sortiment/BestellFormular";
import { sortimentKontext, stammAuswahl } from "@/lib/backoffice/sortiment/daten";
import { BESTELLUNGEN } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Neue Herstellerbestellung · Sortiment" };

export default async function BestellungNeu({ searchParams }) {
  const sp = await searchParams;
  const { session, client, leitung } = await sortimentKontext({ pfad: "/sortiment/bestellungen/neu", doctype: "PH Herstellerbestellung", aktion: "create" });
  const [auswahl, produkte] = await Promise.all([stammAuswahl(client), client.getList("PH Produkt", { fields: ["name", "titel", "marke", "hersteller_artikelnr", "bild_hauptbild"], filters: [["status", "!=", "Ausgelaufen"]], orderBy: "titel asc", limit: 500 })]);
  return (
    <Shell session={session}>
      <Seitenkopf titel="Neue Herstellerbestellung" untertitel="Entwurf anlegen – gesendet wird in der Bestellakte." krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: BESTELLUNGEN.kurz, href: "/sortiment/bestellungen" }, { titel: "Neu" }]} />
      <BestellFormular lieferanten={auswahl.lieferanten.filter((l) => l.status !== "Inaktiv")} produkte={produkte} leitung={leitung} vorbelegt={sp.lieferant ? String(sp.lieferant) : ""} />
    </Shell>
  );
}
