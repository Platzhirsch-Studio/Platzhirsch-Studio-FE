import { fakturaKontext, alle, projektAuswahl } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { ER_REITER, ER_SPALTEN, erZeile } from "@/lib/backoffice/faktura/zeilen";
import { STATUS_WERTE, tonTabelle } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, LISTE, wertLabel } from "@/lib/backoffice/faktura/texte";
import { cent } from "@/lib/backoffice/format";
import Segment from "@/components/Backoffice/Segment";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";
import { ErKanban } from "@/components/Backoffice/Faktura/Kanbans";

export const metadata = { title: "Eingangsrechnungen · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/eingangsrechnungen (T2, ?ansicht=kanban) – 10-konzept-faktura § 3.6 + Kostenzuordnung
// (Projektnachkalkulation): Spalte „Kosten“, Reiter „Kosten offen“, Freigabe erst mit vollständiger Zuordnung.
export default async function Eingangsrechnungen({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/eingangsrechnungen");
  const { client, rolle, heute } = ctx;
  const [daten, projekte] = await Promise.all([alle(client, "PH Eingangsrechnung"), rolle.schreibt ? projektAuswahl(client) : []]);
  const kanban = params.ansicht === "kanban";
  const m = listenModell({
    daten,
    reiter: REITER.er,
    regeln: ER_REITER,
    params,
    standard: "pruefen",
    rolle,
    extra: { heute },
    zaehlerFuer: ["pruefen", "freigabe", "zahlen", "kosten"],
    zeile: (e) => erZeile(e, { heute, rolle }),
    suchFelder: (e) => [e.name, e.lieferant_name, e.rechnungsnummer_lieferant, e.projekt, e.herstellerbestellung, e.zahlbetrag_cent, e.brutto_cent],
    sortFeld: "faellig",
    richtung: "asc",
  });
  const summe = m.alleGefiltert.reduce((s, e) => s + (Number(e.zahlbetrag_cent ?? e.brutto_cent) || 0), 0);
  const spalten = ["Erfasst", "Sachlich geprueft", "Freigegeben", "Bezahlt"].map((s) => ({ status: s, karten: daten.filter((e) => e.status === s).slice(0, 60) }));
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Eingangsrechnungen"
      route="/faktura/eingangsrechnungen"
      aktionen={
        <>
          <Segment label="Ansicht" aktiv={kanban ? "kanban" : "liste"} optionen={[{ wert: "liste", titel: LISTE.ansichtListe, href: "/faktura/eingangsrechnungen", icon: "Rows3" }, { wert: "kanban", titel: LISTE.ansichtKanban, href: "/faktura/eingangsrechnungen?ansicht=kanban", icon: "Columns3" }]} />
          {rolle.schreibt && <KopfAktion art="er" primaer daten={{ projekte }} />}
        </>
      }
    >
      {kanban ? (
        <ErKanban spalten={spalten} toene={tonTabelle("PH Eingangsrechnung")} leitung={rolle.leitung} />
      ) : (
        <FakturaListe
          liste="eingangsrechnungen"
          spalten={ER_SPALTEN}
          zeilen={m.zeilen}
          reiter={m.reiter}
          aktiverReiter={m.aktiv}
          basis="/faktura/eingangsrechnungen"
          params={params}
          seite={m.seite}
          seiten={m.seiten}
          gesamt={m.gesamt}
          summe={`${m.zeilen.length} von ${m.gesamt} · Zahlbetrag ${cent(summe)}`}
          statusOptionen={STATUS_WERTE["PH Eingangsrechnung"].map((s) => ({ wert: s, text: wertLabel(s) }))}
          massen={rolle.schreibt ? [{ id: "er-pruefen", titel: "Sachlich prüfen" }, ...(rolle.leitung ? [{ id: "er-freigeben", titel: "Freigeben" }] : []), { id: "zahllauf", titel: "Für Zahllauf vormerken" }] : []}
          darfCsv={rolle.darfCsv}
          leer={m.aktiv === "pruefen" && daten.length ? { art: "erledigt", titel: LEER.erPruefen } : m.aktiv === "kosten" && daten.length ? { art: "erledigt", titel: "Alle Kosten zugeordnet." } : { titel: LEER.er.titel, text: LEER.er.text, aktion: rolle.schreibt ? { titel: LEER.er.aktion, href: "/faktura/eingangsrechnungen?panel=neu" } : null }}
          testid="er-liste"
        />
      )}
    </FakturaSeite>
  );
}
