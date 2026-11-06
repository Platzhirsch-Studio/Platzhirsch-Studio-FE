import { redirect } from "next/navigation";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { bewertungAnlegenAction } from "@/lib/backoffice/logistik/actions";
import { heute } from "@/lib/backoffice/logistik/daten";
import { cent } from "@/lib/backoffice/format";
import { INVENTUR as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../../_teile";

export const metadata = { title: "Inventurbewertung" };
export const dynamic = "force-dynamic";

// Inventurbewertung (README ph_logistik „Lager & Inventur“): Beleg Entwurf → Festgeschrieben (unveränderlich),
// Niederstwert mit Abwertungsstaffel (Platzhalter bis StB), nur Leitung/GF.
export default async function Bewertungen({ searchParams }) {
  const params = werte(await searchParams);
  const { client, leitung } = await seite("/logistik/inventur/bewertung");
  if (!leitung) redirect("/kein-zugriff?bereich=logistik&aktion=bewertung");
  return ListenSeite({
    params, pfad: "/logistik/inventur/bewertung", titel: T.bewertung.titel, doctype: "PH Inventurbewertung", statusWerte: ["Entwurf", "Festgeschrieben", "Verworfen"], standardSort: "stichtag desc",
    aktionen: <VorgangKnopf variant="primary" icon="Plus" aktion={bewertungAnlegenAction} titel={T.bewertung.neu} felder={[{ name: "stichtag", label: "Stichtag (JJJJ-MM-TT)", pflicht: true, start: heute(client) }, { name: "methode", label: T.bewertung.methode, typ: "auswahl", start: "Gleitender Durchschnitt", optionen: ["Gleitender Durchschnitt", "Letzter EK"] }]} dialogText={T.bewertung.platzhalter} ziel="/logistik/inventur/bewertung/" zielFeld="name" testid="bewertung-neu" />,
    felder: ["name", "titel", "stichtag", "lagerort", "methode", "anzahl_positionen", "wert_ak_cent", "abwertung_cent", "wert_cent", "status"],
    spalten: [{ fieldname: "titel", label: "Bewertung" }, { fieldname: "stichtag", label: T.bewertung.stichtag, fieldtype: "Date" }, { fieldname: "methode", label: T.bewertung.methode }, { fieldname: "ak_text", label: T.bewertung.wertAk }, { fieldname: "wert_text", label: T.bewertung.wert }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "titel", unterFelder: ["lagerort"], zeilenBasis: "/logistik/inventur/bewertung",
    mapZeile: (z) => ({ ...z, lagerort: z.lagerort || "alle Lagerorte", ak_text: cent(z.wert_ak_cent), wert_text: cent(z.wert_cent) }),
    leerText: LEER.bewertung,
  });
}
