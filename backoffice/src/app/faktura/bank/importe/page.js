import { redirect } from "next/navigation";
import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { paramsAus } from "@/lib/backoffice/faktura/listen";
import { datum } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";

export const metadata = { title: "Importe · Bank · Faktura" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { key: "datei", titel: "Kontoauszug", typ: "objekt" },
  { key: "zeitraum", titel: "Zeitraum", typ: "wort" },
  { key: "anzahl", titel: "Umsätze", typ: "zahl" },
  { key: "neu", titel: "Neu", typ: "zahl" },
  { key: "vorschlag", titel: "Mit Vorschlag", typ: "zahl" },
  { key: "status", titel: "Status", typ: "status" },
];

// /faktura/bank/importe (§ 3.5 „Mehr ▾ Importe“): Liste PH Bankimport.
export default async function Importe({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/bank/importe");
  if (!ctx.rolle.darfBank) redirect("/kein-zugriff?bereich=faktura&aktion=bank");
  const daten = await alle(ctx.client, "PH Bankimport");
  const zeilen = daten.map((i) => ({
    name: i.name,
    href: null,
    nummer: i.name,
    titel: i.titel || i.name,
    unter: i.konto || "",
    status: { wert: i.status, text: i.status, ton: i.status === "Importiert" ? "gruen" : i.status === "Fehler" ? "rot" : "blau" },
    signal: null,
    zellen: { zeitraum: `${datum(i.zeitraum_von)}–${datum(i.zeitraum_bis)}`, anzahl: String(i.anzahl ?? 0), neu: String(i.anzahl_neu ?? 0), vorschlag: String(i.anzahl_vorschlag ?? 0) },
    aktion: null,
    daten: {},
  }));
  return (
    <FakturaSeite ctx={ctx} titel="Importe" krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Bank", href: "/faktura/bank" }, { titel: "Importe" }]}>
      <FakturaListe liste="bankimporte" spalten={SPALTEN} zeilen={zeilen} basis="/faktura/bank/importe" params={params} gesamt={zeilen.length} ohneZeitraum leer={{ titel: "Noch kein Kontoauszug importiert", text: "Importe erscheinen hier nach dem ersten Kontoauszug." }} testid="importe-liste" />
    </FakturaSeite>
  );
}
