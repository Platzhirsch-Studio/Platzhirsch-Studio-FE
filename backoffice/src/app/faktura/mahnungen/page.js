import { fakturaKontext, alle, mahnbare } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { MAHNUNG_REITER, MAHNUNG_SPALTEN, mahnungZeile } from "@/lib/backoffice/faktura/zeilen";
import { STATUS_WERTE } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, wertLabel } from "@/lib/backoffice/faktura/texte";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";

export const metadata = { title: "Mahnungen · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/mahnungen (T2) – § 3.11; Reiter „Entwürfe aus Mahnlauf“, Gebühr/Zinsen nur mit Schalter mahnspesen.
export default async function Mahnungen({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/mahnungen");
  const { client, rolle, heute } = ctx;
  const [daten, mahn] = await Promise.all([alle(client, "PH Mahnung"), mahnbare(client, heute)]);
  const m = listenModell({ daten, reiter: REITER.mahnungen, regeln: MAHNUNG_REITER, params, standard: "offen", rolle, zaehlerFuer: ["entwuerfe"], zeile: (x) => mahnungZeile(x, { rolle }), suchFelder: (x) => [x.name, x.kunde_name, x.rechnung], sortFeld: "datum", richtung: "desc" });
  return (
    <FakturaSeite ctx={ctx} titel="Mahnungen" mahnvorschlag={mahn} aktionen={rolle.schreibt ? <KopfAktion art="mahnen" anzahl={mahn.filter((r) => r.waehlbar).length} /> : null}>
      <FakturaListe
        liste="mahnungen"
        spalten={MAHNUNG_SPALTEN}
        zeilen={m.zeilen}
        reiter={m.reiter}
        aktiverReiter={m.aktiv}
        basis="/faktura/mahnungen"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        statusOptionen={STATUS_WERTE["PH Mahnung"].map((s) => ({ wert: s, text: wertLabel(s) }))}
        massen={rolle.schreibt ? [{ id: "ma-erledigt", titel: "Erledigt" }] : []}
        darfCsv={rolle.darfCsv}
        leer={{ titel: LEER.mahnungen.titel, text: LEER.mahnungen.text }}
        testid="mahnungen-liste"
      />
    </FakturaSeite>
  );
}
