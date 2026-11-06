import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { Bento } from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { FaelligeLoeschen } from "@/components/Backoffice/Personal/Datenschutz";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeLoeschfristen, sicher } from "@/lib/backoffice/personal/daten";
import { istLeitung } from "@/lib/backoffice/personal/rollen";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { T } from "@/lib/backoffice/personal/texte";
import { kurzDatum, langDatum, relativTage } from "@/lib/backoffice/personal/zeit";
import "@/components/Backoffice/DataTable/datatable.css";
import "@/components/Backoffice/Personal/personal.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Löschfristen · Personal" };

// T2 Löschfristen-Cockpit (Konzept § 5.10, nur Leitung). Ansicht „Gelöscht“ ohne Personennamen.
export default async function Datenschutz({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/datenschutz", sp, istLeitung);
  const ansicht = ["offen", "aufbewahrung", "geloescht", "alle"].includes(sp.ansicht) ? sp.ansicht : "offen";
  const r = await sicher(() => ladeLoeschfristen(ctx, { ansicht }));
  const k = r.ok ? r.daten.kennzahlen : null;
  const faellig = r.ok ? r.daten.zeilen.filter((z) => z.info.zustand === "faellig" && !Number(z.pseudonymisiert)).map((z) => z.name) : [];
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf
        titel={T.datenschutz.titel}
        untertitel={T.datenschutz.unter}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.datenschutz.titel }]}
        aktionen={<FaelligeLoeschen namen={faellig} />}
        unternav={<Segment label="Ansicht" aktiv={ansicht} optionen={Object.entries(T.datenschutz.ansichten).map(([w, t]) => ({ wert: w, titel: t, href: `/personal/datenschutz${w === "offen" ? "" : `?ansicht=${w}`}` }))} />}
      />
      {!r.ok ? (
        <Fehler code={r.fehler.code} />
      ) : (
        <Bento>
          <Kennzahl className="md:col-span-3" titel={T.datenschutz.kennzahlen.faellig} wert={k.faellig} ton={k.faellig ? "cognac" : undefined} testid="per-ds-faellig" />
          <Kennzahl className="md:col-span-3" titel={T.datenschutz.kennzahlen.in14} wert={k.in14} />
          <Kennzahl className="md:col-span-3" titel={T.datenschutz.kennzahlen.aufbewahrung} wert={k.aufbewahrung} href="/personal/datenschutz?ansicht=aufbewahrung" />
          <Kennzahl className="md:col-span-3" titel={T.datenschutz.kennzahlen.geloescht} wert={k.geloescht} href="/personal/datenschutz?ansicht=geloescht" />
          <div className="md:col-span-12">
            {r.daten.zeilen.length === 0 ? (
              <Leer art="erledigt" titel={T.datenschutz.leer} text="" testid="per-ds-leer" />
            ) : (
              <div className="bo-dt" data-testid="per-ds-tabelle">
                <div className="overflow-x-auto">
                  <table className="bo-dt__tabelle">
                    <thead><tr>{Object.values(T.datenschutz.spalten).map((s) => <th key={s} scope="col">{s}</th>)}</tr></thead>
                    <tbody>
                      {r.daten.zeilen.map((z) => (
                        <tr key={z.name}>
                          <td>{Number(z.pseudonymisiert) || ansicht === "geloescht" ? <span className="text-bo-text-soft">{`${z.name} – ${z.stelle_titel || "Initiativbewerbung"}`}</span> : <Link className="bo-per-link" href={`/personal/bewerbungen/${encodeURIComponent(z.name)}?tab=datenschutz`}>{`${z.vorname} ${z.nachname} – ${z.stelle_titel || "Initiativbewerbung"}`}</Link>}</td>
                          <td><StatusBadge wert={z.status} text={statusText("bewerbung", z.status)} ton={statusTon("bewerbung", z.status)} groesse="xs" /></td>
                          <td className="whitespace-nowrap">{z.entschieden_am ? kurzDatum(String(z.entschieden_am).slice(0, 10)) : "–"}</td>
                          <td className="whitespace-nowrap" title={z.info.datum ? langDatum(z.info.datum) : undefined}>{z.info.datum ? `${langDatum(z.info.datum)} · ${relativTage(z.info.datum, ctx.heute)}` : "–"}</td>
                          <td className="bo-per-zahl">{z.unterlagen ?? "–"}</td>
                          <td>{Number(z.pseudonymisiert) ? "Personendaten gelöscht" : z.info.aufbewahrung ? "Aufbewahrung mit Einwilligung" : z.info.zustand === "faellig" ? "fällig" : "läuft"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="bo-per-band-hinweis mt-6">{T.datenschutz.beschaeftigte}</p>
          </div>
        </Bento>
      )}
    </PersonalHuelle>
  );
}
