// /marketing/zielgruppen – Zielgruppen (10-konzept-marketing § 2.5, T2, unter „Mehr“): Titel, Zweck, Regeln als Satz,
// Treffer · anschreibbar (Stand), Status.
import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { marketingKontext, segmenteListe } from "@/lib/backoffice/marketing/daten";
import { kurzDatum, segmentSatz } from "@/lib/backoffice/marketing/regeln";
import { KRITERIUM_TEXT, OPERATOR_TEXT, ZIELGRUPPEN, ZWECK_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Zielgruppen") };

export default async function ZielgruppenSeite() {
  const ctx = await marketingKontext({ pfad: "/marketing/zielgruppen", doctype: "PH Segment" });
  const liste = await segmenteListe(ctx.client);
  return (
    <Rahmen ctx={ctx}>
      <Seitenkopf titel={ZIELGRUPPEN.titel} untertitel={ZIELGRUPPEN.untertitel} krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: ZIELGRUPPEN.titel }]} aktionen={ctx.team ? <Knopf variant="primary" icon="Plus" href="/marketing/zielgruppen/neu" data-testid="zielgruppe-neu">{ZIELGRUPPEN.neu}</Knopf> : null} />
      {liste.length === 0 ? (
        <Leer titel="Noch keine Zielgruppe" text={ZIELGRUPPEN.leer} aktion={ctx.team ? <Knopf variant="primary" href="/marketing/zielgruppen/neu">{ZIELGRUPPEN.neu}</Knopf> : undefined} />
      ) : (
        <ListeKachel label={ZIELGRUPPEN.titel} testid="zielgruppen-liste">
          <div className="bo-mar-tabelle-huelle overflow-x-auto">
            <table className="bo-mar-tabelle">
              <thead>
                <tr>
                  <th scope="col">{ZIELGRUPPEN.spalten.titel}</th>
                  <th scope="col">{ZIELGRUPPEN.spalten.zweck}</th>
                  <th scope="col">{ZIELGRUPPEN.spalten.regeln}</th>
                  <th scope="col" className="r">{ZIELGRUPPEN.spalten.treffer}</th>
                  <th scope="col">{ZIELGRUPPEN.spalten.status}</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((s) => (
                  <tr key={s.name} data-gedimmt={s.status === "Archiviert" ? "true" : undefined}>
                    <td>
                      <Link href={`/marketing/zielgruppen/${encodeURIComponent(s.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{s.titel}</Link>
                      {s.beschreibung && <p className="bo-mar-unter line-clamp-1">{s.beschreibung}</p>}
                    </td>
                    <td>{ZWECK_TEXT[s.zweck] || s.zweck}</td>
                    <td className="bo-mar-unter max-w-[360px]">{segmentSatz(s.regeln || [], s.verknuepfung, { kriterium: KRITERIUM_TEXT, operator: OPERATOR_TEXT }) || "–"}</td>
                    <td className="r bo-mar-zahl">{s.vorschau_am ? <span title={`Stand ${kurzDatum(s.vorschau_am, { zeit: true })}`}>{s.vorschau_treffer ?? 0} · {s.vorschau_empfaenger ?? 0} anschreibbar</span> : "–"}</td>
                    <td><Status gruppe="segment" wert={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="bo-mar-karten">
            {liste.map((s) => (
              <li key={s.name} className="bo-mar-karte-zeile">
                <div className="min-w-0 flex-1">
                  <Link href={`/marketing/zielgruppen/${encodeURIComponent(s.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{s.titel}</Link>
                  <p className="bo-mar-klein">{ZWECK_TEXT[s.zweck]}</p>
                </div>
                <Status gruppe="segment" wert={s.status} />
              </li>
            ))}
          </ul>
        </ListeKachel>
      )}
    </Rahmen>
  );
}
