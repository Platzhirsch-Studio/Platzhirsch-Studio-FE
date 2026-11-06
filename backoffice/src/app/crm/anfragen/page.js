import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import { Icon } from "@/components/Backoffice/icons";
import AnfragenListe from "@/components/Backoffice/Crm/AnfragenListe";
import AnfragenKanban from "@/components/Backoffice/Crm/AnfragenKanban";
import { NeueAnfrageKnopf } from "@/components/Backoffice/Crm/Kopfknoepfe";
import { beraterListe, istLeitung, ladeAnfragen } from "@/lib/backoffice/crm/daten";
import { istMock } from "@/lib/backoffice/crm/backend";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { statusAnzeige } from "@/lib/backoffice/crm/status";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anfragen · CRM" };

const SICHTEN = ["neu", "meine", "offen", "gewonnen", "verloren"];

export default async function AnfragenSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/anfragen");
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Anfrage");
  await requireDocRecht(meta, "read", "/crm/anfragen");
  const leitung = istLeitung(session);
  const sicht = SICHTEN.includes(sp?.sicht) ? sp.sicht : "offen";
  const ansicht = sp?.ansicht === "kanban" ? "kanban" : "liste";
  const q = typeof sp?.q === "string" ? sp.q.slice(0, 80) : "";
  const art = typeof sp?.art === "string" ? sp.art : "";

  let daten = null;
  let fehler = null;
  try {
    daten = await ladeAnfragen(session, client, { sicht: ansicht === "kanban" ? "alle" : sicht, q, art, seite: sp?.seite, groesse: ansicht === "kanban" ? 100 : 25 });
  } catch (err) {
    fehler = istBackofficeError(err) ? { code: err.code, message: err.message } : { code: "unavailable" };
  }
  const berater = await beraterListe(client);
  const query = new URLSearchParams(Object.entries({ sicht: sicht === "offen" ? "" : sicht, q, art, ansicht: ansicht === "liste" ? "" : ansicht }).filter(([, v]) => v)).toString();
  const z = daten?.zaehler || {};
  const sichtHref = (s) => {
    const p = new URLSearchParams(Object.entries({ sicht: s === "offen" ? "" : s, q, art }).filter(([, v]) => v));
    return `/crm/anfragen${p.toString() ? `?${p}` : ""}`;
  };
  const ansichtHref = (a) => {
    const p = new URLSearchParams(Object.entries({ sicht: sicht === "offen" ? "" : sicht, q, art, ansicht: a === "liste" ? "" : a }).filter(([, v]) => v));
    return `/crm/anfragen${p.toString() ? `?${p}` : ""}`;
  };

  const kanbanSpalten = ansicht === "kanban" && daten
    ? ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot", "Gewonnen"].map((s) => {
        const a = statusAnzeige("anfrage", s);
        return { status: s, titel: a.text, ton: a.ton, karten: daten.liste.filter((x) => x.abgeleitet.status === s) };
      })
    : [];

  return (
    <Shell session={session} breit>
      <Seitenkopf
        ueber={T.ueber}
        titel={T.seiten.anfragen}
        kennzahlen={[
          { wert: String(z.neu ?? "–"), text: T.anfragen.ansichten.neu, testid: "crm-kz-neu" },
          { wert: String(z.offen ?? "–"), text: T.anfragen.ansichten.offen },
        ]}
        aktionen={<NeueAnfrageKnopf />}
      />
      <Erstbesuch text={T.anfragen.erstbesuch} route="/crm/anfragen" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {ansicht === "liste" && (
          <Segment
            label="Ansicht der Anfragen"
            aktiv={sicht}
            optionen={[
              { wert: "neu", titel: T.anfragen.ansichten.neu, href: sichtHref("neu"), anzahl: z.neu, testid: "crm-sicht-neu" },
              { wert: "meine", titel: T.anfragen.ansichten.meine, href: sichtHref("meine"), anzahl: z.meine },
              { wert: "offen", titel: T.anfragen.ansichten.offen, href: sichtHref("offen"), anzahl: z.offen },
              { wert: "gewonnen", titel: T.anfragen.ansichten.gewonnen, href: sichtHref("gewonnen"), anzahl: z.gewonnen },
              ...(leitung ? [{ wert: "verloren", titel: T.anfragen.ansichten.verloren, href: sichtHref("verloren") }] : []),
            ]}
          />
        )}
        <form action="/crm/anfragen" method="get" role="search" className="ml-auto flex min-w-0 items-center gap-2">
          {sicht !== "offen" && <input type="hidden" name="sicht" value={sicht} />}
          {ansicht === "kanban" && <input type="hidden" name="ansicht" value="kanban" />}
          <label className="bo-suche flex h-10 w-[280px] max-w-full items-center gap-2 px-4">
            <Icon name="Search" className="size-4 text-bo-text-soft" />
            <span className="sr-only">Suchen</span>
            <input name="q" defaultValue={q} placeholder={T.anfragen.suche} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
          </label>
          <select name="art" defaultValue={art} aria-label="Art" className="bo-suche h-10 px-4 text-[14px]">
            <option value="">Alle Arten</option>
            {Object.entries(T.art).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </form>
        <Segment label="Darstellung" aktiv={ansicht} groesse="s" optionen={[{ wert: "liste", titel: T.anfragen.liste, href: ansichtHref("liste"), icon: "Rows3" }, { wert: "kanban", titel: T.anfragen.kanban, href: ansichtHref("kanban"), icon: "Columns3" }]} />
      </div>
      {fehler ? (
        <Fehler code={fehler.code} message={fehler.message} />
      ) : ansicht === "kanban" ? (
        <AnfragenKanban spalten={kanbanSpalten} berater={berater} ich={session.user} jetzt={new Date().toISOString()} />
      ) : (
        <AnfragenListe key={query} liste={daten.liste} gesamt={daten.gesamt} seite={daten.seite} groesse={daten.groesse} basisQuery={query} berater={berater} ich={session.user} mock={istMock(client)} filterAktiv={!!(q || art)} sicht={sicht} jetzt={new Date().toISOString()} />
      )}
    </Shell>
  );
}
