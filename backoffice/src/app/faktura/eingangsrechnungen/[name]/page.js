import { notFound } from "next/navigation";
import { fakturaKontext, ladeBeleg, projektAuswahl, budgets } from "@/lib/backoffice/faktura/daten";
import { erZeile } from "@/lib/backoffice/faktura/zeilen";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { AKTE, AKTION, ER, KOSTEN, wertLabel } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { AkteGeruest, AkteKopf, AkteTabs, Band, RechteSpalte } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import Kostenzuordnung from "@/components/Backoffice/Faktura/Kostenzuordnung";
import { PositionenLesend } from "@/components/Backoffice/Faktura/Bausteine";
import { AkteAktionen } from "@/components/Backoffice/Faktura/AkteTeile";
import { Status, Signal, Fakten, Hinweis, FIcon } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Eingangsrechnungen · Faktura` };
}

// Eingangsrechnung (T5, § 4.4 + Kostenzuordnung): Erfasst → „Sachlich prüfen“, Sachlich geprüft → „Freigeben“
// (Leitung, verzögerter Commit, nur mit vollständiger Kostenzuordnung), Freigegeben → „Als bezahlt buchen“.
// Nach Export gesperrt (Banner), nach Freigabe nur „Umbuchen“ der Kosten.
export default async function ErAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/eingangsrechnungen/${roh}`);
  const { client, rolle, heute, stati } = ctx;
  const beleg = await ladeBeleg(client, "PH Eingangsrechnung", name, rolle);
  if (!beleg) notFound();
  const { doc: e, docinfo } = beleg;
  const projekte = await projektAuswahl(client);
  const bud = await budgets(client, [e.projekt, ...(e.zuordnung || []).map((z) => z.projekt)]);
  const z = erZeile(e, { heute, rolle });
  const st = statusAnzeige("PH Eingangsrechnung", e.status);
  const tabs = AKTE.tabs.er.map((t) => ({ ...t, anzahl: t.id === "kosten" && e.zuordnung_status === "Offen" ? "!" : undefined }));
  const tab = aktiverTab(tabs, sp?.tab);
  const exportiert = e.export_status === "exportiert";
  const ziel = { name: e.name, doctype: "PH Eingangsrechnung", titel: e.lieferant_name, daten: z.daten };
  const kostenOffen = e.zuordnung_status === "Offen";
  const primaer = !rolle.schreibt ? null : e.status === "Erfasst" ? { id: "er-pruefen", titel: AKTION.sachlichPruefen } : e.status === "Sachlich geprueft" && rolle.leitung ? (kostenOffen ? { id: "er-kosten", titel: "Kosten zuordnen", href: `/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}?tab=kosten` } : { id: "er-freigeben", titel: AKTION.freigeben }) : e.status === "Freigegeben" && rolle.leitung ? { id: "er-bezahlt", titel: AKTION.alsBezahlt } : null;
  const menue = rolle.schreibt
    ? [
        e.status === "Sachlich geprueft" ? { id: "er-freigeben", titel: AKTION.freigeben, icon: "BadgeCheck", ...(rolle.leitung ? (kostenOffen ? { deaktiviert: true, grund: ER.freigabeNurVollstaendig } : {}) : { deaktiviert: true, grund: "Nur Faktura-Leitung" }) } : null,
        e.status === "Freigegeben" ? { id: "zahllauf", titel: AKTION.zahllaufVormerken, icon: "Wallet" } : null,
        ["Erfasst", "Sachlich geprueft"].includes(e.status) ? { id: "er-ablehnen", titel: AKTION.ablehnen, icon: "CircleX", gefaehrlich: true, ...(exportiert ? { deaktiviert: true, grund: ER.exportiert(e.export_lauf) } : {}) } : null,
        e.herstellerbestellung ? { id: "hb", titel: `Herstellerbestellung ${e.herstellerbestellung}`, icon: "Package", href: `/d/ph-herstellerbestellung/${encodeURIComponent(e.herstellerbestellung)}` } : null,
        e.projekt ? { id: "projekt", titel: AKTION.projekt, icon: "FolderKanban", href: `/d/ph-projekt/${encodeURIComponent(e.projekt)}` } : null,
      ].filter(Boolean)
    : [];
  const band = e.status === "Abgelehnt" ? { ton: "gefahr", titel: `Abgelehnt · ${e.ablehnungsgrund || ""}` } : exportiert ? { ton: "info", titel: ER.exportiert(e.export_lauf) } : kostenOffen && e.status !== "Erfasst" ? { ton: "warnung", titel: ER.freigabeNurVollstaendig } : null;

  return (
    <FakturaSeite ctx={ctx} titel={e.name} ohneKopf>
      <AkteGeruest
        testid="er-akte"
        kopf={
          <AkteKopf
            zurueck={{ href: "/faktura/eingangsrechnungen", titel: "Eingangsrechnungen" }}
            krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Eingangsrechnungen", href: "/faktura/eingangsrechnungen" }, { titel: e.name }]}
            titel={e.lieferant_name || e.name}
            nummer={`${e.name} · Rechnung ${e.rechnungsnummer_lieferant || "–"}`}
            status={
              <span className="flex flex-wrap items-center gap-2">
                <Status status={st} />
                <Signal signal={z.signal} />
              </span>
            }
            betrag={{ cent: e.zahlbetrag_cent ?? e.brutto_cent, unter: e.skonto_cent ? `inkl. Skonto ${cent(e.skonto_cent)}` : `fällig ${datum(e.faellig)}` }}
            aktionen={<AkteAktionen ziel={ziel} primaer={primaer} menue={menue} rolle={rolle} leitungBitten={!rolle.leitung && e.status === "Sachlich geprueft" ? { aktion: "freigeben", aktionTitel: "Eingangsrechnung freigeben" } : null} />}
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} testid="er-band" />}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}`} params={sp || {}} />}
        rechts={<RechteSpalte details={<Fakten eintraege={[{ label: "Lieferant", wert: e.lieferant_name }, { label: "Projekt", wert: e.projekt || null }, { label: "Herstellerbestellung", wert: e.herstellerbestellung || null }, { label: "Auftrag", wert: e.auftrag || null }, { label: "Export", wert: e.export_lauf || null }]} />} />}
      >
        {tab === "uebersicht" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <Kachel titel="Beleg" titelId="h-beleg">
              {e.datei ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-bo-karte bg-bo-surface-2 p-6 text-center text-[14px] text-bo-text-soft" data-testid="er-pdf">
                  <FIcon name="FileText" className="size-8" />
                  <span className="font-medium text-bo-text">{String(e.datei).split("/").pop()}</span>
                  <span className="text-[12px]">PDF-Vorschau über die Ablage</span>
                </div>
              ) : (
                <p className="text-[14px] text-bo-text-soft">Kein PDF hinterlegt.</p>
              )}
            </Kachel>
            <Kachel titel="Beträge" titelId="h-b">
              <Fakten eintraege={[{ label: "Netto", wert: cent(e.netto_cent) }, { label: "USt", wert: cent(e.ust_cent) }, { label: "Brutto", wert: cent(e.brutto_cent) }, { label: "Skonto", wert: e.skonto_bis ? `${(Number(e.skonto_promille) || 0) / 10} % bis ${datum(e.skonto_bis)} (${cent(e.skonto_cent)})` : "–" }, { label: "Zahlbetrag", wert: cent(e.zahlbetrag_cent ?? e.brutto_cent) }, { label: "Steuerfall", wert: wertLabel(e.ust_fall) }, { label: "Kosten", wert: KOSTEN.status[e.zuordnung_status] || "Offen" }]} />
              {e.abweichung_zur_ab && <Hinweis ton="warnung" className="mt-3">{ER.abweichung(e.abweichung_zur_ab)}</Hinweis>}
            </Kachel>
          </div>
        )}
        {tab === "kosten" && (
          <Kachel titel={KOSTEN.titel} unter={KOSTEN.unter} titelId="h-kosten">
            <Kostenzuordnung er={e} projekte={projekte} budgets={bud} rolle={rolle} umbuchenFaehig={!!stati?.["faktura.umbuchen"]?.an || ctx.client.modus === "mock"} />
          </Kachel>
        )}
        {tab === "positionen" && (
          <Kachel titel="Positionen & Steuer" titelId="h-p">
            <PositionenLesend positionen={e.positionen || []} />
          </Kachel>
        )}
        {tab === "zahlung" && (
          <Kachel titel="Zahlung" titelId="h-z">
            <Fakten eintraege={[{ label: "IBAN", wert: e.iban_lieferant || "–" }, { label: "Referenz", wert: e.zahlungsreferenz || e.rechnungsnummer_lieferant }, { label: "Zahllauf", wert: e.zahllauf ? "vorgemerkt" : "–" }, { label: "Bezahlt", wert: e.bezahlt_am ? `${datum(e.bezahlt_am)} · ${cent(e.bezahlt_cent)}` : "–" }]} />
          </Kachel>
        )}
        {tab === "verlauf" && (
          <Kachel titel="Prüfung & Verlauf" titelId="h-v">
            <Fakten eintraege={[{ label: "Sachlich geprüft", wert: e.geprueft_am ? `${datumZeit(e.geprueft_am)} · ${String(e.geprueft_von || "").split("@")[0]}` : "–" }, { label: "Prüfvermerk", wert: e.pruefvermerk || null }, { label: "Freigegeben", wert: e.freigegeben_am ? `${datumZeit(e.freigegeben_am)} · ${String(e.freigegeben_von || "").split("@")[0]}` : "–" }]} />
            <div className="mt-4">
              <Zeitleiste doctype="PH Eingangsrechnung" name={e.name} docinfo={docinfo} darfSchreiben={rolle.schreibt} />
            </div>
          </Kachel>
        )}
      </AkteGeruest>
    </FakturaSeite>
  );
}
