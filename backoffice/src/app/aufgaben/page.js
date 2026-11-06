import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { tagIso } from "@/lib/backoffice/zentrale/fristen";
import { aufgabenListe, darfTeamSicht, namenVon } from "@/lib/backoffice/zentrale/daten";
import { AUFGABE_STATUS, OFFEN, STATUS_TON, filtere } from "@/lib/backoffice/zentrale/aufgaben";
import { AUFGABEN } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import Kanban from "@/components/Backoffice/Kanban/Kanban";
import { Icon } from "@/components/Backoffice/icons";
import AufgabenListe, { Schnellanlage } from "@/components/Backoffice/Zentrale/AufgabenListe";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Aufgaben · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const FRISTEN = [
  { wert: "ueberfaellig", titel: AUFGABEN.ueberfaellig },
  { wert: "heute", titel: AUFGABEN.heute },
  { wert: "woche", titel: AUFGABEN.woche },
];

function url(p, aenderung) {
  const q = new URLSearchParams();
  const n = { ...p, ...aenderung };
  for (const [k, v] of Object.entries(n)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/aufgaben?${s}` : "/aufgaben";
}

/** Aufgaben (10-konzept-zentrale § 3.6): PH Aufgabe + ToDo, Sicht Meine/Team/Alle, Liste oder Karten. */
export default async function Aufgaben({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireSession("/aufgaben");
  const client = backoffice(session);
  const heute = tagIso();
  const team = darfTeamSicht(session);
  const sicht = team && ["team", "alle"].includes(sp.sicht) ? sp.sicht : "meine";
  const ansicht = sp.ansicht === "karten" ? "karten" : "liste";
  const status = typeof sp.status === "string" && sp.status ? sp.status.split(",").filter((s) => AUFGABE_STATUS.includes(s)) : OFFEN;
  const frist = FRISTEN.some((f) => f.wert === sp.frist) ? sp.frist : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const p = { sicht: sicht === "meine" ? "" : sicht, ansicht: ansicht === "liste" ? "" : ansicht, status: sp.status || "", frist, q };

  const daten = await aufgabenListe(client, session, heute, { sicht });
  const alle = daten.zeilen || [];
  const gefiltert = filtere(alle, { status: ansicht === "karten" ? [] : status, frist, q, heute });
  const namen = Object.fromEntries(await namenVon(client, alle.map((z) => z.zustaendig)));
  const personen = daten.darfAnlegen ? Object.entries(namen).map(([user, name]) => ({ user, name })) : [];
  const anzahl = (s) => alle.filter((z) => z.status === s).length;
  const gefiltertAktiv = !!(frist || q || sp.status);

  const statusChip = (s) => {
    const an = status.includes(s);
    const neu = an ? status.filter((x) => x !== s) : [...status, s];
    return (
      <Link key={s} href={url(p, { status: neu.join(",") || "leer" })} className="zb-chip" data-ton={an ? "sand" : undefined} aria-pressed={an} data-testid="aufgaben-status-chip">
        <span className="zb-chip__punkt" aria-hidden="true" />
        {AUFGABEN.spalten[s]}
        <span className="tabular-nums text-bo-text-soft">{anzahl(s)}</span>
      </Link>
    );
  };

  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={AUFGABEN.titel}
        untertitel={AUFGABEN.unter}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: AUFGABEN.titel }]}
        kennzahlen={[
          { wert: alle.filter((z) => OFFEN.includes(z.status)).length, text: "Offen" },
          { wert: alle.filter((z) => OFFEN.includes(z.status) && z.faellig && z.faellig < heute).length, text: AUFGABEN.ueberfaellig },
        ]}
        aktionen={
          daten.darfAnlegen ? (
            <Link href={url(p, { neu: "1" })} className="bo-knopf bo-knopf--primary inline-flex h-(--bo-control-h-l) items-center gap-2 px-5 text-[15px] font-semibold" data-testid="aufgabe-neu">
              <Icon name="Plus" className="size-4" />
              {AUFGABEN.neu}
            </Link>
          ) : null
        }
        unternav={
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Segment
                label={AUFGABEN.sicht}
                aktiv={sicht}
                optionen={[
                  { wert: "meine", titel: AUFGABEN.sichtMeine, href: url(p, { sicht: "" }) },
                  ...(team ? [{ wert: "team", titel: AUFGABEN.sichtTeam, href: url(p, { sicht: "team" }) }, { wert: "alle", titel: AUFGABEN.sichtAlle, href: url(p, { sicht: "alle" }) }] : []),
                ]}
                testid="aufgaben-sicht"
              />
              <Segment label={AUFGABEN.ansicht} aktiv={ansicht} optionen={[{ wert: "liste", titel: AUFGABEN.liste, icon: "Rows3", href: url(p, { ansicht: "" }) }, { wert: "karten", titel: AUFGABEN.karten, icon: "Columns3", href: url(p, { ansicht: "karten" }) }]} />
            </div>
            <form action="/aufgaben" method="get" role="search" className="min-w-0">
              {sicht !== "meine" && <input type="hidden" name="sicht" value={sicht} />}
              {ansicht !== "liste" && <input type="hidden" name="ansicht" value={ansicht} />}
              <label className="bo-suche w-full sm:w-72">
                <Icon name="Search" className="size-4 shrink-0" />
                <input type="search" name="q" defaultValue={q} placeholder={AUFGABEN.suche} aria-label={AUFGABEN.suche} />
              </label>
            </form>
          </>
        }
      />
      {sp.neu === "1" && daten.darfAnlegen && (
        <Kachel titel={AUFGABEN.neu} className="mb-6" testid="aufgabe-neu-kachel">
          <Schnellanlage heute={heute} personen={personen} autoFocus />
        </Kachel>
      )}
      {ansicht === "liste" && (
        <div className="zb-chips !mt-0" role="group" aria-label={AUFGABEN.status}>
          {AUFGABE_STATUS.map(statusChip)}
          <span className="mx-1 self-center text-bo-text-faint" aria-hidden="true">·</span>
          {FRISTEN.map((f) => (
            <Link key={f.wert} href={url(p, { frist: frist === f.wert ? "" : f.wert })} className="zb-chip" data-ton={frist === f.wert ? (f.wert === "ueberfaellig" ? "rot" : "sand") : undefined} aria-pressed={frist === f.wert}>
              <span className="zb-chip__punkt" aria-hidden="true" />
              {f.titel}
            </Link>
          ))}
        </div>
      )}
      {daten.status === "fehler" ? (
        <Fehler code="unavailable" />
      ) : ansicht === "karten" ? (
        <Kanban
          doctype="PH Aufgabe"
          spalten={["Offen", "In Arbeit", "Erledigt"].map((s) => ({
            status: s,
            karten: gefiltert.filter((z) => z.quelle === "aufgabe" && z.status === s && (s !== "Erledigt" || (z.modified || "") >= heute)).map((z) => ({ name: z.name, titel: z.titel, faellig: z.faellig, prioritaet: z.prioritaet, status: z.status })),
          }))}
          kartenFelder={["faellig", "prioritaet"]}
          titelFeld="titel"
          statusTon={STATUS_TON}
          hrefBasis="/aufgaben/"
        />
      ) : (
        <Kachel testid="aufgaben-kachel">
          {alle.length === 0 ? (
            <Leer groesse="karte" titel={AUFGABEN.leerNie} text={AUFGABEN.leerNieText} icon="CheckSquare" />
          ) : gefiltert.length === 0 && gefiltertAktiv ? (
            <Leer art="gefiltert" groesse="karte" titel={AUFGABEN.leerFilter} text={AUFGABEN.leerFilterText} zuruecksetzenHref={url({ sicht: p.sicht, ansicht: p.ansicht }, {})} />
          ) : (
            <AufgabenListe zeilen={gefiltert} heute={heute} darfAnlegen={false} mitZustaendig={sicht !== "meine"} namen={namen} leerText={AUFGABEN.leerErledigt} />
          )}
          {gefiltert.length > 0 && <p className="zb-leise mt-4">{AUFGABEN.zeilenAnzahl(gefiltert.length, alle.length)}</p>}
        </Kachel>
      )}
    </Shell>
  );
}
