import Kachel from "@/components/Backoffice/Kachel";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Fakten, datumLang } from "@/components/Backoffice/Logistik/ui";
import { bewegungBuchenAction, bewegungStornierenAction } from "@/lib/backoffice/logistik/actions";
import { BEWEGUNGSART } from "@/lib/backoffice/logistik/status";
import { LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../_teile";

export const metadata = { title: "Bewegungen" };
export const dynamic = "force-dynamic";

// Bewegungen (§ 4.12): Journal ohne Bearbeiten/Löschen (E13). Storno nur Leitung als Gegenbuchung; „Bewegung buchen“
// als ein Dialog (Art, Bestand, ganzzahlige Menge, Von/Nach, Grund Pflicht).
export default async function Bewegungen({ searchParams }) {
  const params = werte(await searchParams);
  if (params.q) params.q = params.q.replace(/^\//, "");
  const { client, leitung } = await seite("/logistik/bewegungen");
  const einzeln = params.q && /^PH-LBW-/.test(params.q) ? await client.getDoc("PH Lagerbewegung", params.q).catch(() => null) : null;
  return ListenSeite({
    params, pfad: "/logistik/bewegungen", titel: "Bewegungen", doctype: "PH Lagerbewegung", statusWerte: ["Gebucht", "Storniert"], standardSort: "datum desc",
    aktionen: (
      <VorgangKnopf variant="primary" icon="Plus" aktion={bewegungBuchenAction} titel="Bewegung buchen" testid="bewegung-buchen"
        felder={[
          { name: "art", label: "Art", typ: "auswahl", pflicht: true, start: "Wareneingang", optionen: ["Wareneingang", "Umlagerung", "Ausbuchung", "Retoure"] },
          { name: "lagerbestand", label: "Bestand (PH-LB-…)", pflicht: true },
          { name: "menge", label: "Menge", typ: "zahl", pflicht: true, start: "1" },
          { name: "lagerortVon", label: "Von Lagerort" }, { name: "platzVon", label: "Von Platz" },
          { name: "lagerortNach", label: "Nach Lagerort" }, { name: "platzNach", label: "Nach Platz" },
          { name: "grund", label: "Grund", typ: "text", pflicht: true },
        ]}
        dialogText="Reservierung, Freigabe, Inventur und Verkauf entstehen aus ihren Vorgängen." erfolg="Bewegung gebucht" />
    ),
    vorTabelle: einzeln ? (
      <Kachel className="mb-6" titel={`${einzeln.art} · ${einzeln.name}`} werkzeuge={leitung && einzeln.status === "Gebucht" ? <VorgangKnopf variant="ghost" icon="Undo2" aktion={bewegungStornierenAction} args={{ name: einzeln.name }} titel="Stornieren" frage={{ titel: `Gegenbuchung zu ${einzeln.name} anlegen?`, text: `${einzeln.lagerort_von || einzeln.lagerort_nach || ""} ${-Number(einzeln.menge) > 0 ? "+" : ""}${-Number(einzeln.menge)}`, gefaehrlich: true, bestaetigen: "Stornieren" }} erfolg="Storniert" /> : null}>
        <Fakten eintraege={[{ label: "Datum", wert: datumLang(einzeln.datum) }, { label: "Menge", wert: einzeln.menge }, { label: "Von", wert: [einzeln.lagerort_von, einzeln.platz_von].filter(Boolean).join(" ") }, { label: "Nach", wert: [einzeln.lagerort_nach, einzeln.platz_nach].filter(Boolean).join(" ") }, { label: "Grund", wert: einzeln.grund }, { label: "Status", wert: einzeln.status }]} />
      </Kachel>
    ) : null,
    felder: ["name", "art", "datum", "menge", "produkt_name", "titel", "lagerort_von", "platz_von", "lagerort_nach", "platz_nach", "bezug", "von_user", "grund", "status", "storno_von"],
    spalten: [{ fieldname: "art_text", label: "Art" }, { fieldname: "datum", label: "Datum", fieldtype: "Datetime" }, { fieldname: "menge_text", label: "Menge" }, { fieldname: "von_nach", label: "Von → Nach" }, { fieldname: "bezug_text", label: "Bezug" }, { fieldname: "grund_text", label: "Grund" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "art_text", unterFelder: ["titel"], zeilenBasis: "/logistik/bewegungen?q=",
    mapZeile: (z) => ({ ...z, art_text: `${BEWEGUNGSART[z.art]?.zeichen || ""} ${z.art}`, menge_text: `${Number(z.menge) > 0 ? "+" : ""}${z.menge}`, von_nach: [z.lagerort_von && `${z.lagerort_von} ${z.platz_von || ""}`, z.lagerort_nach && `${z.lagerort_nach} ${z.platz_nach || ""}`].filter(Boolean).join(" → ") || "–", bezug_text: z.bezug || (z.storno_von ? `Storno ${z.storno_von}` : "–"), grund_text: z.grund || "–" }),
    leerText: LEER.bewegungen,
  });
}
