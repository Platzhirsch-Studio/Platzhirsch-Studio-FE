import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import WareneingangAssistent from "@/components/Backoffice/Sortiment/WareneingangAssistent";
import { erwarteteLieferungen, ladeFuerEingang, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { WARENEINGANG } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wareneingang buchen · Sortiment" };

export default async function WareneingangNeu({ searchParams }) {
  const sp = await searchParams;
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/wareneingang/neu", doctype: "PH Wareneingang", aktion: "create" });
  const [erwartet, l] = await Promise.all([erwarteteLieferungen(client, { tage: 30 }).catch(() => []), ladeFuerEingang(client, session, sp.bestellung ? String(sp.bestellung) : "")]);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={WARENEINGANG.neu}
        untertitel={l.bestellung ? `${l.bestellung.name} · ${l.bestellung.lieferant}` : WARENEINGANG.untertitel}
        krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: WARENEINGANG.titel, href: "/sortiment/wareneingang" }, { titel: WARENEINGANG.neu }]}
        zurueck={l.bestellung ? "/sortiment/wareneingang/neu" : "/sortiment/wareneingang"}
      />
      {l.grund ? <Fehler code="invalid" message={l.grund} zurueckHref="/sortiment/wareneingang/neu" /> : <WareneingangAssistent key={l.bestellung?.name || "suche"} erwartet={erwartet} bestellung={l.bestellung} bilder={l.bilder} />}
    </Shell>
  );
}
