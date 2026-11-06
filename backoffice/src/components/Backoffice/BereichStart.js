import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { bereich as bereichDaten } from "@/lib/backoffice/bereiche/index";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { doctypeSlug } from "@/lib/backoffice/format";
import { ZUTUN_BEREICHE, generischeQuellen } from "@/lib/backoffice/aufgaben";
import Shell from "./Shell/Shell";
import Seitenkopf from "./Seitenkopf";
import Kachel, { Bento } from "./Kachel";
import Knopf from "./Knopf";
import Leer from "./Leer";
import ZuTun from "./ZuTun/ZuTun";
import { PfeilKnopf } from "./Knopf";
import { anzeige, doctypeLabel, hilfetext } from "@/lib/backoffice/labels";
import { BEREICH_START, ZUTUN } from "./ZuTun/texte";

const ENDZUSTAND = /erledigt|abgeschlossen|storniert|archiv|bezahlt|zugestellt|verworfen|abgelehnt|geschlossen|inaktiv|ausgelaufen|versendet$/i;

/**
 * Startseite eines Bereichs (Server Component), bis der Fachbereich eine eigene liefert – im Lounge-Stil
 * (Team P0-5b, MASTER Q-B4): Seitenkopf mit großem Titel, oben „Zu tun“ (Quellen des Bereichs aus
 * lib/backoffice/aufgaben, sonst generisch aus den Daten: fällige eigene Aufgaben, Einträge im ersten
 * Ablaufschritt), darunter die Listen als schwebende Kacheln (ganze Kachel ist Link, Zahl offen leicht 34/400,
 * Kanban/Neu als Nebenaktionen). Beschreibungen nur, wenn nicht technisch (hilfetext).
 * Fachbereichs-Agenten ersetzen sie durch src/app/<bereich>/page.js und nutzen dieselben Bausteine.
 * @param {{slug:string, pfad?:string, sicht?:"alle"|"mir"|"team", sichtChips?:boolean}} props
 *   sichtChips: Filter-Chips „Alle · Für mich · Team“ – nur, wenn die Seite `?zutun=` als `sicht` durchreicht.
 */
export default async function BereichStart({ slug, pfad, sicht = "alle", sichtChips = false }) {
  const b = bereichDaten(slug);
  if (!b || b.slug === "zentrale") notFound();
  const session = await requireRecht(b.slug, "read", pfad || b.startseite);
  const client = backoffice(session);
  const kacheln = await Promise.all(
    b.doctypes.map(async (dt) => {
      try {
        const meta = await ladeMeta(client, dt);
        if (!darfDoc(session, meta, "read")) return null;
        const offen = meta.statusOptionen.length ? await client.count(dt, { filters: [["status", "not in", meta.statusOptionen.filter((s) => ENDZUSTAND.test(s))]] }) : null;
        const gesamt = await client.count(dt);
        return { dt, meta, gesamt, offen, kanban: b.kanban?.includes(dt) && meta.statusOptionen.length > 0, neu: darfDoc(session, meta, "create") && !meta.issingle && !meta.in_create };
      } catch {
        return { dt, meta: null, gesamt: null, offen: null };
      }
    })
  );
  const sichtbar = kacheln.filter((k) => k && k.meta);
  let aufgabenLesbar = false;
  try {
    aufgabenLesbar = darfDoc(session, await ladeMeta(client, "PH Aufgabe"), "read");
  } catch {
    aufgabenLesbar = false;
  }
  const listen = sichtbar.filter((k) => !k.meta.issingle).map((k) => ({ dt: k.dt, meta: k.meta, label: doctypeLabel(k.dt), href: `/d/${doctypeSlug(k.dt)}` }));
  const eigene = ZUTUN_BEREICHE[b.slug] || [];
  const quellen = eigene.length ? eigene.map((d) => ({ bereich: b.slug, ...d })) : generischeQuellen(b, listen, { texte: ZUTUN, aufgaben: aufgabenLesbar, anzeige });

  return (
    <Shell session={session}>
      <Seitenkopf titel={b.titel} untertitel={BEREICH_START.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: b.titel }]} />
      {sichtbar.length === 0 ? (
        <Leer titel={BEREICH_START.leerTitel} text={BEREICH_START.leerText} icon={b.icon} aktion={<Knopf href="/">{BEREICH_START.zurZentrale}</Knopf>} />
      ) : (
        <div className="flex min-w-0 flex-col gap-(--bo-bento-gap)">
          {quellen.length > 0 && <ZuTun quellen={quellen} session={session} client={client} sicht={sicht} sichtBasis={sichtChips ? b.startseite : undefined} />}
          <section aria-labelledby="bereich-listen" className="min-w-0">
            <div className="mb-4 mt-2 flex items-baseline justify-between gap-3 px-1">
              <h2 id="bereich-listen" className="bo-titel">
                {BEREICH_START.listen}
              </h2>
              <p className="text-[13px] text-bo-text-soft">{BEREICH_START.listenUnter}</p>
            </div>
            <Bento as="ul" data-testid="bereich-kacheln">
              {sichtbar.map((k) => {
                const href = `/d/${doctypeSlug(k.dt)}`;
                const beschreibung = hilfetext(k.meta.description);
                const zahl = k.offen ?? k.gesamt;
                return (
                  <Kachel
                    key={k.dt}
                    as="li"
                    lift
                    className="min-h-52 md:col-span-6 xl:col-span-4"
                    titel={
                      <Link href={href} className="rounded-sm after:absolute after:inset-0 after:rounded-[inherit] after:content-['']">
                        {doctypeLabel(k.dt)}
                      </Link>
                    }
                    unter={beschreibung ? <span className="line-clamp-2">{beschreibung}</span> : undefined}
                  >
                    <div className="mt-auto flex min-w-0 items-end justify-between gap-3">
                      <p className="min-w-0">
                        <span className="bo-zahl-gross block">{zahl ?? "–"}</span>
                        <span className="mt-1 block text-[13px] text-bo-text-soft">
                          {k.offen !== null && k.offen !== undefined ? `${BEREICH_START.offen} · ${BEREICH_START.vonGesamt(k.gesamt)}` : k.gesamt !== null ? BEREICH_START.gesamt : ""}
                        </span>
                      </p>
                      <PfeilKnopf nurOptik />
                    </div>
                    {(k.kanban || k.neu) && (
                      <p className="relative z-[1] mt-4 flex flex-wrap gap-2">
                        {k.kanban && (
                          <Knopf href={`${href}?ansicht=kanban`} size="s" variant="secondary" icon="Columns3">
                            {BEREICH_START.kanban}
                          </Knopf>
                        )}
                        {k.neu && (
                          <Knopf href={`${href}/neu`} size="s" variant="secondary" icon="Plus">
                            {BEREICH_START.neu}
                          </Knopf>
                        )}
                      </p>
                    )}
                  </Kachel>
                );
              })}
            </Bento>
          </section>
        </div>
      )}
    </Shell>
  );
}
