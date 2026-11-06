import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { paramsAus } from "@/lib/backoffice/faktura/listen";
import { erZeile } from "@/lib/backoffice/faktura/zeilen";
import { LEER, SPALTE } from "@/lib/backoffice/faktura/texte";
import { cent } from "@/lib/backoffice/format";
import { FAKTURA } from "@/lib/backoffice/faktura/faehigkeiten";
import Faehigkeit from "@/components/Backoffice/Faehigkeit";
import Knopf from "@/components/Backoffice/Knopf";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import DruckenKnopf from "@/components/Backoffice/Faktura/DruckenKnopf";

export const metadata = { title: "Zahllauf · Faktura" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { key: "lieferant", titel: SPALTE.lieferantNr, typ: "objekt" },
  { key: "faellig", titel: SPALTE.faellig, typ: "signal" },
  { key: "skonto", titel: SPALTE.skontoBis, typ: "wort" },
  { key: "zahlbetrag", titel: SPALTE.zahlbetrag, typ: "betrag" },
  { key: "iban", titel: SPALTE.iban, typ: "wort" },
];

// /faktura/zahllauf (T8 Arbeitsliste, § 3.11): freigegebene ER, Auswahl → „Als bezahlt buchen (n)“ (Rückfrage),
// „Zahlliste drucken“; die SEPA-Datei ist eine Fähigkeit (ph_faktura.api.sepa_zahllauf, nicht erwartet).
export default async function Zahllauf({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/zahllauf");
  const { client, rolle, heute, session } = ctx;
  const daten = (await alle(client, "PH Eingangsrechnung", { filters: [["status", "=", "Freigegeben"]] })).sort((a, b) => String(a.skonto_bis || a.faellig).localeCompare(String(b.skonto_bis || b.faellig)));
  const zeilen = daten.map((e) => {
    const z = erZeile(e, { heute, rolle });
    return { ...z, zellen: { ...z.zellen, iban: e.iban_lieferant ? `… ${e.iban_lieferant.replace(/\s/g, "").slice(-4)}` : "–" }, aktion: rolle.leitung ? { id: "er-bezahlt", titel: "Als bezahlt buchen" } : null };
  });
  const summe = daten.reduce((s, e) => s + (Number(e.zahlbetrag_cent ?? e.brutto_cent) || 0), 0);
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Zahllauf"
      untertitel={`${daten.length} Eingangsrechnungen · ${cent(summe)}`}
      aktionen={
        <>
          <Faehigkeit session={session} id="faktura.sepa" katalog={FAKTURA}>
            {({ deaktiviert, grund }) => (
              <Knopf variant="secondary" icon="Download" disabled={deaktiviert} grund={grund}>
                SEPA-Datei
              </Knopf>
            )}
          </Faehigkeit>
          <DruckenKnopf>Zahlliste drucken</DruckenKnopf>
        </>
      }
    >
      <FakturaListe liste="zahllauf" spalten={SPALTEN} zeilen={zeilen} basis="/faktura/zahllauf" params={params} gesamt={zeilen.length} summe={`${zeilen.length} zur Zahlung · ${cent(summe)}`} ohneZeitraum leer={{ art: "erledigt", titel: LEER.zahllauf }} massen={rolle.leitung ? [{ id: "zahllauf-buchen", titel: "Als bezahlt buchen" }] : []} testid="zahllauf-liste" />
    </FakturaSeite>
  );
}
