import { notFound } from "next/navigation";
import { fakturaKontext, ladeBeleg, kontaktVon } from "@/lib/backoffice/faktura/daten";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { AKTE, AKTION, MAHNEN } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import Kachel from "@/components/Backoffice/Kachel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import EinfacheAkte from "@/components/Backoffice/Faktura/EinfacheAkte";
import { Fakten } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mahnung · Faktura" };

// Mahnung (T5, § 4.4): Entwurf → „Senden“ (Post: „Drucken und als gesendet markieren“), Gesendet → „Erledigt“
// (verzögerter Commit), Stornieren nur im Entwurf. Gebühr/Zinsen erst mit Schalter mahnspesen (E8, F-38).
export default async function MahnungAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/mahnungen/${roh}`);
  const { client, rolle, schalter } = ctx;
  const beleg = await ladeBeleg(client, "PH Mahnung", name, rolle);
  if (!beleg) notFound();
  const { doc: m, docinfo } = beleg;
  const kontakt = await kontaktVon(client, m.kontakt);
  const tabs = AKTE.tabs.mahnung;
  const tab = aktiverTab(tabs, sp?.tab);
  const ziel = { name: m.name, doctype: "PH Mahnung", titel: m.kunde_name, daten: { kanal: m.kanal, status: m.status, email: kontakt.email || "", kunde: m.kunde_name, zahlbar_cent: m.offen_cent, faellig: m.frist, art: "Mahnung" } };
  const primaer = !rolle.schreibt ? null : m.status === "Entwurf" ? { id: "ma-senden", titel: m.kanal === "Post" ? "Drucken und als gesendet markieren" : AKTION.senden } : m.status === "Gesendet" ? { id: "ma-erledigt", titel: AKTION.erledigt } : null;
  return (
    <FakturaSeite ctx={ctx} titel={m.name} ohneKopf>
      <EinfacheAkte
        testid="mahnung-akte"
        zurueck={{ href: "/faktura/mahnungen", titel: "Mahnungen" }}
        krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Mahnungen", href: "/faktura/mahnungen" }, { titel: m.name }]}
        titel={`Mahnung Stufe ${m.stufe}`}
        nummer={`${m.name} · ${m.rechnung} · ${m.kunde_name || "–"}`}
        status={statusAnzeige("PH Mahnung", m.status)}
        betrag={{ cent: schalter.mahnspesen ? m.gesamt_cent : m.offen_cent, unter: `Zahlung bis ${datum(m.frist)}` }}
        ziel={ziel}
        primaer={primaer}
        menue={rolle.schreibt ? [{ id: "pdf", titel: AKTION.pdf, icon: "FileText", href: `/druck/ph-mahnung/${encodeURIComponent(m.name)}` }, { id: "rechnung", titel: `Rechnung ${m.rechnung}`, icon: "Receipt", href: `/faktura/rechnungen/${encodeURIComponent(m.rechnung)}` }] : []}
        rolle={rolle}
        band={null}
        tabs={tabs}
        tab={tab}
        basis={`/faktura/mahnungen/${encodeURIComponent(m.name)}`}
        params={sp}
        details={[{ label: "Rechnung", wert: m.rechnung }, { label: "Kanal", wert: m.kanal }, { label: "Mahnlauf", wert: m.mahnlauf || null }, { label: "Gesendet", wert: m.gesendet_am ? datum(m.gesendet_am) : "–" }]}
        docinfo={docinfo}
        doctype="PH Mahnung"
        name={m.name}
        kinder={
          tab === "uebersicht" ? (
            <Kachel titel="Übersicht">
              <Fakten eintraege={[{ label: "Offen", wert: cent(m.offen_cent) }, { label: "Frist", wert: datum(m.frist) }, { label: "Verzugstage", wert: m.verzugstage ? String(m.verzugstage) : "–" }, ...(schalter.mahnspesen ? [{ label: "Gebühr", wert: cent(m.mahngebuehr_cent) }, { label: "Zinsen", wert: cent(m.verzugszinsen_cent) }, { label: "Gesamt", wert: cent(m.gesamt_cent) }] : [{ label: "Gebühr und Zinsen", wert: MAHNEN.ohneSpesen }])]} />
            </Kachel>
          ) : (
            <Kachel titel="Text">
              <p className="whitespace-pre-line text-[15px] leading-6">{m.text || "Text aus den Mahnwesen-Einstellungen (Stufe " + m.stufe + ")."}</p>
            </Kachel>
          )
        }
      />
    </FakturaSeite>
  );
}
