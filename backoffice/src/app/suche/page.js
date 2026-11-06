import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { suche } from "@/lib/backoffice/suche/index";
import { SUCHE as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import { Icon } from "@/components/Backoffice/icons";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Suche · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

/** /suche?q= (10-konzept-zentrale § 3.4): gleiche Quelle wie die Palette, funktioniert ohne JavaScript (GET-Formular). */
export default async function Suche({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireSession("/suche");
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  let gruppen = [];
  let fehler = false;
  if (q) {
    try {
      gruppen = (await suche(backoffice(session), session, q)).gruppen || [];
    } catch {
      fehler = true;
    }
  }
  const treffer = gruppen.reduce((n, g) => n + g.eintraege.length, 0);
  return (
    <Shell session={session}>
      <Seitenkopf titel={q ? T.titelMit(q) : T.titel} untertitel={q && !fehler ? T.treffer(treffer) : undefined} krumen={[{ titel: "Zentrale", href: "/" }, { titel: T.titel }]} />
      <form action="/suche" method="get" role="search" className="mb-6 flex max-w-2xl gap-2">
        <label className="bo-suche h-12 flex-1">
          <Icon name="Search" className="size-4 shrink-0" />
          <input type="search" name="q" defaultValue={q} placeholder={T.feld} aria-label={T.feld} />
        </label>
        <button type="submit" className="bo-knopf bo-knopf--primary h-12 px-5 text-[15px] font-semibold">
          {T.suchen}
        </button>
      </form>
      {!q ? (
        <Leer titel={T.start} text={T.startText} icon="Search" />
      ) : fehler ? (
        <Fehler code="unavailable" titel={T.fehler} />
      ) : treffer === 0 ? (
        <Leer art="gefiltert" titel={T.leer(q)} text={T.leerText} />
      ) : (
        <div className="flex flex-col gap-6" data-testid="suche-ergebnisse">
          {gruppen.map((g) => (
            <Kachel key={g.titel} titel={g.titel}>
              <ul className="zb-liste">
                {g.eintraege.map((e) => (
                  <li key={`${e.href}-${e.titel}`}>
                    <Link href={e.href} className="zb-liste__i">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium">{e.titel}</span>
                        {e.hinweis && <span className="zb-leise block truncate">{e.hinweis}</span>}
                      </span>
                      <Icon name="ChevronRight" className="size-4 text-bo-text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Kachel>
          ))}
        </div>
      )}
    </Shell>
  );
}
