import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import PreislisteNeu from "@/components/Backoffice/Sortiment/PreislisteNeu";
import { sortimentKontext, stammAuswahl } from "@/lib/backoffice/sortiment/daten";
import { faehigkeit } from "@/lib/backoffice/faehigkeiten";
import { SORTIMENT } from "@/lib/backoffice/sortiment/faehigkeiten";
import { PREISLISTEN } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preisliste einlesen · Sortiment" };

export default async function PreislisteNeuPage() {
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/preislisten/neu", doctype: "PH Preisliste Import", aktion: "create" });
  const [auswahl, basis] = await Promise.all([stammAuswahl(client), faehigkeit(session, "sortiment.preisbasis", { katalog: SORTIMENT, client }).catch(() => ({ an: false }))]);
  return (
    <Shell session={session}>
      <Seitenkopf titel="Preisliste einlesen" untertitel={`${PREISLISTEN.schritte.join(" · ")}`} krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: PREISLISTEN.titel, href: "/sortiment/preislisten" }, { titel: "Neu" }]} />
      <PreislisteNeu marken={auswahl.marken} lieferanten={auswahl.lieferanten} preisbasisVorhanden={!!basis?.an} />
    </Shell>
  );
}
