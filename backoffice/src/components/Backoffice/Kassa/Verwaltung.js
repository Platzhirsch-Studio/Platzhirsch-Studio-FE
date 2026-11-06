// Kassa-Verwaltung (Team B-KAS, Konzept §4–§5) – Server-Bausteine im Lounge-Stil: generische Liste je
// DocType (Seitenkopf · Filter · Tabelle in Kachel · Telefon als Karten), Kopfzeilen der Akten, Faktenraster.
// Seiten unter src/app/kassa/verwaltung/* setzen diese zusammen. Jede Seite prüft Sitzung und Recht selbst.

import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { darf, darfDoc } from "@/lib/backoffice/auth/rechte";
import { ladeMeta } from "@/lib/backoffice/frappe";
import { listenFelder, listenSpalten, statusTon } from "@/lib/backoffice/frappe/meta";
import { listenAbfrage } from "@/lib/backoffice/listen";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { kassaClient } from "@/lib/backoffice/kassa/daten";
import Shell from "../Shell/Shell";
import Seitenkopf from "../Seitenkopf";
import DataTable from "../DataTable/DataTable";
import Filterleiste from "../DataTable/Filterleiste";
import Fehler from "../Fehler";
import "./kassa.css";

export const V = "/kassa/verwaltung";
export const KRUMEN = [{ titel: "Zentrale", href: "/" }, { titel: "Kassa", href: V }];

/** Sitzung + Leserecht im Bereich Kassa (Seitenschutz der Verwaltung). */
export async function verwaltungsZugang(pfad, aktion = "read") {
  const session = await requireSession(pfad);
  if (!darf(session, "kassa", aktion)) {
    const { redirect } = await import("next/navigation");
    redirect(`/kein-zugriff?bereich=kassa&aktion=${aktion}`);
  }
  return { session, client: kassaClient(session), leitung: darf(session, "kassa", "cancel") };
}

/**
 * Liste einer Kassa-DocType mit den Bausteinen des Fundaments (DataTable, Filterleiste) unter eigener Route.
 * @param {{doctype:string, pfad:string, titel:string, untertitel?:string, sp:object, aktionen?:any, spalten?:string[], vorFilter?:any[], ueber?:any, recht?:string}} p
 */
export async function KassaListe({ doctype, pfad, titel, untertitel, sp, aktionen, spalten: wunsch, vorFilter = [], ueber, recht = "read", sortStandard }) {
  const session = await requireSession(pfad);
  const client = kassaClient(session);
  const meta = await ladeMeta(client, doctype);
  if (!meta || meta.istable) notFound();
  await requireDocRecht(meta, recht, pfad);
  const params = Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v));
  const a = listenAbfrage(params, meta, { standardSort: sortStandard });
  const filters = [...(a.filters || []), ...vorFilter];
  const alle = listenSpalten(meta, 9);
  const spalten = wunsch ? wunsch.map((f) => alle.find((s) => s.fieldname === f) || meta.fields.find((x) => x.fieldname === f)).filter(Boolean).map((f) => ({ ...f })) : alle;
  for (const s of spalten) if (s.label) s.label = String(s.label).replace(/\s*brutto\s*\(Cent\)|\s*\(Cent\)|\s*\(Beleg\)/gi, "").trim();
  const felder = [...new Set([...listenFelder(meta), ...spalten.map((s) => s.fieldname)])];
  const toene = Object.fromEntries(meta.statusOptionen.map((s) => [s, statusTon(meta, s, client.index)]));
  let zeilen = [];
  let gesamt = 0;
  let fehler = null;
  try {
    [zeilen, gesamt] = await Promise.all([client.getList(doctype, { fields: felder, filters, orFilters: a.orFilters, orderBy: a.orderBy, limit: a.limit, start: a.start }), client.count(doctype, { filters, orFilters: a.orFilters })]);
  } catch (err) {
    fehler = { code: istBackofficeError(err) ? err.code : "unavailable", message: istBackofficeError(err) ? err.message : undefined };
  }
  return (
    <Shell session={session} breit>
      <div className="bo-ka-verwaltung">
        <Seitenkopf titel={titel} untertitel={untertitel} krumen={[...KRUMEN, { titel }]} aktionen={aktionen} />
        {ueber}
        <Filterleiste basis={pfad} params={params} statusWerte={meta.statusOptionen} statusTon={toene} datumsLabel={meta.fields.find((f) => f.fieldname === a.datumsfeld)?.label || "Zeitraum"} />
        {fehler ? (
          <Fehler code={fehler.code} message={fehler.message} />
        ) : (
          <DataTable doctype={doctype} spalten={spalten} zeilen={zeilen} gesamt={gesamt} seite={a.seite} groesse={a.groesse} sortFeld={a.sortFeld} richtung={a.richtung} basis={pfad} params={params} zeilenBasis={pfad} statusTon={toene} darfExport={darfDoc(session, meta, "export")} />
        )}
      </div>
    </Shell>
  );
}

/** Faktenraster (2 Spalten, Zahlen tabellarisch). */
export function Fakten({ eintraege = [] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {eintraege.filter(Boolean).map(([l, w]) => (
        <div key={l} className="min-w-0">
          <dt className="text-[13px] text-bo-text-soft">{l}</dt>
          <dd className="truncate text-[15px] font-medium tabular-nums">{w ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Datum/Zeit kurz (de-AT) aus „JJJJ-MM-TT hh:mm:ss“. */
export function zeit(wert, mitZeit = true) {
  const s = String(wert || "");
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s);
  if (!m) return s || "–";
  return `${m[3]}.${m[2]}.${m[1]}${mitZeit && m[4] ? ` ${m[4]}:${m[5]}` : ""}`;
}
