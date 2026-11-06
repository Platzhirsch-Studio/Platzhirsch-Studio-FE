// /marketing/kundenreisen/[id] – Regel-Editor (10-konzept-marketing § 2.6, T5): Regel · Rechtsgrundlage · Vorlage · Protokoll.
import { notFound } from "next/navigation";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { ReiseEditor, ReiseKopf } from "@/components/Backoffice/Marketing/RegelEditoren";
import { marketingKontext, reiseAkte } from "@/lib/backoffice/marketing/daten";
import { reiseStatus } from "@/lib/backoffice/marketing/status";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { kurzDatum, pruefeReise } from "@/lib/backoffice/marketing/regeln";
import { GRUNDLAGE_KURZ, REISEN, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Kundenreise") };

export default async function ReiseSeite({ params, searchParams }) {
  const { id: roh } = await params;
  const id = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/kundenreisen/${roh}`, doctype: "PH Kundenreise" });
  const akte = await reiseAkte(ctx.client, id).catch((e) => (e?.code === "not_found" ? null : Promise.reject(e)));
  if (!akte) notFound();
  const { doc: r, protokoll } = akte;
  const tabs = [
    { id: "regel", titel: REISEN.tabs.regel },
    { id: "grundlage", titel: REISEN.tabs.grundlage },
    { id: "vorlage", titel: REISEN.tabs.vorlage },
    { id: "protokoll", titel: REISEN.tabs.protokoll, anzahl: protokoll.length || undefined },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const automatik = !!Number(ctx.einst.automatik_aktiv || 0);
  const fehler = pruefeReise(r, akte.vorlageHtml);
  const geaendert = (akte.docinfo?.comments || []).some((c) => /Regel geändert/.test(String(c.content))) && r.status === "Entwurf";
  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/kundenreisen", titel: REISEN.titel }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: REISEN.titel, href: "/marketing/kundenreisen" }, { titel: r.titel }]}
        titel={r.titel}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <Status gruppe="reise" wert={reiseStatus(r, { automatik })} testid="reise-status" />
            <span className={fehler.length ? "bo-mar-warn" : "bo-mar-ok"}>
              {REISEN.regelpruefung}: {fehler.length ? REISEN.fehlerZahl(fehler.length) : REISEN.regelOk}
            </span>
          </span>
        }
        aktionen={<ReiseKopf r={{ name: r.name, titel: r.titel, status: r.status, werbung: r.werbung, grundlage_v: r.grundlage_v, grundlage_b: r.grundlage_b, grundlage_e: r.grundlage_e }} leitung={ctx.leitung} fehler={fehler} automatik={automatik} testadresse={ctx.einst.test_empfaenger || ctx.session.user} />}
      />
      {geaendert && (
        <div className="mb-6">
          <Band ton="info" titel={REISEN.regelGeaendert} />
        </div>
      )}
      {!ctx.leitung && <p className="bo-mar-zustand">{REISEN.nurLeitung}</p>}
      <div className="mb-6">
        <AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/kundenreisen/${roh}`} params={{}} />
      </div>
      {tab !== "protokoll" ? (
        <ReiseEditor r={r} tab={tab} leitung={ctx.leitung} vorlagen={akte.vorlagen} events={akte.events} vorlageHtml={akte.vorlageHtml} faehig={ctx.an} />
      ) : (
        <ListeKachel label="Protokoll" kopf={<span>gesendet {r.gesendet_gesamt || 0} · übersprungen {r.uebersprungen_gesamt || 0} · zuletzt {r.letzter_versand ? kurzDatum(r.letzter_versand, { zeit: true }) : "–"}</span>}>
          {protokoll.length === 0 ? (
            <p className="bo-mar-unter px-3 py-6">{REISEN.protokollLeer}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="bo-mar-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Empfänger</th>
                    <th scope="col">Status</th>
                    <th scope="col">Grundlage</th>
                    <th scope="col">Geplant für</th>
                    <th scope="col">Gesendet</th>
                    <th scope="col">Grund</th>
                  </tr>
                </thead>
                <tbody>
                  {protokoll.map((v) => (
                    <tr key={v.name}>
                      <td>{v.empfaenger}</td>
                      <td><Status gruppe="reiseVersand" wert={v.status} /></td>
                      <td>{GRUNDLAGE_KURZ[v.grundlage] || "–"}</td>
                      <td>{kurzDatum(v.geplant_am)}</td>
                      <td>{v.gesendet_am ? kurzDatum(v.gesendet_am, { zeit: true }) : "–"}</td>
                      <td className="bo-mar-unter">{v.grund === "storniert" ? "Auftrag storniert" : v.grund || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ListeKachel>
      )}
    </Rahmen>
  );
}
