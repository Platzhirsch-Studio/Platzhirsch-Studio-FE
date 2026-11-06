import Knopf from "@/components/Backoffice/Knopf";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { trackingAlleAction } from "@/lib/backoffice/logistik/actions";
import { SENDUNG as T, LEER } from "@/lib/backoffice/logistik/texte";
import { cent } from "@/lib/backoffice/format";
import { ListenSeite, werte } from "../_teile";

export const metadata = { title: "Sendungen" };
export const dynamic = "force-dynamic";

const ANSICHT = { offen: [["status", "in", ["Angelegt", "Etikett", "Unterwegs", "Problem"]]], problem: [["status", "=", "Problem"]], ohneetikett: [["status", "=", "Angelegt"]] };

// Sendungen (§ 4.4, kein Kanban): Ansichten, Status-Chips, Suche; Kopf „Tracking aktualisieren“.
export default async function Sendungen({ searchParams }) {
  const params = werte(await searchParams);
  const ansicht = params.ansicht || "";
  return ListenSeite({
    params, pfad: "/logistik/sendungen", titel: T.liste, doctype: "PH Sendung",
    filter: ANSICHT[ansicht] || [],
    ansichten: [
      { titel: T.ansichten.offen, href: "/logistik/sendungen?ansicht=offen" },
      { titel: T.ansichten.problem, href: "/logistik/sendungen?ansicht=problem" },
      { titel: T.ansichten.ohneEtikett, href: "/logistik/sendungen?ansicht=ohneetikett" },
      { titel: T.ansichten.alle, href: "/logistik/sendungen" },
    ],
    aktivAnsicht: ansicht ? `/logistik/sendungen?ansicht=${ansicht}` : "/logistik/sendungen",
    statusWerte: ["Angelegt", "Etikett", "Unterwegs", "Zugestellt", "Problem", "Storniert"],
    aktionen: <VorgangKnopf variant="primary" icon="RefreshCw" aktion={trackingAlleAction} titel={T.trackingAlle} erfolg="Tracking abgeglichen" testid="tracking-alle" />,
    felder: ["name", "empf_name", "empf_ort", "empf_land", "richtung", "carrier", "service_name", "tracking_nr", "gebucht_am", "unterwegs_seit", "preis_brutto_cent", "berechnet_cent", "letzter_abgleich", "status", "env", "modified"],
    spalten: [
      { fieldname: "empf_name", label: T.felder.empfaenger },
      { fieldname: "richtung", label: T.felder.richtung },
      { fieldname: "carrier_text", label: T.felder.carrier },
      { fieldname: "tracking_nr", label: T.felder.tracking },
      { fieldname: "preis_text", label: T.felder.preis },
      { fieldname: "test_text", label: "Umgebung" },
      { fieldname: "status", label: "Status", fieldtype: "Select" },
    ],
    titelFeld: "empf_name", unterFelder: ["empf_ort"], zeilenBasis: "/logistik/sendungen",
    mapZeile: (z) => ({ ...z, empf_name: z.empf_name || "–", carrier_text: [z.carrier, z.service_name].filter(Boolean).join(" · ") || "–", preis_text: z.preis_brutto_cent ? cent(z.preis_brutto_cent) : "–", test_text: z.env === "live" ? "live" : "Test", tracking_nr: z.tracking_nr || "–" }),
    leerTitel: "Noch keine Sendungen", leerText: LEER.sendungen, leerAktion: <Knopf href="/packtisch" icon="PackageCheck">Zum Packtisch</Knopf>,
    gefiltertText: ansicht === "problem" ? LEER.sendungenProblem : undefined,
  });
}
