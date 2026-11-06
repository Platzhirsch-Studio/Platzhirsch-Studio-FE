// /marketing/berichte/[report] – sechs Berichte (10-konzept-marketing § 2.13, T8): Tabelle ohne Paging, Balken, Druck.
// Kampagnen-ROI (Leitung/GF): bis P1-10 Hinweis „nur Richtwert“ und ohne ROI-Spalte (keine irreführende Kennzahl).
import { notFound, redirect } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import { Balken as ChartBalken } from "@/components/Backoffice/Charts";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { bericht, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { BERICHTE, STATUS_TEXT, ZWECK_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { cent, zahl } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Berichte") };

function zelle(spalte, wert) {
  if (wert === null || wert === undefined || wert === "") return "–";
  if (spalte.fieldtype === "Currency") return cent(wert);
  if (spalte.fieldtype === "Int") return zahl(wert);
  if (spalte.fieldtype === "Percent") return `${wert} %`;
  if (spalte.fieldname === "zweck") return ZWECK_TEXT[wert] || wert;
  if (spalte.fieldname === "status") return STATUS_TEXT.social[wert] || wert;
  return String(wert);
}

export default async function BerichtSeite({ params }) {
  const { report } = await params;
  const def = BERICHTE.liste[report];
  if (!def) notFound();
  const ctx = await marketingKontext({ pfad: `/marketing/berichte/${report}`, doctype: "PH Newsletter Ausgabe" });
  if (def.leitung && !ctx.leitung && !ctx.session.roles?.includes("PH Geschäftsführung")) redirect("/kein-zugriff?bereich=marketing&aktion=bericht");
  const r = await bericht(ctx.client, report).catch(() => null);
  const zahlSpalte = r?.spalten.find((s) => ["Int", "Currency"].includes(s.fieldtype));
  return (
    <Rahmen ctx={ctx} band={report === "kampagnen-roi" && !ctx.an.roiNetto ? { ton: "info", inhalt: BERICHTE.roiHinweis } : null}>
      <Seitenkopf titel={def.titel} krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: BERICHTE.titel }, { titel: def.titel }]} unternav={<StatusChips label={BERICHTE.waehlen} aktiv={report} optionen={Object.entries(BERICHTE.liste).filter(([, d]) => !d.leitung || ctx.leitung).map(([k, d]) => ({ wert: k, titel: d.titel, href: `/marketing/berichte/${k}` }))} />} />
      {!r ? (
        <Leer art="leer" titel="Bericht nicht geladen" text="Bitte später erneut öffnen." />
      ) : r.zeilen.length === 0 ? (
        <Leer text={BERICHTE.keineDaten} />
      ) : (
        <div className="flex flex-col gap-(--bo-bento-gap)">
          {zahlSpalte && r.zeilen.length <= 24 && <ChartBalken titel={zahlSpalte.label} punkte={r.zeilen.map((z) => ({ label: zelle(r.spalten[0], z[r.spalten[0].fieldname]), wert: Number(z[zahlSpalte.fieldname] || 0) / (zahlSpalte.fieldtype === "Currency" ? 100 : 1) }))} hoehe={180} />}
          <ListeKachel label={def.titel} testid="bericht-tabelle" fuss={report === "kampagnen-roi" ? <span>{BERICHTE.roiFuss}</span> : null}>
            <div className="overflow-x-auto">
              <table className="bo-mar-tabelle">
                <thead><tr>{r.spalten.map((s) => <th key={s.fieldname} scope="col" className={["Int", "Currency", "Percent"].includes(s.fieldtype) ? "r" : ""}>{s.label}</th>)}</tr></thead>
                <tbody>{r.zeilen.map((z, i) => <tr key={i}>{r.spalten.map((s) => <td key={s.fieldname} className={["Int", "Currency", "Percent"].includes(s.fieldtype) ? "r bo-mar-zahl" : ""}>{zelle(s, z[s.fieldname])}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </ListeKachel>
        </div>
      )}
    </Rahmen>
  );
}
