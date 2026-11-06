import { notFound } from "next/navigation";
import { fakturaKontext, alle, alleVoll } from "@/lib/backoffice/faktura/daten";
import { BERICHTE, berichtDef, umsatzJeMonat, zaehleNach, anzahlungsstand, offenePosten, nummernluecken, vertrieb, projektkosten } from "@/lib/backoffice/faktura/berichte";
import { STATUS_WERTE } from "@/lib/backoffice/faktura/status";
import { wertLabel } from "@/lib/backoffice/faktura/texte";
import BerichtSeite, { ladeBericht } from "@/components/Backoffice/Bericht/BerichtSeite";
import Segment from "@/components/Backoffice/Segment";
import { Balken, Donut } from "@/components/Backoffice/Charts";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import { Hinweis } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { report } = await params;
  return { title: `${berichtDef(report)?.titel || "Bericht"} · Berichte · Faktura` };
}

const SPALTEN = {
  uebersicht: [{ fieldname: "label", label: "Monat" }, { fieldname: "wert", label: "Umsatz netto", cent: true }],
  anzahlungsstand: [{ fieldname: "auftrag", label: "Auftrag" }, { fieldname: "kunde", label: "Kunde" }, { fieldname: "status", label: "Status" }, { fieldname: "soll_cent", label: "Soll", cent: true }, { fieldname: "ist_cent", label: "Ist", cent: true }, { fieldname: "offen_cent", label: "Offen", cent: true }],
  "offene-posten": [{ fieldname: "rechnung", label: "Rechnung" }, { fieldname: "kunde", label: "Kunde" }, { fieldname: "faellig", label: "Fällig", fieldtype: "Date" }, { fieldname: "tage", label: "Tage", fieldtype: "Int", summe: false }, { fieldname: "mahnstufe", label: "Mahnstufe", fieldtype: "Int", summe: false }, { fieldname: "offen_cent", label: "Offen", cent: true }],
  nummernluecken: [{ fieldname: "kreis", label: "Nummernkreis" }, { fieldname: "von", label: "Von", fieldtype: "Int", summe: false }, { fieldname: "bis", label: "Bis", fieldtype: "Int", summe: false }, { fieldname: "anzahl", label: "Belege", fieldtype: "Int" }, { fieldname: "luecken", label: "Lücken", fieldtype: "Int" }, { fieldname: "fehlend", label: "Fehlende Nummern" }],
  vertrieb: [{ fieldname: "berater", label: "Berater" }, { fieldname: "angebote", label: "Angebote", fieldtype: "Int" }, { fieldname: "offen_cent", label: "Offen", cent: true }, { fieldname: "quote", label: "Quote" }, { fieldname: "bestand_cent", label: "Auftragsbestand", cent: true }],
  projektkosten: [{ fieldname: "projekt", label: "Projekt" }, { fieldname: "kostenart", label: "Kostenart" }, { fieldname: "belege", label: "Belege", fieldtype: "Int" }, { fieldname: "betrag_cent", label: "Netto", cent: true }],
};

// /faktura/berichte/[report] (T8, § 3.11/§ 7) auf der BerichtSeite des Fundaments; Charts mit <details>-Tabelle.
export default async function Bericht({ params, searchParams }) {
  const { report } = await params;
  const def = berichtDef(report);
  if (!def) notFound();
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/berichte/${report}`);
  const { client, rolle, heute } = ctx;
  const [re, gs, an, ab, er, ma] = report === "kassa-abgleich" ? [[], [], [], [], [], []] : await Promise.all([alle(client, "PH Rechnung"), alle(client, "PH Gutschrift"), alle(client, "PH Angebot"), alleVoll(client, "PH Auftragsbestaetigung"), alleVoll(client, "PH Eingangsrechnung"), alle(client, "PH Mahnung")]);
  const umsatz = report === "uebersicht" ? umsatzJeMonat(re, gs, heute) : [];
  const RECHNER = {
    uebersicht: () => umsatz,
    anzahlungsstand: () => anzahlungsstand(ab),
    "offene-posten": () => offenePosten(re, heute),
    nummernluecken: () => nummernluecken([...re, ...gs]),
    vertrieb: () => vertrieb(an, ab),
    projektkosten: () => projektkosten(er),
  };
  const ergebnis = await ladeBericht(async () => (RECHNER[report] ? RECHNER[report]() : []));
  const diagramme =
    report === "uebersicht" ? (
      <>
        <Balken className="md:col-span-8" titel="Umsatz je Monat" untertitel="netto, ohne Anzahlungsrechnungen, abzüglich Gutschriften" punkte={umsatz} format="cent-rund" hervorheben={umsatz.length - 2} laufend="letzter" />
        <Donut className="md:col-span-4" titel="Angebote nach Status" teile={zaehleNach(an, "status", STATUS_WERTE["PH Angebot"]).map((t) => ({ ...t, label: wertLabel(t.label) }))} />
        <Donut className="md:col-span-4" titel="Mahnungen nach Stufe" teile={zaehleNach(ma.map((m) => ({ s: `Stufe ${m.stufe}` })), "s")} />
        <Donut className="md:col-span-4" titel="Eingangsrechnungen nach Status" teile={zaehleNach(er, "status", STATUS_WERTE["PH Eingangsrechnung"]).map((t) => ({ ...t, label: wertLabel(t.label) }))} />
        <Donut className="md:col-span-4" titel="Kostenzuordnung" teile={zaehleNach(er.filter((e) => e.status !== "Abgelehnt"), "zuordnung_status").map((t) => ({ ...t, label: t.label === "Vollstaendig" ? "Vollständig" : t.label }))} />
      </>
    ) : null;
  const nav = <Segment label="Berichte" aktiv={report} optionen={BERICHTE.map((b) => ({ wert: b.id, titel: b.titel, href: `/faktura/berichte/${b.id}` }))} />;
  return (
    <FakturaSeite ctx={ctx} titel={def.titel} ohneKopf>
      {report === "kassa-abgleich" && <Hinweis ton="info" className="mb-4">Der Abgleich Kassa ↔ Faktura folgt mit dem Backend-Report „Abgleich Kassa ↔ Faktura“ (P-02). Bis dahin zeigt die Liste keine Werte.</Hinweis>}
      <BerichtSeite
        bericht={`faktura-${report}`}
        bereich="faktura"
        titel={def.titel}
        untertitel={def.text}
        krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Berichte", href: "/faktura/berichte/uebersicht" }]}
        unternav={<div className="bo-scroll-x overflow-x-auto">{nav}</div>}
        filter={{ basis: `/faktura/berichte/${report}`, params: Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, String(v)])), zeitraum: false }}
        ergebnis={ergebnis}
        spalten={SPALTEN[report] || []}
        diagramme={diagramme}
        darfExport={rolle.darfCsv}
      />
    </FakturaSeite>
  );
}
