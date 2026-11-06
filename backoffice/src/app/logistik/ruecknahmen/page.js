import { wertText } from "@/lib/backoffice/logistik/status";
import { RUECKNAHME as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, werte } from "../_teile";

export const metadata = { title: "Warenrücknahmen" };
export const dynamic = "force-dynamic";

// Warenrücknahmen (§ 4.9) – außerhalb des Shop-Widerrufs.
export default async function Ruecknahmen({ searchParams }) {
  const params = werte(await searchParams);
  return ListenSeite({
    params, pfad: "/logistik/ruecknahmen", titel: T.liste, doctype: "PH Warenruecknahme",
    statusWerte: ["Angemeldet", "Angenommen", "Geprueft", "Abgeschlossen", "Storniert"],
    felder: ["name", "titel", "anlass", "kunde_name", "lieferschein", "abhol_datum", "status"],
    spalten: [{ fieldname: "kunde_name", label: "Kunde" }, { fieldname: "anlass_text", label: "Anlass" }, { fieldname: "lieferschein", label: "Lieferschein" }, { fieldname: "abhol_datum", label: "Abholung", fieldtype: "Date" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "kunde_name", zeilenBasis: "/logistik/ruecknahmen",
    mapZeile: (z) => ({ ...z, anlass_text: wertText(z.anlass), lieferschein: z.lieferschein || "–" }),
    leerText: LEER.ruecknahmen,
  });
}
