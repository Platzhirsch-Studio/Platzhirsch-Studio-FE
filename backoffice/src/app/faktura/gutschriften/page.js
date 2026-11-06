import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { GUTSCHRIFT_REITER, GUTSCHRIFT_SPALTEN, gutschriftZeile } from "@/lib/backoffice/faktura/zeilen";
import { STATUS_WERTE } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, wertLabel } from "@/lib/backoffice/faktura/texte";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";

export const metadata = { title: "Gutschriften · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/gutschriften (T2) – 10-konzept-faktura § 3.11.
export default async function Gutschriften({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/gutschriften");
  const { client, rolle } = ctx;
  const daten = await alle(client, "PH Gutschrift");
  const m = listenModell({ daten, reiter: REITER.gutschriften, regeln: GUTSCHRIFT_REITER, params, standard: "alle", rolle, zaehlerFuer: ["entwuerfe", "rueckzahlung"], zeile: (g) => gutschriftZeile(g, { rolle }), suchFelder: (g) => [g.name, g.kunde_name, g.rechnung, g.brutto_cent], sortFeld: "datum", richtung: "desc" });
  return (
    <FakturaSeite ctx={ctx} titel="Gutschriften">
      <FakturaListe
        liste="gutschriften"
        spalten={GUTSCHRIFT_SPALTEN}
        zeilen={m.zeilen}
        reiter={m.reiter}
        aktiverReiter={m.aktiv}
        basis="/faktura/gutschriften"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        statusOptionen={STATUS_WERTE["PH Gutschrift"].map((s) => ({ wert: s, text: wertLabel(s) }))}
        darfCsv={rolle.darfCsv}
        leer={{ titel: LEER.gutschriften.titel, text: LEER.gutschriften.text }}
        testid="gutschriften-liste"
      />
    </FakturaSeite>
  );
}
