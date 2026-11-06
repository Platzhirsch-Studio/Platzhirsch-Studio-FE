import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { listenFelder, listenSpalten } from "@/lib/backoffice/frappe/meta";
import { listenAbfrage } from "@/lib/backoffice/listen";
import { darf, darfDoc, darfGeraeteVerwalten, istAdmin } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { aktivitaet } from "@/lib/backoffice/dashboard";
import { BEREICHE } from "@/lib/backoffice/bereiche/index";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import { integration } from "@/lib/backoffice/zentrale/daten";
import { PROTOKOLL as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import Avatar from "@/components/Backoffice/Avatar";
import DataTable from "@/components/Backoffice/DataTable/DataTable";
import Filterleiste from "@/components/Backoffice/DataTable/Filterleiste";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Protokoll · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const TON = { OK: "gruen", Fehler: "rot", Abgelehnt: "rot", Wiederholt: "grau", "Rate-Limit": "orange" };

/** Protokoll (10-konzept-zentrale § 3.8): Reiter nach Rechten. Aktivität ohne Person-Filter (Q-A12), API nur lesend. */
export default async function Protokoll({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireSession("/protokoll");
  const client = backoffice(session);
  const leitung = darfGeraeteVerwalten(session) || darf(session, "zentrale", "write");
  const metaApi = await ladeMeta(client, "PH API Protokoll").catch(() => null);
  const api = metaApi && darfDoc(session, metaApi, "read");
  const admin = istAdmin(session);
  const reiter = [leitung && "aktivitaet", api && "api", admin && "fehler", admin && "anmeldungen"].filter(Boolean);
  if (!reiter.length) {
    return (
      <Shell session={session}>
        <Seitenkopf titel={T.titel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: T.titel }]} />
        <Leer art="recht" />
      </Shell>
    );
  }
  const tab = reiter.includes(sp.tab) ? sp.tab : reiter[0];
  const unternav = <Segment label={T.titel} aktiv={tab} optionen={reiter.map((r) => ({ wert: r, titel: T.reiter[r], href: `/protokoll?tab=${r}`, testid: `protokoll-${r}` }))} />;

  let inhalt;
  if (tab === "aktivitaet") {
    const bereich = typeof sp.bereich === "string" ? sp.bereich : "";
    let zeilen = [];
    let fehler = null;
    try {
      zeilen = await aktivitaet(client, session, 100);
    } catch (err) {
      fehler = istBackofficeError(err) ? err.code : "unavailable";
    }
    const gefiltert = bereich ? zeilen.filter((z) => z.bereich === bereich) : zeilen;
    const vorhanden = [...new Set(zeilen.map((z) => z.bereich).filter(Boolean))];
    inhalt = fehler ? (
      <Fehler code={fehler} />
    ) : (
      <>
        <div className="zb-chips !mt-0" role="group" aria-label="Bereich">
          <Link href="/protokoll?tab=aktivitaet" className="zb-chip" data-ton={!bereich ? "sand" : undefined} aria-pressed={!bereich}>{T.alleBereiche}</Link>
          {vorhanden.map((b) => (
            <Link key={b} href={`/protokoll?tab=aktivitaet&bereich=${b}`} className="zb-chip" data-ton={bereich === b ? "sand" : undefined} aria-pressed={bereich === b}>
              {BEREICHE.find((x) => x.slug === b)?.titel || b}
            </Link>
          ))}
        </div>
        <p className="zb-leise mb-4">{T.hinweis100} {T.ohnePerson}</p>
        <Kachel testid="protokoll-aktivitaet">
          {gefiltert.length === 0 ? (
            <p className="zb-leise">{T.leerAktivitaet}</p>
          ) : (
            <ol className="zb-akt">
              {gefiltert.map((e, i) => (
                <li key={`${e.doctype}-${e.name}-${i}`} className="zb-akt__i">
                  <Avatar name={String(e.vonName || e.von || "").replace(/\s*\(.*\)\s*$/, "")} groesse={36} />
                  <div className="min-w-0">
                    <p className="zb-akt__txt">
                      <b>{String(e.vonName || e.von || "").replace(/\s*\(.*\)\s*$/, "")}</b> · {anzeige(e.zusammenfassung || "Geändert")} · <Link href={e.href}>{e.titel}</Link>
                    </p>
                    <p className="zb-leise">
                      {doctypeLabel(e.doctype)} · <time dateTime={String(e.modified || "")} title={datumZeit(e.modified)} suppressHydrationWarning>{relativ(e.modified)}</time>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Kachel>
      </>
    );
  } else if (tab === "api") {
    const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([k, v]) => v && k !== "tab"));
    const abfrage = listenAbfrage(params, metaApi, { standardSort: "zeitpunkt desc" });
    const [d, integ] = await Promise.all([
      Promise.all([
        client.getList("PH API Protokoll", { fields: listenFelder(metaApi), filters: abfrage.filters, orFilters: abfrage.orFilters, orderBy: abfrage.orderBy, limit: abfrage.limit, start: abfrage.start }),
        client.count("PH API Protokoll", { filters: abfrage.filters, orFilters: abfrage.orFilters }),
      ]).then(([zeilen, gesamt]) => ({ zeilen, gesamt })).catch((err) => ({ fehler: istBackofficeError(err) ? err.code : "unavailable" })),
      integration(client, session),
    ]);
    inhalt = (
      <>
        {integ.status === "ok" && (
          <dl className="zb-def zb-def--3 mb-6" data-testid="protokoll-api-kopf">
            <div><dt>{T.aufrufe24}</dt><dd className="zb-gross">{integ.gesamt}</dd></div>
            <div><dt>{T.fehler24}</dt><dd className="zb-gross">{integ.fehler}</dd></div>
            <div><dt>{T.rate24}</dt><dd className="zb-gross">{integ.rate}</dd></div>
          </dl>
        )}
        <Filterleiste basis="/protokoll" params={{ ...params, tab: "api" }} statusWerte={metaApi.statusOptionen} statusTon={TON} datumsLabel="Zeitpunkt" />
        {d.fehler ? (
          <Fehler code={d.fehler} />
        ) : (
          <DataTable doctype="PH API Protokoll" spalten={listenSpalten(metaApi, 8)} zeilen={d.zeilen} gesamt={d.gesamt} seite={abfrage.seite} groesse={abfrage.groesse} sortFeld={abfrage.sortFeld} richtung={abfrage.richtung} basis="/protokoll" params={{ ...params, tab: "api" }} zeilenBasis="/d/ph-api-protokoll" statusTon={TON} />
        )}
      </>
    );
  } else {
    inhalt = (
      <Kachel titel={T.reiter[tab]}>
        <p className="zb-leise">{tab === "fehler" ? T.fehlerFehlt : T.anmeldungenFehlt}</p>
      </Kachel>
    );
  }

  return (
    <Shell session={session} breit>
      <Seitenkopf titel={T.titel} untertitel={T.unter} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Verwaltung", href: "/verwaltung" }, { titel: T.titel }]} unternav={unternav} />
      {inhalt}
    </Shell>
  );
}
