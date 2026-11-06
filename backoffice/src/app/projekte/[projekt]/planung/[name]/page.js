import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { ladeUnterakte } from "@/lib/backoffice/projekte/akte";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planung · Projekte" };
const P = TEXTE.planung;

/** Planung (T5, § 5.5): Primär je Status – Entwurf → Vorlegen · Vorgelegt → Freigeben · Änderung → Neue Version · Freigegeben → Positionen ins Projekt. */
export default async function PlanungAkte({ params }) {
  const { session, client, doc: d, projekt: p } = await ladeUnterakte({ params, doctype: "PH Planung", pfad: "planung" });
  const versionen = await client.getList("PH Planung", { fields: ["name", "version", "status", "bezeichnung"], filters: [["projekt", "=", p.name], ["bezeichnung", "=", d.bezeichnung]], orderBy: "version desc", limit: 20 }).catch(() => []);
  const aenderung = d.kunde_entscheidung === "aenderung" || d.status === "Aenderung gewuenscht";
  let primaer = null;
  if (d.status === "Entwurf") primaer = <AktionKnopf variant="primary" art="planung" args={{ name: d.name, methode: "kunden_vorlegen" }} ok="Planung vorgelegt">{P.vorlegen}</AktionKnopf>;
  else if (aenderung) primaer = <AktionKnopf variant="primary" art="planung" args={{ name: d.name, methode: "neue_version" }} ok="Neue Version angelegt">{P.neueVersion}</AktionKnopf>;
  else if (d.status === "Kunde vorgelegt")
    primaer = (
      <AktionKnopf variant="primary" art="planung" args={{ name: d.name, methode: "freigeben" }} ok="Planung freigegeben" frage={{ titel: `${d.bezeichnung} v${d.version || 1} freigeben?`, text: "Quelle: Kunde hat im Gespräch freigegeben. Die Freigabe gilt nur für diese Version.", bestaetigen: P.freigeben }}>
        {d.kunde_entscheidung === "freigegeben" ? P.freigabeUebernehmen : P.freigeben}
      </AktionKnopf>
    );
  else if (d.status === "Freigegeben") primaer = <AktionKnopf variant="primary" art="planung" args={{ name: d.name, methode: "positionen_ins_projekt" }} ok="Positionen übernommen">{P.positionenUebernehmen}</AktionKnopf>;
  const pos = d.positionen || [];
  const enc = encodeURIComponent;
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: `/projekte/${enc(p.name)}?tab=planung`, titel: p.titel }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel, href: `/projekte/${enc(p.name)}` }, { titel: d.bezeichnung }]}
          titel={`${d.bezeichnung} v${d.version || 1}`}
          nummer={`${d.name} · ${statusText("*", d.quelle_planung || "")}${d.vorgelegt_am ? ` · vorgelegt ${datumKurz(d.vorgelegt_am, { jahr: true })}` : ""}`}
          status={<ProjektStatus doctype="PH Planung" wert={d.status} groesse="m" />}
          aktionen={
            <>
              {d.status !== "Verworfen" && d.status !== "Freigegeben" && (
                <AktionKnopf art="planung" args={{ name: d.name, methode: "verwerfen" }} ok="Planung verworfen" frage={{ titel: P.verwerfenFrage(d.bezeichnung, d.version || 1), text: P.verwerfenText, bestaetigen: P.verwerfen, gefaehrlich: true }}>
                  {P.verwerfen}
                </AktionKnopf>
              )}
              {primaer}
            </>
          }
        />
        {aenderung && (
          <div className="rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[15px] text-bo-warning-text" role="status">
            {P.aenderungBanner(p.kunde_name)}
            {d.kunde_kommentar ? `: „${d.kunde_kommentar}“` : ""}
          </div>
        )}
        <Bento>
          <Kachel className="md:col-span-8" flach>
            {d.vorschau ? (
              // eslint-disable-next-line @next/next/no-img-element -- Planungsvorschau
              <img src={d.vorschau} alt={d.bezeichnung} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="p-6">
                <Leer groesse="karte" titel="Keine Vorschau – Datei herunterladen." />
              </div>
            )}
          </Kachel>
          <Kachel className="md:col-span-4" titel="Kunde" unter={Number(d.kunde_sichtbar) ? TEXTE.mappe.kundeSieht : TEXTE.mappe.intern}>
            <dl className="bo-prj-fakten bo-prj-fakten--eins">
              <div>
                <dt>{P.entscheidung}</dt>
                <dd>{d.kunde_entscheidung === "freigegeben" ? "freigegeben" : d.kunde_entscheidung === "aenderung" ? "Änderung gewünscht" : "offen"}</dd>
              </div>
              {d.freigabe_quelle && (
                <div>
                  <dt>Quelle</dt>
                  <dd>{d.freigabe_quelle === "portal" ? "Kundenportal" : "im Gespräch"}</dd>
                </div>
              )}
              {Number(d.echt_bestaetigt) ? (
                <div>
                  <dt>{P.echtBestaetigt}</dt>
                  <dd>ja</dd>
                </div>
              ) : null}
              <div>
                <dt>Versionen</dt>
                <dd>{versionen.map((v) => `v${v.version} ${statusText("PH Planung", v.status)}`).join(" · ")}</dd>
              </div>
            </dl>
          </Kachel>
          <Kachel className="md:col-span-12" titel="Positionen" unter={pos.length ? `${pos.length}` : undefined}>
            {pos.length ? (
              <ul className="bo-prj-liste">
                {pos.map((x) => (
                  <li key={x.name}>
                    <span className="min-w-0 flex-1">
                      <span className="bo-prj-titel block truncate">{x.bezeichnung}</span>
                      <span className="bo-prj-unter block">{[x.marke, x.raum, x.menge ? `${x.menge} Stk.` : ""].filter(Boolean).join(" · ")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Leer groesse="karte" titel="Noch keine Positionen. Sie kommen aus dem Planungsprogramm oder du erfasst sie hier." />
            )}
          </Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
