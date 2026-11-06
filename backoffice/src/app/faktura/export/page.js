import { redirect } from "next/navigation";
import { fakturaKontext, alle, einstellungen } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { EXPORT_SPALTEN, exportZeile } from "@/lib/backoffice/faktura/zeilen";
import { vormonat, monatsEnde, monatName } from "@/lib/backoffice/faktura/regeln";
import { LEER, EXPORT } from "@/lib/backoffice/faktura/texte";
import { datum } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";

export const metadata = { title: "Export an Kanzlei · Faktura" };
export const dynamic = "force-dynamic";

/** Automatische Prüfung vor dem Export (§ 5.15): Entwürfe, Leistungsdatum ohne Quelle, Kontenfelder, DATEV-Nummern. */
function pruefliste(rechnungen, fe, von, bis) {
  const im = (r) => r.datum >= von && r.datum <= bis;
  const out = [];
  const entw = rechnungen.filter((r) => Number(r.docstatus) === 0 && im(r));
  if (entw.length) out.push({ id: "entwuerfe", schwere: "orange", text: `${entw.length} Rechnungsentwürfe im Zeitraum`, href: "/faktura/rechnungen?r=entwuerfe" });
  const ohne = rechnungen.filter((r) => Number(r.docstatus) === 1 && im(r) && r.art !== "Anzahlungsrechnung" && !r.leistungsdatum);
  if (ohne.length) out.push({ id: "leistung", schwere: "orange", text: `${ohne.length} Rechnungen ohne Leistungsdatum`, href: "/faktura/rechnungen?r=alle" });
  if (!fe.erloeskonto_20) out.push({ id: "konten", schwere: "orange", text: "Erlöskonto 20 % nicht hinterlegt – mit Kanzlei abstimmen", href: "/faktura/stammdaten?tab=einstellungen" });
  if (fe.export_format_standard === "DATEV Buchungsstapel" && (!fe.berater_nr || !fe.mandanten_nr)) out.push({ id: "datev", schwere: "rot", text: "Berater- und Mandantennummer für DATEV fehlen", href: "/faktura/stammdaten?tab=einstellungen" });
  return out;
}

// /faktura/export (T2 + Export-Sheet § 5.15). StB-Rolle startet hier, lesend + herunterladen.
export default async function Export({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/export");
  const { client, rolle, heute } = ctx;
  if (!rolle.export) redirect("/kein-zugriff?bereich=faktura&aktion=export");
  const [laeufe, rechnungen, fe] = await Promise.all([alle(client, "PH Export Lauf"), alle(client, "PH Rechnung"), einstellungen(client)]);
  const vm = vormonat(heute);
  const von = `${vm}-01`;
  const bis = monatsEnde(vm);
  const nichtExportiert = rechnungen.filter((r) => Number(r.docstatus) === 1 && r.export_status !== "exportiert");
  const imZeitraum = nichtExportiert.filter((r) => r.datum >= von && r.datum <= bis);
  const letzter = [...laeufe].filter((l) => l.status !== "Entwurf").sort((a, b) => String(b.zeitraum_bis).localeCompare(String(a.zeitraum_bis)))[0];
  const m = listenModell({ daten: laeufe, reiter: [], regeln: {}, params, standard: "alle", rolle, zeile: (x) => exportZeile(x, { rolle }), suchFelder: (x) => [x.name, x.format, x.titel], datumFeld: "zeitraum_von", sortFeld: "zeitraum_von", richtung: "desc" });
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Export an Kanzlei"
      untertitel={EXPORT.kopf(nichtExportiert.length, datum(heute), letzter?.name || "–", letzter ? monatName(letzter.zeitraum_von, false) : "", letzter?.bestaetigt_von_kanzlei_am ? datum(letzter.bestaetigt_von_kanzlei_am) : null)}
      aktionen={rolle.leitung ? <KopfAktion art="export" primaer daten={{ vorschlag: { von, bis, anzahl: imZeitraum.length, summe_cent: imZeitraum.reduce((s, r) => s + (Number(r.brutto_cent) || 0), 0) }, pruefung: pruefliste(rechnungen, fe, von, bis), format: fe.export_format_standard || "BMD CSV" }} /> : null}
    >
      <FakturaListe
        liste="export"
        spalten={EXPORT_SPALTEN}
        zeilen={m.zeilen}
        basis="/faktura/export"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        ohneZeitraum
        leer={laeufe.length && !nichtExportiert.length ? { art: "erledigt", titel: LEER.exportErledigt } : { titel: LEER.export.titel, text: LEER.export.text, aktion: rolle.leitung ? { titel: LEER.export.aktion, href: "/faktura/export?panel=export" } : null }}
        testid="export-liste"
      />
    </FakturaSeite>
  );
}
