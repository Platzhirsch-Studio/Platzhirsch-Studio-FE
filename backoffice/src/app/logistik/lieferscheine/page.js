import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Unternav from "@/components/Backoffice/Unternav";
import Knopf from "@/components/Backoffice/Knopf";
import DataTable from "@/components/Backoffice/DataTable/DataTable";
import Filterleiste from "@/components/Backoffice/DataTable/Filterleiste";
import Leer from "@/components/Backoffice/Leer";
import { LogistikKanban } from "@/components/Backoffice/Logistik/Aktionen";
import { lieferscheinKanbanAction } from "@/lib/backoffice/logistik/actions";
import { heute } from "@/lib/backoffice/logistik/daten";
import { lieferartText, statusRang, toeneFuer } from "@/lib/backoffice/logistik/status";
import { LIEFERSCHEIN as T, LEER } from "@/lib/backoffice/logistik/texte";
import { isoDatum } from "@/lib/backoffice/format";
import { liste, seite, werte } from "../_teile";

export const metadata = { title: "Lieferscheine" };
export const dynamic = "force-dynamic";

const DT = "PH Lieferschein";

async function ansichtsFilter(client, ansicht, h) {
  const morgen = isoDatum(new Date(new Date(`${h}T00:00:00Z`).getTime() + 86_400_000));
  switch (ansicht) {
    case "heute":
      return [["status", "=", "Entwurf"], ["wunschtermin", "<=", morgen]];
    case "ohnetour":
      return [["status", "in", ["Entwurf", "Gepackt"]], ["lieferart", "in", ["Eigenlieferung", "Spedition"]], ["tour", "in", ["", null]]];
    case "abholbereit":
      return [["status", "=", "Gepackt"], ["lieferart", "=", "Abholung"]];
    case "zurueck": {
      const touren = await client.getList("PH Tour", { fields: ["name"], filters: [["status", "in", ["Abgeschlossen", "Abgebrochen"]]], limit: 50 });
      const namen = [];
      for (const t of touren) {
        const d = await client.getDoc("PH Tour", t.name);
        for (const s of d.stopps || []) if (s.lieferschein && ["nicht angetroffen", "verschoben", "offen", "unterwegs"].includes(s.status)) namen.push(s.lieferschein);
      }
      return [["status", "=", "Uebergeben"], ["name", "in", namen.length ? namen : ["–"]]];
    }
    default:
      return [];
  }
}

// Lieferscheine (§ 4.2): Ansichten als Pillen, eine Zeile Status-Chips + Suche, Liste oder Kanban (Ziehen ruft
// Dokumentmethoden, verzögert mit Rückgängig). Packstand aus den Positionen.
export default async function Lieferscheine({ searchParams }) {
  const params = werte(await searchParams);
  const { session, client } = await seite("/logistik/lieferscheine");
  const h = heute(client);
  const kanban = params.ansicht === "kanban";
  const filter = await ansichtsFilter(client, params.ansicht, h);
  const toene = toeneFuer(DT);

  const ansichten = [
    { titel: T.ansichten.heute, href: "/logistik/lieferscheine?ansicht=heute" },
    { titel: T.ansichten.ohneTour, href: "/logistik/lieferscheine?ansicht=ohnetour" },
    { titel: T.ansichten.abholbereit, href: "/logistik/lieferscheine?ansicht=abholbereit" },
    { titel: T.ansichten.zurueck, href: "/logistik/lieferscheine?ansicht=zurueck" },
    { titel: T.ansichten.alle, href: "/logistik/lieferscheine" },
  ];
  const aktivAnsicht = params.ansicht && params.ansicht !== "kanban" ? `/logistik/lieferscheine?ansicht=${params.ansicht}` : "/logistik/lieferscheine";
  const umschalter = (
    <Segment label="Ansicht" aktiv={kanban ? "kanban" : "liste"} groesse="s" optionen={[{ wert: "liste", titel: T.liste_kanban.liste, href: "/logistik/lieferscheine" }, { wert: "kanban", titel: T.liste_kanban.kanban, href: "/logistik/lieferscheine?ansicht=kanban" }]} />
  );

  if (kanban) {
    const spalten = (await client.getKanban(DT, { fields: ["name", "kunde_name", "lieferart", "wunschtermin", "liefer_ort", "status"], filters: [["status", "!=", "Storniert"]] })).filter((s) => s.status !== "Storniert");
    for (const s of spalten) s.karten = s.karten.map((k) => ({ ...k, lieferart: lieferartText(k.lieferart) }));
    return (
      <Shell session={session} breit>
        <Seitenkopf titel={T.liste} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.liste }]} aktionen={umschalter} />
        <LogistikKanban doctype={DT} spalten={spalten} kartenFelder={[{ fieldname: "lieferart", label: "Lieferart" }, { fieldname: "liefer_ort", label: "Ort" }, { fieldname: "wunschtermin", label: "Wunsch", fieldtype: "Date" }]} titelFeld="kunde_name" statusTon={toene} hrefBasis="/logistik/lieferscheine" verschieben={lieferscheinKanbanAction} />
      </Shell>
    );
  }

  const l = await liste(client, session, DT, params, { filters: filter, fields: ["name", "kunde_name", "liefer_ort", "liefer_plz", "lieferart", "wunschtermin", "tour", "status", "teillieferung", "zerbrechlich", "modified"], standardSort: "wunschtermin asc" });
  const zeilen = await Promise.all(
    l.zeilen
      .sort((a, b) => statusRang(DT, a.status) - statusRang(DT, b.status) || String(a.wunschtermin || "9999").localeCompare(String(b.wunschtermin || "9999")))
      .map(async (z) => {
        let packstand = "–";
        if (["Entwurf", "Gepackt"].includes(z.status)) {
          const d = await client.getDoc(DT, z.name).catch(() => null);
          const pos = d?.positionen || [];
          if (pos.length) packstand = `${pos.reduce((s, p) => s + Math.min(Number(p.menge_gepackt || 0), Number(p.menge || 0)), 0)}/${pos.reduce((s, p) => s + Number(p.menge || 0), 0)}`;
        }
        return { ...z, ort: [z.liefer_plz, z.liefer_ort].filter(Boolean).join(" "), lieferart_text: lieferartText(z.lieferart), wunsch: z.wunschtermin || "", tour_text: z.tour ? z.tour.replace(/^PH-TOUR-\d{4}-/, "Tour ") : "–", packstand, teil: Number(z.teillieferung) ? T.teil : "" };
      }),
  );
  const spalten = [
    { fieldname: "kunde_name", label: T.spalten.kunde },
    { fieldname: "lieferart_text", label: T.spalten.lieferart },
    { fieldname: "wunsch", label: T.spalten.wunsch, fieldtype: "Date" },
    { fieldname: "tour_text", label: T.spalten.tour },
    { fieldname: "packstand", label: T.spalten.packstand },
    { fieldname: "status", label: T.spalten.status, fieldtype: "Select" },
  ];
  const leer = !l.gesamt && !params.q && !params.status && !params.ansicht;
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={T.liste}
        krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.liste }]}
        aktionen={<>{umschalter}<Knopf href="/packtisch" icon="PackageCheck" variant="primary">Zum Packtisch</Knopf></>}
        unternav={<Unternav eintraege={ansichten} aktiv={aktivAnsicht} label="Ansichten" />}
      />
      <Filterleiste basis="/logistik/lieferscheine" params={params} statusWerte={["Entwurf", "Gepackt", "Uebergeben", "Zugestellt", "Storniert"]} statusTon={toene} />
      {leer ? (
        <Leer titel="Noch keine Lieferscheine" text={LEER.lieferscheine} aktion={<Knopf href="/packtisch" icon="PackageCheck">Zum Packtisch</Knopf>} />
      ) : (
        <DataTable doctype={DT} spalten={spalten} zeilen={zeilen} gesamt={l.gesamt} seite={l.a.seite} groesse={l.a.groesse} sortFeld={l.a.sortFeld} richtung={l.a.richtung} basis="/logistik/lieferscheine" params={params}
          zeilenBasis="/logistik/lieferscheine" statusTon={toene} darfExport={l.darfExport} titelFeld="kunde_name" unterFelder={["ort"]} leerText={LEER.lieferscheineGefiltert} testid="liste" />
      )}
    </Shell>
  );
}
