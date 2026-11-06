// Berichte Service (T8, 10-konzept-service §2.12): fünf Berichte, Zeitraum in der URL, CSV nur mit Export-Recht.
// Kostenberichte netto; keine Auswertung je Techniker (R-13).
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { serviceClient } from "@/lib/backoffice/service/daten";
import { BERICHTE, SPALTEN, berichtZeilen } from "@/lib/backoffice/service/berichte";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import BerichtSeite, { ladeBericht } from "@/components/Backoffice/Bericht/BerichtSeite";
import Segment from "@/components/Backoffice/Segment";
import { Balken, Donut } from "@/components/Backoffice/Charts";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { report } = await params;
  return { title: `${BERICHTE[report]?.titel || "Bericht"} · Service` };
}

export default async function Bericht({ params, searchParams }) {
  const { report } = await params;
  if (!BERICHTE[report]) notFound();
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const session = await requireRecht("service", "report", `/service/berichte/${report}`);
  const client = serviceClient(session);
  const p = { von: sp.von || "", bis: sp.bis || "", tage: sp.tage || "365" };
  const ergebnis = await ladeBericht(() => berichtZeilen(client, report, p));
  const zeilen = ergebnis.zeilen || [];
  const diagramme =
    report === "quote" ? (
      <Balken className="md:col-span-12" titel="Fälle je Marke" punkte={zeilen.slice(0, 10).map((z) => ({ label: z.gruppe, wert: z.faelle }))} einblenden />
    ) : report === "regress" ? (
      <Donut className="md:col-span-12" titel="Regress nach Status" teile={Object.entries(zeilen.reduce((a, z) => ((a[z.status] = (a[z.status] || 0) + 1), a), {})).map(([label, wert]) => ({ label, wert }))} einblenden />
    ) : report === "kosten" ? (
      <Balken className="md:col-span-12" titel="Kosten nach Regress je Monat" punkte={zeilen.map((z) => ({ label: z.monat.slice(5), wert: z.nach_regress }))} format="cent-rund" einblenden />
    ) : report === "fehlercodes" ? (
      <Balken className="md:col-span-12" titel="Fälle je Fehlercode" punkte={zeilen.slice(0, 12).map((z) => ({ label: z.code, wert: z.faelle }))} einblenden />
    ) : null;
  return (
    <Shell session={session}>
      <BerichtSeite
        bericht={`service-${report}`}
        bereich="service"
        titel={BERICHTE[report].titel}
        untertitel={BERICHTE[report].netto ? `${T.berichte.netto} ${T.berichte.keineTechniker}` : T.berichte.keineTechniker}
        krumen={[{ titel: "Service", href: "/service" }, { titel: T.berichte.titel }, { titel: BERICHTE[report].titel }]}
        unternav={<Segment label="Bericht" aktiv={report} groesse="s" optionen={Object.entries(T.berichte.liste).map(([k, t]) => ({ wert: k, titel: t, href: `/service/berichte/${k}` }))} />}
        filter={{ basis: `/service/berichte/${report}`, params: sp, zeitraum: report !== "fristen", felder: report === "fristen" ? [{ name: "tage", label: "Gewährleistung endet in", optionen: [{ wert: "60", titel: "60 Tagen" }, { wert: "180", titel: "180 Tagen" }, { wert: "365", titel: "365 Tagen" }, { wert: "9999", titel: "allen" }] }] : [] }}
        ergebnis={ergebnis}
        spalten={SPALTEN[report]}
        diagramme={diagramme}
        darfExport={darf(session, "service", "export")}
      />
    </Shell>
  );
}
