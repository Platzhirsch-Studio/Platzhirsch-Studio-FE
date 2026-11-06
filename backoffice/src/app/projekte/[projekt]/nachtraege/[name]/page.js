import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf, Band } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import NachtragFreigabe from "@/components/Backoffice/Projekte/NachtragFreigabe";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { ladeUnterakte } from "@/lib/backoffice/projekte/akte";
import { datumKurz, euroRund } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nachtrag · Projekte" };
const N = TEXTE.nachtrag;

/** Nachtrag (§ 5.12): Positionen entfällt/neu/ändern, Differenz nur Leitung, Entscheidung vor Ort mit Unterschrift. */
export default async function NachtragAkte({ params }) {
  const { session, doc: n, projekt: p, leitung } = await ladeUnterakte({ params, doctype: "PH Nachtrag", pfad: "nachtraege" });
  const enc = encodeURIComponent;
  const material = { neu: "salbei", entfall: "stein", aenderung: "eiche" };
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: `/projekte/${enc(p.name)}?tab=positionen`, titel: p.titel }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel, href: `/projekte/${enc(p.name)}` }, { titel: n.titel || n.bezeichnung }]}
          titel={`Nachtrag ${n.nummer_im_projekt || ""} „${n.bezeichnung}“`}
          nummer={`${n.name}${n.freigabe_frist ? ` · ${N.frist} ${datumKurz(n.freigabe_frist, { jahr: true })}` : ""}`}
          status={<ProjektStatus doctype="PH Nachtrag" wert={n.status} groesse="m" />}
          aktionen={n.status === "Entwurf" ? <AktionKnopf variant="primary" art="nachtrag-vorlegen" args={{ name: n.name }} commitText={`Nachtrag ${n.nummer_im_projekt} vorgelegt`}>{N.vorlegen}</AktionKnopf> : null}
        />
        {n.status === "Freigegeben" && !Number(n.uebernommen) && <Band ton="warnung" titel={N.bandAb} aktion={<Knopf size="s" href={`/faktura?projekt=${enc(p.name)}`}>{N.abAnpassen}</Knopf>} />}
        {n.status === "Abgelehnt" && n.ablehnung_grund && <Band ton="neutral" titel="Abgelehnt" text={n.ablehnung_grund} />}
        <Bento>
          <Kachel className="md:col-span-7" titel="Positionen" unter={`${N.grund}: ${statusText("*", n.grund || "–").replace("Planungsaenderung", "Planungsänderung")}${n.auswirkung_termin ? ` · ${N.terminAuswirkung}: ${n.auswirkung_termin}` : ""}`}>
            <ul className="bo-prj-liste">
              {(n.positionen || []).map((z) => (
                <li key={z.name}>
                  <Pille material={material[z.art] || "stein"} groesse="sm">{N.art[z.art] || z.art}</Pille>
                  <span className="min-w-0 flex-1">
                    <span className={`bo-prj-titel block truncate ${z.art === "entfall" ? "line-through decoration-bo-line-strong" : ""}`}>{z.bezeichnung}</span>
                    <span className="bo-prj-unter block">{[z.raum, `${z.menge || 1} Stk.`].filter(Boolean).join(" · ")}</span>
                  </span>
                  {leitung && z.betrag_cent !== undefined && <span className="tabular-nums">{Number(z.betrag_cent) > 0 ? "+" : ""}{euroRund(z.betrag_cent)}</span>}
                </li>
              ))}
            </ul>
            {leitung && n.differenz_cent !== undefined && (
              <p className="mt-4 flex items-baseline justify-between border-t-[length:var(--bo-hair)] border-bo-line pt-4 text-[17px] font-semibold">
                <span>{N.differenz}</span>
                <span className="tabular-nums">{Number(n.differenz_cent) >= 0 ? "+" : ""}{euroRund(n.differenz_cent)}</span>
              </p>
            )}
          </Kachel>
          <Kachel className="md:col-span-5" titel={N.entscheidung} unter={n.status === "Vorgelegt" ? N.offen(n.vorgelegt_am ? datumKurz(n.vorgelegt_am, { jahr: true }) : "") : statusText("PH Nachtrag", n.status)}>
            {n.status === "Vorgelegt" && !n.unterschrift_kunde ? (
              <NachtragFreigabe name={n.name} kunde={p.kunde_name} erklaerung={`Ich beauftrage den Nachtrag „${n.bezeichnung}“ zu den genannten Positionen.`} />
            ) : (
              <dl className="bo-prj-fakten bo-prj-fakten--eins">
                <div><dt>Entschieden</dt><dd>{n.entscheidung_am ? datumKurz(n.entscheidung_am, { jahr: true }) : "–"}{n.entscheidung_quelle ? ` · ${n.entscheidung_quelle === "portal" ? "Kundenportal" : "vor Ort mit Unterschrift"}` : ""}</dd></div>
                {n.unterschrift_name && <div><dt>Unterschrift</dt><dd>{n.unterschrift_name}</dd></div>}
                {n.kunde_kommentar && <div><dt>Kommentar</dt><dd>„{n.kunde_kommentar}“</dd></div>}
              </dl>
            )}
          </Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
