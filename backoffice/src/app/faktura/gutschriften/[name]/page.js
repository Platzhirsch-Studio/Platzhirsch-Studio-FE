import { notFound } from "next/navigation";
import { fakturaKontext, ladeBeleg, kontaktVon } from "@/lib/backoffice/faktura/daten";
import { summenblock } from "@/lib/backoffice/faktura/betraege";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { stellDaten } from "@/lib/backoffice/faktura/zeilen";
import { AKTE, AKTION, GUTSCHRIFT, KASSA, wertLabel } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import Kachel from "@/components/Backoffice/Kachel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import EinfacheAkte from "@/components/Backoffice/Faktura/EinfacheAkte";
import { Summenblock, PositionenLesend } from "@/components/Backoffice/Faktura/Bausteine";
import { PositionenEditor } from "@/components/Backoffice/Faktura/AkteTeile";
import { Fakten, Hinweis } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gutschrift · Faktura" };

// Gutschrift (T5, § 4.4/§ 5.8): Entwurf → „Gutschrift stellen“ (Stellen-Dialog), Gestellt + Rückzahlung → „Erstatten“.
// Drucktitel „Rechnungskorrektur“ bis zur StB-Entscheidung (E13); Bar-Erstattung nur als Hinweis zur Kassa (R-02).
export default async function GutschriftAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/gutschriften/${roh}`);
  const { client, rolle } = ctx;
  const beleg = await ladeBeleg(client, "PH Gutschrift", name, rolle);
  if (!beleg) notFound();
  const { doc: g, docinfo } = beleg;
  const kontakt = await kontaktVon(client, g.kontakt);
  const entwurf = Number(g.docstatus) === 0;
  const rueck = /R(ü|ue)ckzahlung/.test(g.erstattung_art || "") && !entwurf && (Number(g.erstattet_cent) || 0) < (Number(g.brutto_cent) || 0);
  const tabs = AKTE.tabs.gutschrift;
  const tab = aktiverTab(tabs, sp?.tab);
  const ziel = { name: g.name, doctype: "PH Gutschrift", titel: g.kunde_name, daten: { ...stellDaten({ ...g, doctype: "PH Gutschrift" }, kontakt.email || ""), rest_cent: (Number(g.brutto_cent) || 0) - (Number(g.erstattet_cent) || 0) } };
  const primaer = !rolle.schreibt ? null : entwurf ? { id: "gs-stellen", titel: AKTION.gutschriftStellen } : rueck && rolle.leitung ? { id: "erstatten", titel: AKTION.erstatten } : null;
  const menue = rolle.schreibt ? [!entwurf ? { id: "senden", titel: AKTION.senden, icon: "Mail" } : null, { id: "pdf", titel: AKTION.pdf, icon: "FileText", href: `/druck/ph-gutschrift/${encodeURIComponent(g.name)}` }, g.rechnung ? { id: "rechnung", titel: `Rechnung ${g.rechnung}`, icon: "Receipt", href: `/faktura/rechnungen/${encodeURIComponent(g.rechnung)}` } : null].filter(Boolean) : [];
  return (
    <FakturaSeite ctx={ctx} titel={g.name} ohneKopf>
      <EinfacheAkte
        testid="gutschrift-akte"
        zurueck={{ href: "/faktura/gutschriften", titel: "Gutschriften" }}
        krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Gutschriften", href: "/faktura/gutschriften" }, { titel: g.name }]}
        titel={entwurf ? `Gutschrift-Entwurf zu ${g.rechnung}` : GUTSCHRIFT.titel(g.rechnung)}
        nummer={`${entwurf ? "Entwurf" : g.name} · ${g.art} · ${g.kunde_name || "–"} · Drucktitel „${GUTSCHRIFT.drucktitel}“`}
        status={{ ...statusAnzeige("PH Gutschrift", g.status), gebucht: !entwurf }}
        betrag={{ cent: g.brutto_cent, unter: g.erstattet_cent ? `erstattet ${cent(g.erstattet_cent)}` : undefined }}
        ziel={ziel}
        primaer={primaer}
        menue={menue}
        rolle={rolle}
        band={entwurf ? { ton: "info", titel: "Entwurf – noch keine Rechnungskorrektur" } : rueck ? { ton: "warnung", titel: GUTSCHRIFT.rueckzahlung } : null}
        tabs={tabs}
        tab={tab}
        basis={`/faktura/gutschriften/${encodeURIComponent(g.name)}`}
        params={sp}
        details={[{ label: "Rechnung", wert: g.rechnung }, { label: "Art", wert: g.art }, { label: "Erstattung", wert: wertLabel(g.erstattung_art) }, { label: "Grund", wert: g.grund || null }, { label: "Datum", wert: datum(g.datum) }]}
        docinfo={docinfo}
        doctype="PH Gutschrift"
        name={g.name}
        kinder={
          tab === "uebersicht" ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
              <Kachel titel="Beträge">
                <Summenblock s={{ ...summenblock({ ...g, docstatus: 0 }), offen: (Number(g.brutto_cent) || 0) - (Number(g.erstattet_cent) || 0) }} zahlbalken={false} />
              </Kachel>
              <Kachel titel="Erstattung">
                <Fakten eintraege={[{ label: "Weg", wert: wertLabel(g.erstattung_art) }, { label: "Erstattet", wert: cent(g.erstattet_cent || 0) }]} />
                <Hinweis ton="info" className="mt-3">{KASSA.barErstattung}</Hinweis>
              </Kachel>
            </div>
          ) : tab === "positionen" ? (
            <Kachel titel="Positionen">{entwurf && rolle.schreibt && g.art !== "Storno" ? <PositionenEditor doctype="PH Gutschrift" name={g.name} positionen={g.positionen || []} modified={g.modified} /> : <PositionenLesend positionen={g.positionen || []} />}</Kachel>
          ) : (
            <Kachel titel="Steuer & Texte">
              <Fakten eintraege={[{ label: "Steuerfall", wert: wertLabel(g.ust_fall) || "Inland" }, { label: "Bezug", wert: g.art === "Storno" ? GUTSCHRIFT.stornoZu(g.rechnung) : GUTSCHRIFT.korrekturZu(g.rechnung) }, { label: "Währung", wert: "EUR" }]} />
            </Kachel>
          )
        }
      />
    </FakturaSeite>
  );
}
