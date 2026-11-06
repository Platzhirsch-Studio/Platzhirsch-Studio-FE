import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import Plantafel from "@/components/Backoffice/Logistik/Plantafel";
import { LogistikKanban } from "@/components/Backoffice/Logistik/Aktionen";
import { ausTourAction, tourAnlegenAction, tourKanbanAction, zurTourAction } from "@/lib/backoffice/logistik/actions";
import { heute, plantafel } from "@/lib/backoffice/logistik/daten";
import { blaettern, kw } from "@/lib/backoffice/logistik/plantafel";
import { toeneFuer } from "@/lib/backoffice/logistik/status";
import { TOUR as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../_teile";

export const metadata = { title: "Touren" };
export const dynamic = "force-dynamic";

// Touren (§ 4.6): Plantafel (Standard), Liste oder Kanban; Zeitraum Woche · 3 Tage · Tag; ‹ KW › und „Heute“.
export default async function Touren({ searchParams }) {
  const params = werte(await searchParams);
  const ansicht = params.ansicht || "plantafel";
  const ansichtSegment = (
    <Segment label="Ansicht" aktiv={ansicht} groesse="s" optionen={[
      { wert: "plantafel", titel: T.ansichten.plantafel, href: "/logistik/touren" },
      { wert: "liste", titel: T.ansichten.liste, href: "/logistik/touren?ansicht=liste" },
      { wert: "kanban", titel: T.ansichten.kanban, href: "/logistik/touren?ansicht=kanban" },
    ]} />
  );

  if (ansicht === "liste") {
    return ListenSeite({
      params, pfad: "/logistik/touren", titel: T.liste, doctype: "PH Tour", aktionen: ansichtSegment, statusWerte: ["Geplant", "Freigegeben", "Unterwegs", "Abgeschlossen", "Abgebrochen"], standardSort: "datum desc",
      felder: ["name", "titel", "datum", "region", "fahrzeug", "fahrer", "status", "km_start", "km_ende"],
      spalten: [{ fieldname: "titel", label: "Tour" }, { fieldname: "datum", label: "Datum", fieldtype: "Date" }, { fieldname: "fahrzeug", label: "Fahrzeug" }, { fieldname: "fahrer", label: "Fahrer" }, { fieldname: "km_text", label: "km" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
      titelFeld: "titel", unterFelder: ["region"], zeilenBasis: "/logistik/touren",
      mapZeile: (z) => ({ ...z, km_text: z.km_ende && z.km_start ? String(z.km_ende - z.km_start) : "–" }),
      leerText: LEER.touren,
    });
  }

  const { session, client } = await seite("/logistik/touren");
  if (ansicht === "kanban") {
    const spalten = await client.getKanban("PH Tour", { fields: ["name", "titel", "datum", "fahrzeug", "status"], filters: [["status", "!=", "Abgebrochen"]] });
    return (
      <Shell session={session} breit>
        <Seitenkopf titel={T.liste} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.liste }]} aktionen={ansichtSegment} />
        <LogistikKanban doctype="PH Tour" spalten={spalten.filter((s) => s.status !== "Abgebrochen")} kartenFelder={[{ fieldname: "datum", label: "Datum", fieldtype: "Date" }, { fieldname: "fahrzeug", label: "Fahrzeug" }]} titelFeld="titel" statusTon={toeneFuer("PH Tour")} hrefBasis="/logistik/touren" verschieben={tourKanbanAction} />
      </Shell>
    );
  }

  const h = heute(client);
  const zeitraum = ["woche", "3tage", "tag"].includes(params.zeitraum) ? params.zeitraum : "woche";
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(params.datum || "") ? params.datum : h;
  const tafel = await plantafel(client, { ansicht: zeitraum, datum });
  const fahrer = [...new Set([...(tafel.fahrzeuge || []).map((f) => f.standard_fahrer), ...tafel.touren.map((t) => t.fahrer)].filter(Boolean))].map((u) => ({ name: u, titel: u.split("@")[0] }));
  const q = (d, z = zeitraum) => `/logistik/touren?zeitraum=${z}&datum=${d}`;
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={T.liste}
        ueber={`${T.kw(kw(tafel.zeitraum.von))} · ${tafel.zeitraum.von.slice(8, 10)}.${tafel.zeitraum.von.slice(5, 7)}. – ${tafel.zeitraum.bis.slice(8, 10)}.${tafel.zeitraum.bis.slice(5, 7)}.`}
        krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.liste }]}
        aktionen={ansichtSegment}
        unternav={
          <div className="flex flex-wrap items-center gap-2">
            <Knopf icon="ChevronLeft" label="Zurück" href={q(blaettern(zeitraum, datum, -1))} />
            <Knopf href={q(h)}>{T.heute}</Knopf>
            <Knopf icon="ChevronRight" label="Weiter" href={q(blaettern(zeitraum, datum, 1))} />
            <Segment label="Zeitraum" aktiv={zeitraum} groesse="s" optionen={["woche", "3tage", "tag"].map((z) => ({ wert: z, titel: T.zeitraum[z], href: q(datum, z) }))} />
          </div>
        }
      />
      <p className="bo-log-cap mb-4 lg:hidden">{T.plantafelSchmal}</p>
      <Plantafel tafel={tafel} heute={h} vorwahl={params.ls || null} zurTour={zurTourAction} ausTour={ausTourAction} tourAnlegen={tourAnlegenAction} fahrer={fahrer} />
    </Shell>
  );
}
