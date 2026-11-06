import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { alleHilfeArtikel } from "@/lib/backoffice/hilfe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { Icon } from "@/components/Backoffice/icons";
import KuerzelKnopf from "@/components/Backoffice/Kuerzel/KuerzelKnopf";

export const metadata = { title: "Hilfe" };
export const dynamic = "force-dynamic";

const TEXTE = {
  titel: "Hilfe",
  unter: "Kurze Artikel zu jeder Seite. Auf jeder Seite öffnet „?“ den passenden Artikel.",
  krumen: [{ titel: "Zentrale", href: "/" }, { titel: "Hilfe" }],
  leerTitel: "Noch keine Hilfe-Artikel",
  leerText: "Die Artikel entstehen je Bereich mit dem Bau der Seiten. Bis dahin zeigt das Hilfe-Panel die Möglichkeiten und Kürzel der Seite.",
  artikel: (n) => (n === 1 ? "1 Artikel" : `${n} Artikel`),
};

// Übersicht aller Hilfe-Artikel (R-15: /hilfe/** gehört zur Zentrale). Inhalt: backoffice/hilfe/<bereich>/<seite>.md (Team Q5).
export default async function HilfeUebersicht() {
  const session = await requireSession("/hilfe");
  const gruppen = await alleHilfeArtikel();
  return (
    <Shell session={session}>
      <Seitenkopf titel={TEXTE.titel} untertitel={TEXTE.unter} krumen={TEXTE.krumen} aktionen={<KuerzelKnopf variant="secondary" />} />
      {gruppen.length === 0 ? (
        <Leer art="leer" titel={TEXTE.leerTitel} text={TEXTE.leerText} />
      ) : (
        <Bento>
          {gruppen.map((g) => (
            <Kachel key={g.bereich} className="md:col-span-6 xl:col-span-4" titel={g.titel} unter={TEXTE.artikel(g.artikel.length)}>
              <ul className="-mx-2 flex flex-col">
                {g.artikel.map((a) => (
                  <li key={a.schluessel}>
                    <Link href={a.href} className="bo-schale-zeile">
                      <span className="bo-schale-symbol" aria-hidden="true">
                        <Icon name="LifeBuoy" className="size-4" />
                      </span>
                      <span className="bo-schale-zeile__titel">{a.titel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Kachel>
          ))}
        </Bento>
      )}
    </Shell>
  );
}
