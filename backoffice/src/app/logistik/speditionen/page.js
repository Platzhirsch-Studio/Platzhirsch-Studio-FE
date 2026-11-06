import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import { LogistikKanban } from "@/components/Backoffice/Logistik/Aktionen";
import { speditionKanbanAction } from "@/lib/backoffice/logistik/actions";
import { heute } from "@/lib/backoffice/logistik/daten";
import { statusText, toeneFuer } from "@/lib/backoffice/logistik/status";
import { SPEDITION as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../_teile";

export const metadata = { title: "Speditionsaufträge" };
export const dynamic = "force-dynamic";

// Speditionsaufträge (§ 4.8): Liste/Kanban, Ansichten Offen · Diese Woche · Hersteller an Lager · Alle.
export default async function Speditionen({ searchParams }) {
  const params = werte(await searchParams);
  const ansicht = params.ansicht || "";
  const umschalter = <Segment label="Ansicht" aktiv={ansicht === "kanban" ? "kanban" : "liste"} groesse="s" optionen={[{ wert: "liste", titel: "Liste", href: "/logistik/speditionen" }, { wert: "kanban", titel: "Kanban", href: "/logistik/speditionen?ansicht=kanban" }]} />;
  if (ansicht === "kanban") {
    const { session, client } = await seite("/logistik/speditionen");
    const spalten = (await client.getKanban("PH Speditionsauftrag", { fields: ["name", "titel", "kunde_name", "spediteur", "zustell_datum", "status"] })).filter((s) => s.status !== "Storniert");
    return (
      <Shell session={session} breit>
        <Seitenkopf titel={T.liste} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.liste }]} aktionen={umschalter} />
        <LogistikKanban doctype="PH Speditionsauftrag" spalten={spalten} kartenFelder={[{ fieldname: "spediteur", label: "Spediteur" }, { fieldname: "zustell_datum", label: "Zustellung", fieldtype: "Date" }]} titelFeld="titel" statusTon={toeneFuer("PH Speditionsauftrag")} hrefBasis="/logistik/speditionen" verschieben={speditionKanbanAction} />
      </Shell>
    );
  }
  const { client } = await seite("/logistik/speditionen");
  const h = heute(client);
  const bis = new Date(new Date(`${h}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
  const FILTER = { offen: [["status", "in", ["Entwurf", "Gesendet", "Bestaetigt", "Abgeholt"]]], woche: [["zustell_datum", "between", [h, bis]]], inbound: [["richtung", "=", "Hersteller an Lager"]] };
  return ListenSeite({
    params, pfad: "/logistik/speditionen", titel: T.liste, doctype: "PH Speditionsauftrag", filter: FILTER[ansicht] || [], aktionen: umschalter,
    ansichten: [{ titel: T.ansichten.offen, href: "/logistik/speditionen?ansicht=offen" }, { titel: T.ansichten.woche, href: "/logistik/speditionen?ansicht=woche" }, { titel: T.ansichten.inbound, href: "/logistik/speditionen?ansicht=inbound" }, { titel: T.ansichten.alle, href: "/logistik/speditionen" }],
    aktivAnsicht: ansicht ? `/logistik/speditionen?ansicht=${ansicht}` : "/logistik/speditionen",
    statusWerte: ["Entwurf", "Gesendet", "Bestaetigt", "Abgeholt", "Zugestellt", "Storniert"],
    felder: ["name", "titel", "richtung", "spediteur", "kunde_name", "kommission", "abhol_datum", "zustell_datum", "zustellart", "status"],
    spalten: [{ fieldname: "titel", label: "Auftrag" }, { fieldname: "richtung", label: "Richtung" }, { fieldname: "spediteur", label: "Spediteur" }, { fieldname: "abhol_datum", label: "Abholung", fieldtype: "Date" }, { fieldname: "zustell_datum", label: "Zustellung", fieldtype: "Date" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "titel", unterFelder: ["kunde_name"], zeilenBasis: "/logistik/speditionen",
    mapZeile: (z) => ({ ...z, spediteur: z.spediteur || "–", status_text: statusText("PH Speditionsauftrag", z.status) }),
    leerText: LEER.speditionen,
  });
}
