import { notFound, redirect } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, doctypeAusSegment, ladeMeta, ladeWorkflow } from "@/lib/backoffice/frappe";
import { listenFelder, listenSpalten, statusTon } from "@/lib/backoffice/frappe/meta";
import { listenAbfrage } from "@/lib/backoffice/listen";
import { darfDoc, istAdmin } from "@/lib/backoffice/auth/rechte";
import { bereich as bereichDaten, umleitungFuerD } from "@/lib/backoffice/bereiche/index";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Fehler from "@/components/Backoffice/Fehler";
import DataTable from "@/components/Backoffice/DataTable/DataTable";
import Filterleiste from "@/components/Backoffice/DataTable/Filterleiste";
import Kanban from "@/components/Backoffice/Kanban/Kanban";
import Segment from "@/components/Backoffice/Segment";
import { Icon } from "@/components/Backoffice/icons";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { doctype } = await params;
  const roh = decodeURIComponent(doctype).replace(/^ph[- ]/i, "").replace(/-/g, " ");
  return { title: anzeige(roh.charAt(0).toUpperCase() + roh.slice(1)) };
}

/** Workflow-Übergänge als Status→Status-Tabelle fürs Kanban. */
function uebergaengeAusWorkflow(wf) {
  if (!wf) return null;
  const out = {};
  for (const t of wf.transitions) {
    const von = wf.states.find((s) => s.state === t.state)?.updateValue;
    const nach = wf.states.find((s) => s.state === t.nextState)?.updateValue;
    if (!von || !nach) continue;
    (out[von] ||= []).push({ action: t.action, nachStatus: nach });
  }
  return out;
}

/** Daten der Liste/des Kanbans laden – Fehler werden als {fehler} zurückgegeben, nie geworfen. */
async function ladeDaten({ client, session, meta, doctype, ansicht, abfrage }) {
  try {
    if (ansicht === "kanban") {
      const wf = await ladeWorkflow(client, doctype);
      const kb = client.index?.kanban?.get?.(doctype);
      const spaltenWerte = kb?.columns?.length ? kb.columns.map((c) => c.name) : meta.statusOptionen;
      const board = await client.getKanban(doctype, { fields: listenFelder(meta), filters: abfrage.filters, limit: 300 });
      return { board: board.filter((s) => spaltenWerte.includes(s.status)), uebergaenge: uebergaengeAusWorkflow(wf) };
    }
    const [zeilen, gesamt, wf] = await Promise.all([
      client.getList(doctype, { fields: listenFelder(meta), filters: abfrage.filters, orFilters: abfrage.orFilters, orderBy: abfrage.orderBy, limit: abfrage.limit, start: abfrage.start }),
      client.count(doctype, { filters: abfrage.filters, orFilters: abfrage.orFilters }),
      ladeWorkflow(client, doctype),
    ]);
    const massen = [];
    if (!wf && meta.statusOptionen.length && darfDoc(session, meta, "write")) {
      for (const s of meta.statusOptionen.slice(0, 4)) massen.push({ id: `status-${s}`, titel: `→ ${anzeige(s)}`, feld: "status", wert: s });
    }
    return { zeilen, gesamt, massen };
  } catch (err) {
    return { fehler: { code: istBackofficeError(err) ? err.code : "unavailable", message: istBackofficeError(err) ? err.message : undefined } };
  }
}

/**
 * Generische Liste für jede DocType: /d/<slug>?seite=&sort=&r=&status=&von=&bis=&q=&ansicht=kanban
 * Fachbereiche bauen eigene Seiten unter /<bereich>/… und nutzen dieselben Bausteine.
 */
export default async function GenerischeListe({ params, searchParams }) {
  const { doctype: segment } = await params;
  const sp = await searchParams;
  const session = await requireSession(`/d/${segment}`);
  const client = backoffice(session);
  const doctype = await doctypeAusSegment(client, segment);
  if (!doctype) notFound();
  const meta = await ladeMeta(client, doctype);
  await requireDocRecht(meta, "read", `/d/${segment}`);
  if (meta.istable) notFound();
  // Q-B8: registrierte Bereichsseite gewinnt (307), Admins behalten mit ?generisch=1 die generische Liste.
  const umleitung = umleitungFuerD({ doctype, query: Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])), admin: istAdmin(session) });
  if (umleitung) redirect(umleitung);

  const basis = `/d/${meta.slug}`;
  const params1 = Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v));
  if (params1.f_zugewiesen_an === "ich") params1.f_zugewiesen_an = session.user;
  const abfrage = listenAbfrage(params1, meta);
  const spalten = listenSpalten(meta);
  const toene = Object.fromEntries(meta.statusOptionen.map((s) => [s, statusTon(meta, s, client.index)]));
  const b = bereichDaten(meta.bereich);
  const krumen = [{ titel: "Zentrale", href: "/" }, ...(b && b.slug !== "zentrale" ? [{ titel: b.titel, href: b.startseite }] : []), { titel: doctypeLabel(meta.name) }];
  const kanbanMoeglich = meta.statusOptionen.length > 0 && !meta.issingle;
  const ansicht = sp?.ansicht === "kanban" && kanbanMoeglich ? "kanban" : "liste";
  const daten = meta.issingle ? {} : await ladeDaten({ client, session, meta, doctype, ansicht, abfrage });
  const kartenFelder = spalten.filter((s) => !["name", meta.title_field, "status", "modified"].includes(s.fieldname)).slice(0, 3);

  return (
    <Shell session={session} breit>
      <Seitenkopf titel={doctypeLabel(meta.name)} hilfe={meta.description} krumen={krumen}>
        {kanbanMoeglich && (
          <Segment
            label="Ansicht"
            aktiv={ansicht}
            optionen={[
              { wert: "liste", titel: "Liste", href: basis, icon: "ScrollText" },
              { wert: "kanban", titel: "Kanban", href: `${basis}?ansicht=kanban`, icon: "SlidersHorizontal", testid: "ansicht-kanban" },
            ]}
          />
        )}
        {darfDoc(session, meta, "create") && !meta.issingle && !meta.in_create && (
          <Knopf href={`${basis}/neu`} variant="primary" data-testid="neu">
            <Icon name="Plus" className="size-4" /> Neu
          </Knopf>
        )}
      </Seitenkopf>
      {!meta.issingle && ansicht === "liste" && <Filterleiste basis={basis} params={params1} statusWerte={meta.statusOptionen} statusTon={toene} datumsLabel={meta.fields.find((f) => f.fieldname === abfrage.datumsfeld)?.label || "Zeitraum"} />}
      {meta.issingle && (
        <div className="rounded-bo border border-bo-line bg-bo-surface p-5 text-sm">
          {doctypeLabel(meta.name)} hat nur einen Datensatz.{" "}
          <Knopf href={`${basis}/${encodeURIComponent(meta.name)}`} size="s">
            Öffnen
          </Knopf>
        </div>
      )}
      {daten.fehler && <Fehler code={daten.fehler.code} message={daten.fehler.message} />}
      {daten.board && <Kanban doctype={doctype} spalten={daten.board} kartenFelder={kartenFelder} titelFeld={meta.title_field || "name"} statusTon={toene} uebergaenge={daten.uebergaenge} hrefBasis={basis} />}
      {daten.zeilen && (
        <DataTable
          doctype={doctype}
          spalten={spalten}
          zeilen={daten.zeilen}
          gesamt={daten.gesamt}
          seite={abfrage.seite}
          groesse={abfrage.groesse}
          sortFeld={abfrage.sortFeld}
          richtung={abfrage.richtung}
          basis={basis}
          params={params1}
          zeilenBasis={basis}
          statusTon={toene}
          darfExport={darfDoc(session, meta, "export")}
          massenaktionen={daten.massen}
          filterDaten={{ filters: abfrage.filters, orFilters: abfrage.orFilters, orderBy: abfrage.orderBy }}
        />
      )}
    </Shell>
  );
}
