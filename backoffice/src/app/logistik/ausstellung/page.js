import { LagerScanKnopf } from "@/components/Backoffice/Logistik/LagerScanKnopf";
import { cent } from "@/lib/backoffice/format";
import { heute } from "@/lib/backoffice/logistik/daten";
import { alterMonate } from "@/lib/backoffice/logistik/inventur";
import { LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, werte } from "../_teile";

export const metadata = { title: "Ausstellung" };
export const dynamic = "force-dynamic";

// Ausstellungsstücke (§ 4.11): Bestand mit SN im Showroom, Alter als Text, VK Ausstellung; „Platz ändern …“ per Scan
// (Platz zuerst, § 8.2). Kein „An Kassa verkaufen“ (E6) – Verkauf an der Kassa über das Lageretikett.
export default async function Ausstellung({ searchParams }) {
  const params = werte(await searchParams);
  const h = heute(null);
  return ListenSeite({
    params, pfad: "/logistik/ausstellung", titel: "Ausstellung", doctype: "PH Lagerbestand",
    filter: [["ausstellungsstueck", "=", 1], ["status", "in", ["Verfuegbar", "Reserviert", "Gesperrt"]]],
    statusWerte: ["Verfuegbar", "Reserviert", "Gesperrt"],
    aktionen: <LagerScanKnopf titel="Platz ändern …" />,
    felder: ["name", "produkt_name", "marke", "lagerort", "platz", "seriennummer", "eingang_am", "vk_cent_ausstellung", "reserviert_kunde_name", "status"],
    spalten: [{ fieldname: "produkt_name", label: "Artikel" }, { fieldname: "platz", label: "Platz" }, { fieldname: "seriennummer", label: "SN" }, { fieldname: "alter_text", label: "Alter" }, { fieldname: "vk_text", label: "VK Ausstellung" }, { fieldname: "reserviert_kunde_name", label: "Reserviert für" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "produkt_name", unterFelder: ["lagerort"], zeilenBasis: "/logistik/bestand",
    mapZeile: (z) => {
      const m = alterMonate(z.eingang_am, h);
      return { ...z, platz: z.platz || "–", alter_text: m >= 12 ? `${Math.floor(m / 12)} J. ${m % 12} M. · über 1 Jahr` : `${m} Monate`, vk_text: z.vk_cent_ausstellung ? cent(z.vk_cent_ausstellung) : "auf Anfrage", reserviert_kunde_name: z.reserviert_kunde_name || "–" };
    },
    leerText: LEER.ausstellung,
  });
}
