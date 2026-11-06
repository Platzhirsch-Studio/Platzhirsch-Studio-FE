import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { LEER, SPALTE } from "@/lib/backoffice/faktura/texte";
import { cent, datum } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KettePruefen from "@/components/Backoffice/Faktura/KettePruefen";

export const metadata = { title: "Journal · Faktura" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { key: "vorgang", titel: SPALTE.vorgang, typ: "objekt" },
  { key: "zeitpunkt", titel: SPALTE.zeitpunkt, typ: "wort" },
  { key: "betrag", titel: SPALTE.betrag, typ: "betrag" },
  { key: "benutzer", titel: SPALTE.benutzer, typ: "wort" },
  { key: "schutz", titel: SPALTE.schutz, typ: "wort" },
];

const HREF = { "PH Rechnung": "rechnungen", "PH Gutschrift": "gutschriften", "PH Mahnung": "mahnungen", "PH Eingangsrechnung": "eingangsrechnungen", "PH Export Lauf": "export" };

// /faktura/journal (T2 lesend, § 3.11): Buchungsjournal mit Fälschungsschutz (gekürzt, Tooltip voll).
export default async function Journal({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/journal");
  const { client, rolle } = ctx;
  const daten = await alle(client, "PH Buchungsjournal");
  const m = listenModell({
    daten,
    reiter: [],
    regeln: {},
    params,
    standard: "alle",
    rolle,
    datumFeld: "zeitpunkt",
    sortFeld: "zeitpunkt",
    richtung: "desc",
    suchFelder: (j) => [j.nummer, j.vorgang, j.benutzer, j.betrag_cent],
    zeile: (j) => ({
      name: j.name,
      href: HREF[j.beleg_doctype] ? `/faktura/${HREF[j.beleg_doctype]}/${encodeURIComponent(j.beleg)}` : null,
      nummer: j.nummer || j.beleg,
      titel: `${j.vorgang} · ${j.nummer || j.beleg}`,
      unter: j.details || "",
      status: null,
      signal: null,
      zellen: { zeitpunkt: datum(j.zeitpunkt), betrag: `${Number(j.betrag_cent) < 0 ? "−" : ""}${cent(Math.abs(Number(j.betrag_cent) || 0))}`, benutzer: String(j.benutzer || "").split("@")[0], schutz: j.pruefsumme ? `${String(j.pruefsumme).slice(0, 8)}…` : "–" },
      betrag_cent: Number(j.betrag_cent) || 0,
      aktion: null,
      daten: {},
    }),
  });
  return (
    <FakturaSeite ctx={ctx} titel="Journal" aktionen={rolle.leitung ? <KettePruefen /> : null}>
      <FakturaListe liste="journal" spalten={SPALTEN} zeilen={m.zeilen} basis="/faktura/journal" params={params} seite={m.seite} seiten={m.seiten} gesamt={m.gesamt} leer={{ titel: LEER.journal.titel, text: LEER.journal.text }} testid="journal-liste" />
    </FakturaSeite>
  );
}
