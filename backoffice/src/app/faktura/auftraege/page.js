import { fakturaKontext, alleVoll } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { AUFTRAG_REITER, AUFTRAG_SPALTEN, auftragZeile } from "@/lib/backoffice/faktura/zeilen";
import { STATUS_WERTE } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, wertLabel } from "@/lib/backoffice/faktura/texte";
import { cent } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";

export const metadata = { title: "Aufträge · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/auftraege (T2) – 10-konzept-faktura § 3.3. Zeilen-Primäraktion je Zustand.
export default async function Auftraege({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/auftraege");
  const { client, rolle, heute } = ctx;
  const daten = await alleVoll(client, "PH Auftragsbestaetigung");
  const m = listenModell({ daten, reiter: REITER.auftraege, regeln: AUFTRAG_REITER, params, standard: "laufend", rolle, extra: { heute }, zeile: (a) => auftragZeile(a, { heute, rolle }), suchFelder: (a) => [a.name, a.titel, a.kunde_name, a.projekt, a.offen_cent, a.auftragswert_cent], sortFeld: "datum", richtung: "desc" });
  const wert = m.alleGefiltert.reduce((s, a) => s + (Number(a.auftragswert_cent) || 0), 0);
  const offen = m.alleGefiltert.reduce((s, a) => s + (Number(a.offen_cent) || 0), 0);
  return (
    <FakturaSeite ctx={ctx} titel="Aufträge">
      <FakturaListe
        liste="auftraege"
        spalten={AUFTRAG_SPALTEN}
        zeilen={m.zeilen}
        reiter={m.reiter}
        aktiverReiter={m.aktiv}
        basis="/faktura/auftraege"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        summe={`${m.gesamt} Aufträge · Auftragswert ${cent(wert)} · Offen ${cent(offen)}`}
        statusOptionen={STATUS_WERTE["PH Auftragsbestaetigung"].map((s) => ({ wert: s, text: wertLabel(s) }))}
        darfCsv={rolle.darfCsv}
        leer={{ titel: LEER.auftraege.titel, text: LEER.auftraege.text, aktion: { titel: LEER.auftraege.aktion, href: "/faktura/angebote" } }}
        testid="auftraege-liste"
      />
      {m.aktiv === "lieferbereit" && <p className="mt-3 text-[13px] text-bo-text-soft">Lieferbereit: {REITER.auftraege.find((r) => r.id === "lieferbereit").hinweis}</p>}
    </FakturaSeite>
  );
}
