// Gemeinsame Server-Teile der Logistik-Seiten (privater Ordner-Präfix „_“ → keine Route).
// Jede Seite prüft die Sitzung selbst (README UI-Kit), hier nur der gemeinsame Einstieg und kleine Bausteine.

import { requireRecht } from "@/lib/backoffice/auth/dal";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { ladeMeta } from "@/lib/backoffice/frappe";
import { listenAbfrage } from "@/lib/backoffice/listen";
import { logistikClient } from "@/lib/backoffice/logistik/client";
import { istLeitung } from "@/lib/backoffice/logistik/rechte";
import { einstellungen, testmodus } from "@/lib/backoffice/logistik/daten";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Unternav from "@/components/Backoffice/Unternav";
import DataTable from "@/components/Backoffice/DataTable/DataTable";
import Filterleiste from "@/components/Backoffice/DataTable/Filterleiste";
import Leer from "@/components/Backoffice/Leer";
import { toeneFuer } from "@/lib/backoffice/logistik/status";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import { Phasen, StatusPille, Fakten } from "@/components/Backoffice/Logistik/ui";

/** Sitzung + Bereichsrecht + Client (Mock-Stand gesichert). */
export async function seite(pfad, aktion = "read") {
  const session = await requireRecht("logistik", aktion, pfad);
  const client = logistikClient(session);
  return { session, client, leitung: istLeitung(session) };
}

/** searchParams → einfache Werte. */
export function werte(sp) {
  return Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]));
}

/** Liste mit Paging/Sortierung/Filter aus der URL plus Zusatzfiltern (Ansicht). */
export async function liste(client, session, doctype, params, { filters = [], fields = ["*"], standardSort } = {}) {
  const meta = await ladeMeta(client, doctype);
  const a = listenAbfrage(params, meta, { standardSort });
  const alle = [...a.filters, ...filters];
  const [zeilen, gesamt] = await Promise.all([
    client.getList(doctype, { fields, filters: alle, orFilters: a.orFilters, orderBy: a.orderBy, limit: a.limit, start: a.start }),
    client.count(doctype, { filters: alle, orFilters: a.orFilters }),
  ]);
  return { meta, a, zeilen, gesamt, darfExport: darfDoc(session, meta, "export"), darfAnlegen: darfDoc(session, meta, "create"), darfSchreiben: darfDoc(session, meta, "write") };
}

export async function testband(client) {
  return testmodus(await einstellungen(client));
}

/** Verlauf (Kommentare, Änderungen, Anhänge) über die Fundament-Zeitleiste. */
export function Verlauf({ doctype, name, docinfo, darfSchreiben = true }) {
  return <Zeitleiste doctype={doctype} name={name} docinfo={docinfo} darfSchreiben={darfSchreiben} />;
}

// ------------------------------------------------------------ Listen-Seite --

/**
 * Einheitliche Listen-Seite (Seitentyp T2): Seitenkopf mit Ansichten als Pillen, Filterleiste, Tabelle in Kachel.
 * Leer: nie Daten → Erklärung + erster Schritt; gefiltert → DataTable-Leertext.
 */
export async function ListenSeite({ params, pfad, titel, doctype, spalten, felder = ["*"], filter = [], ansichten, aktivAnsicht, statusWerte, aktionen, leerTitel, leerText, leerAktion, gefiltertText, zeilenBasis, mapZeile, titelFeld, unterFelder = [], standardSort, kopfZusatz, vorTabelle }) {
  const { session, client } = await seite(pfad);
  const l = await liste(client, session, doctype, params, { filters: filter, fields: felder, standardSort });
  const zeilen = mapZeile ? await Promise.all(l.zeilen.map((z) => mapZeile(z, client))) : l.zeilen;
  const toene = toeneFuer(doctype);
  const nieDaten = !l.gesamt && !params.q && !params.status && !params.ansicht && !params.von && !filter.length;
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={titel} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel }]} aktionen={aktionen} unternav={ansichten ? <Unternav eintraege={ansichten} aktiv={aktivAnsicht} label="Ansichten" /> : undefined} />
      {kopfZusatz}
      {statusWerte ? <Filterleiste basis={pfad} params={params} statusWerte={statusWerte} statusTon={toene} /> : null}
      {vorTabelle}
      {nieDaten ? (
        <Leer titel={leerTitel || titel} text={leerText} aktion={leerAktion} />
      ) : (
        <DataTable doctype={doctype} spalten={spalten} zeilen={zeilen} gesamt={l.gesamt} seite={l.a.seite} groesse={l.a.groesse} sortFeld={l.a.sortFeld} richtung={l.a.richtung} basis={pfad} params={params}
          zeilenBasis={zeilenBasis} statusTon={toene} darfExport={l.darfExport} titelFeld={titelFeld} unterFelder={unterFelder} leerText={gefiltertText || "Keine Einträge für diese Auswahl."} testid="liste" />
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------- Akte-Seite --

/**
 * Einheitliche Akte (Seitentyp T5, Lounge §7.3 ohne Hero): Kopf mit Zurück, Titel, Nummer, Status, genau einer
 * Primäraktion + ⋯; höchstens ein Band; Phasen; Reiter; rechts Details/Bezüge als Kacheln.
 */
export function AkteSeite({ session, doctype, doc, liste, titel, nummer, aktionen, band, tabs, tab, basis, params = {}, details, bezuege, children, phasen = true }) {
  return (
    <Shell session={session}>
      <AkteGeruest
        testid="akte"
        kopf={<AkteKopf zurueck={{ href: liste.href, titel: liste.titel }} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: liste.titel, href: liste.href }, { titel: doc.name }]} titel={titel} nummer={nummer} status={<StatusPille doctype={doctype} status={doc.status} doc={doc} groesse="m" />} aktionen={aktionen} />}
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} aktion={band.aktion} testid="akte-band" /> : null}
        vorgang={phasen ? <div className="px-1"><Phasen doctype={doctype} status={doc.status} doc={doc} /></div> : null}
        vorgangOben
        reiter={tabs ? <AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={params} mitSeite={!!(details || bezuege)} /> : null}
        rechts={details || bezuege ? <RechteSpalte details={details ? <Fakten eintraege={details} /> : null} bezuege={bezuege} /> : null}
        seiteAktiv={tab === "seite"}
      >
        {children}
      </AkteGeruest>
    </Shell>
  );
}
