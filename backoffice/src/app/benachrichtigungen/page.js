import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { ladeFreigaben } from "@/lib/backoffice/freigaben/index";
import { GLOCKE_TABS, gruppiereNachTag, ladeGlocke } from "@/lib/backoffice/benachrichtigungen";
import { relativ } from "@/lib/backoffice/format";
import { BENACHRICHTIGUNGEN as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { Icon } from "@/components/Backoffice/icons";
import FreigabeEintrag from "@/components/Backoffice/Shell/FreigabeEintrag";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Benachrichtigungen · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const SYMBOL = { freigabe: "BadgeCheck", aufgabe: "CheckSquare", mitteilung: "Bell" };

/** /benachrichtigungen (10-konzept-zentrale § 3.5.3): Einträge der Glocke nach Tag gruppiert; Freigaben über FreigabeEintrag. */
export default async function Benachrichtigungen({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireSession("/benachrichtigungen");
  const client = backoffice(session);
  const freigaben = await ladeFreigaben(session, client).catch(() => []);
  const glocke = await ladeGlocke(client, session, { freigaben, limit: 50 }).catch(() => ({ tabs: { "fuer-mich": [], team: [], system: [] } }));
  const reiter = GLOCKE_TABS.includes(sp.reiter) ? sp.reiter : "fuer-mich";
  const eintraege = (glocke.tabs[reiter] || []).map((e) => (e.art === "aufgabe" ? { ...e, href: String(e.href || "").replace("/d/ph-aufgabe/", "/aufgaben/") } : e));
  const gruppen = gruppiereNachTag(eintraege);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.titel}
        untertitel={T.unter}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: T.titel }]}
        unternav={<Segment label={T.titel} aktiv={reiter} optionen={GLOCKE_TABS.map((r) => ({ wert: r, titel: T.reiter[r], anzahl: (glocke.tabs[r] || []).filter((e) => !e.gelesen).length || undefined, href: `/benachrichtigungen?reiter=${r}` }))} />}
      />
      {eintraege.length === 0 ? (
        <Leer art="erledigt" titel={T.leer[reiter]} />
      ) : (
        <div className="flex flex-col gap-6" data-testid="benachrichtigungen">
          {gruppen.map((g) => (
            <Kachel key={g.schluessel} titel={T.gruppen[g.schluessel] || g.schluessel}>
              <ul className="flex flex-col gap-3">
                {g.eintraege.map((e) => (
                  <li key={e.id}>
                    {e.art === "freigabe" ? (
                      <FreigabeEintrag eintrag={e} />
                    ) : (
                      <Link href={e.href || "/"} className="zb-liste__i !grid-cols-[36px_minmax(0,1fr)_auto]">
                        <span className="inline-grid size-9 place-items-center rounded-full bg-bo-surface-2">
                          <Icon name={SYMBOL[e.art] || "Bell"} className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={e.gelesen ? "block truncate text-[15px]" : "block truncate text-[15px] font-semibold"}>{e.titel}</span>
                          <span className="zb-leise block truncate">{e.hinweis}</span>
                          {!e.gelesen && <span className="sr-only">{T.ungelesen}</span>}
                        </span>
                        <time className="zb-leise whitespace-nowrap" dateTime={String(e.zeit || "")} suppressHydrationWarning>
                          {e.zeit ? relativ(e.zeit) : ""}
                        </time>
                      </Link>
                    )}
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
