import { notFound } from "next/navigation";
import Link from "next/link";
import { fakturaKontext, ladeBeleg } from "@/lib/backoffice/faktura/daten";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { exportZeile } from "@/lib/backoffice/faktura/zeilen";
import { AKTE, AKTION, wertLabel } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import Kachel from "@/components/Backoffice/Kachel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import EinfacheAkte from "@/components/Backoffice/Faktura/EinfacheAkte";
import { Fakten } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Export-Lauf · Faktura" };

const HREF = { "PH Rechnung": "rechnungen", "PH Gutschrift": "gutschriften", "PH Eingangsrechnung": "eingangsrechnungen" };

// Export-Lauf (T5, § 4.4): Entwurf → „Erzeugen“, Erzeugt → „Als übergeben“ (+ Verwerfen), Übergeben → „Von Kanzlei
// bestätigt“. Jede Protokollzeile öffnet den Beleg (auch für die StB).
export default async function ExportAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/export/${roh}`);
  const { client, rolle } = ctx;
  const beleg = await ladeBeleg(client, "PH Export Lauf", name, rolle);
  if (!beleg) notFound();
  const { doc: x, docinfo } = beleg;
  const z = exportZeile(x, { rolle });
  const tabs = AKTE.tabs.export.map((t) => ({ ...t, anzahl: t.id === "belege" ? (x.belege || []).length : undefined }));
  const tab = aktiverTab(tabs, sp?.tab);
  return (
    <FakturaSeite ctx={ctx} titel={x.name} ohneKopf>
      <EinfacheAkte
        testid="export-akte"
        zurueck={{ href: "/faktura/export", titel: "Export" }}
        krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Export an Kanzlei", href: "/faktura/export" }, { titel: x.name }]}
        titel={x.titel || x.name}
        nummer={`${x.name} · ${wertLabel(x.format)} · ${datum(x.zeitraum_von)}–${datum(x.zeitraum_bis)}`}
        status={statusAnzeige("PH Export Lauf", x.status)}
        betrag={{ cent: x.summe_brutto_cent, unter: `${x.anzahl || 0} Belege` }}
        ziel={{ name: x.name, doctype: "PH Export Lauf", daten: z.daten }}
        primaer={z.aktion}
        menue={rolle.leitung && x.status === "Erzeugt" ? [{ id: "ex-verwerfen", titel: AKTION.verwerfen, icon: "Undo2", gefaehrlich: true }] : []}
        rolle={rolle}
        band={["Uebergeben", "Bestaetigt"].includes(x.status) ? { ton: "info", titel: "Übergebene Läufe lassen sich nicht löschen." } : null}
        tabs={tabs}
        tab={tab}
        basis={`/faktura/export/${encodeURIComponent(x.name)}`}
        params={sp}
        details={[{ label: "Format", wert: wertLabel(x.format) }, { label: "Erzeugt", wert: x.erzeugt_am ? datum(x.erzeugt_am) : "–" }, { label: "Übergeben an", wert: x.uebergeben_an || "–" }, { label: "Bestätigt", wert: x.bestaetigt_von_kanzlei_am ? datum(x.bestaetigt_von_kanzlei_am) : "–" }]}
        docinfo={docinfo}
        doctype="PH Export Lauf"
        name={x.name}
        kinder={
          tab === "uebersicht" ? (
            <Kachel titel="Übersicht">
              <Fakten eintraege={[{ label: "Belege", wert: String(x.anzahl || 0) }, { label: "Summe brutto", wert: cent(x.summe_brutto_cent) }, { label: "Fälschungsschutz", wert: x.pruefsumme_gesamt || "–" }, { label: "Datei", wert: x.datei ? String(x.datei).split("/").pop() : "–" }]} />
            </Kachel>
          ) : (
            <Kachel titel="Belege (Übergabeprotokoll)">
              {(x.belege || []).length === 0 ? (
                <p className="text-[14px] text-bo-text-soft">Noch keine Belege – der Lauf ist nicht erzeugt.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-[14px]" data-testid="export-belege">
                  {x.belege.map((b) => (
                    <li key={b.beleg} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-bo-zeile px-3 py-2 hover:bg-bo-fill">
                      <Link className="hover:underline" href={HREF[b.beleg_doctype] ? `/faktura/${HREF[b.beleg_doctype]}/${encodeURIComponent(b.beleg)}` : "#"}>
                        {b.nummer} · {b.kontakt_name} · {datum(b.datum)}
                      </Link>
                      <span className="tabular-nums">{cent(b.brutto_cent)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          )
        }
      />
    </FakturaSeite>
  );
}
