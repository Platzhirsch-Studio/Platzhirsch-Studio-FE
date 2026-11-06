import Segment from "@/components/Backoffice/Segment";
import Faehigkeit from "@/components/Backoffice/Faehigkeit";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { nachbestellenAction } from "@/lib/backoffice/logistik/actions";
import { LOGISTIK } from "@/lib/backoffice/logistik/faehigkeiten";
import { cent } from "@/lib/backoffice/format";
import { NACHBESTELLUNG as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../_teile";

export const metadata = { title: "Nachbestellung" };
export const dynamic = "force-dynamic";

// Nachbestellung (README ph_logistik „Lager & Inventur“): Bestellvorschläge (täglich gerechnet) und Meldebestände;
// „Herstellerbestellung aus Vorschlägen“ legt Entwürfe je Lieferant an (Leitung, Fähigkeit nachbestellung).
export default async function Nachbestellung({ searchParams }) {
  const params = werte(await searchParams);
  const { session, client, leitung } = await seite("/logistik/nachbestellung");
  const tab = params.tab === "meldebestand" ? "meldebestand" : "vorschlaege";
  const umschalter = <Segment label="Ansicht" aktiv={tab} groesse="s" optionen={[{ wert: "vorschlaege", titel: T.vorschlaege, href: "/logistik/nachbestellung" }, { wert: "meldebestand", titel: T.meldebestaende, href: "/logistik/nachbestellung?tab=meldebestand" }]} />;
  if (tab === "meldebestand") {
    return ListenSeite({
      params, pfad: "/logistik/nachbestellung", titel: T.titel, doctype: "PH Meldebestand", aktionen: umschalter,
      kopfZusatz: <p className="bo-log-cap mb-4">{T.hinweis}</p>,
      felder: ["name", "produkt_name", "marke", "lagerort", "meldebestand", "zielbestand", "verfuegbar", "unter_meldebestand", "status"],
      spalten: [{ fieldname: "produkt_name", label: "Artikel" }, { fieldname: "meldebestand", label: "Meldebestand", fieldtype: "Int" }, { fieldname: "zielbestand", label: "Zielbestand", fieldtype: "Int" }, { fieldname: "verfuegbar", label: "Verfügbar", fieldtype: "Int" }, { fieldname: "unter_text", label: "Lage" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
      titelFeld: "produkt_name", unterFelder: ["lagerort"], zeilenBasis: "/d/ph-meldebestand",
      mapZeile: (z) => ({ ...z, unter_text: Number(z.unter_meldebestand) ? "unter Meldebestand" : "ausreichend" }),
      leerText: "Noch keine Meldebestände.",
    });
  }
  const offen = await client.getList("PH Bestellvorschlag", { fields: ["name"], filters: [["status", "=", "Offen"]], limit: 200 });
  const knopf = leitung && offen.length ? (
    <Faehigkeit session={session} id="logistik.nachbestellung" katalog={LOGISTIK} client={client}>
      {({ deaktiviert, grund }) => <VorgangKnopf variant="primary" icon="FileText" aktion={nachbestellenAction} args={{ namen: offen.map((o) => o.name), idempotency: `nb-${offen.map((o) => o.name).join(",")}` }} titel={T.bestellen} frage={{ titel: `${offen.length} Vorschläge als Herstellerbestellungen anlegen?`, text: "Je Lieferant ein Entwurf im Sortiment." }} disabled={deaktiviert} grund={grund} erfolg="Herstellerbestellungen angelegt" testid="nachbestellen" />}
    </Faehigkeit>
  ) : null;
  return ListenSeite({
    params, pfad: "/logistik/nachbestellung", titel: T.titel, doctype: "PH Bestellvorschlag", statusWerte: ["Offen", "Bestellt", "Erledigt", "Verworfen"], aktionen: <>{umschalter}{knopf}</>,
    felder: ["name", "produkt_name", "marke", "lagerort", "lieferant", "verfuegbar", "meldebestand", "vorschlag_menge", "wert_cent", "voraussichtlich_am", "status"],
    spalten: [{ fieldname: "produkt_name", label: "Artikel" }, { fieldname: "verfuegbar", label: "Verfügbar", fieldtype: "Int" }, { fieldname: "meldebestand", label: "Meldebestand", fieldtype: "Int" }, { fieldname: "vorschlag_menge", label: "Vorschlag", fieldtype: "Int" }, { fieldname: "wert_text", label: "Wert" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "produkt_name", unterFelder: ["marke"], zeilenBasis: "/d/ph-bestellvorschlag",
    mapZeile: (z) => ({ ...z, wert_text: cent(z.wert_cent) }),
    leerText: LEER.nachbestellung,
  });
}
