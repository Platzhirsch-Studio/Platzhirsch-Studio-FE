import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, istLeitung, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { FREMDGEWERK_UEBERGAENGE, gewerkKonflikte } from "@/lib/backoffice/projekte/regeln";
import { datumKurz, euroRund, terminText } from "@/lib/backoffice/projekte/anzeige";
import { istErledigt } from "@/lib/backoffice/projekte/maengel";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fremdgewerke · Projekte" };
const G = TEXTE.fremdgewerke;

/** Fremdgewerke (T2/T3, § 5.13): Liste, Detail über ?gewerk=, Status nach erlaubten Übergängen (§ 7.5), Konflikte als Text. */
export default async function Fremdgewerke({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/fremdgewerke");
  const client = projekteClient(session);
  const heute = heuteIso();
  const leitung = istLeitung(session);
  const [namen, projekte, montagen] = await Promise.all([
    client.getList("PH Fremdgewerk", { fields: ["name"], orderBy: "termin_von asc", limit: 300 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => []),
    client.getList("PH Montageauftrag", { fields: ["name", "projekt", "start", "status"], limit: 500 }).catch(() => []),
  ]);
  const alle = (await Promise.all(namen.map((n) => client.getDoc("PH Fremdgewerk", n.name).catch(() => null)))).filter(Boolean);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const konflikte = gewerkKonflikte(alle, montagen);
  const g = sp.gewerk ? alle.find((x) => x.name === sp.gewerk) : null;
  return (
    <Shell session={session}>
      <Seitenkopf titel={G.titel} untertitel={G.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: G.titel }]} kennzahlen={[{ wert: alle.filter((x) => !["Erledigt", "Abgesagt"].includes(x.status)).length, text: "aktiv" }, { wert: konflikte.length, text: "Terminkonflikte" }]} />
      {konflikte.length > 0 && (
        <div className="mb-6 rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[14px] text-bo-warning-text" role="status">
          {konflikte.map((k) => <p key={`${k.gewerk}${k.montage}`}>{G.konflikt(k.gewerkName, terminText(k.ende, heute), terminText(k.start, heute))}</p>)}
        </div>
      )}
      {g && (
        <Bento className="mb-6" testid="gewerk-detail">
          <Kachel className="md:col-span-7" titel={`${g.gewerk} · ${g.partner_text || ""}`} unter={`${pj[g.projekt]?.titel || g.projekt} · ${g.name}`} werkzeuge={<Knopf size="s" variant="ghost" icon="X" label="Schließen" href="/projekte/fremdgewerke" />}>
            <dl className="bo-prj-fakten">
              <div className="col-span-2"><dt>Leistung</dt><dd>{g.leistung}</dd></div>
              <div><dt>Ansprechpartner</dt><dd>{g.ansprechpartner || "–"}</dd></div>
              <div><dt>Telefon</dt><dd>{g.telefon ? <a className="underline" href={`tel:${g.telefon.replace(/\s/g, "")}`}>{g.telefon}</a> : "–"}</dd></div>
              <div><dt>Kunde sieht</dt><dd>{Number(g.kunde_sichtbar) ? "ja" : "nein"}</dd></div>
              <div><dt>{G.vertragDirekt}</dt><dd>{Number(g.vertrag_direkt_kunde) ? "ja" : "nein"}</dd></div>
              {leitung && g.kosten_cent !== undefined && <div><dt>Kosten</dt><dd>{euroRund(g.kosten_cent)}</dd></div>}
              <div><dt>{G.abnahme}</dt><dd>{statusText("*", g.abnahme_status || "–")}{g.abgenommen_am ? ` · ${datumKurz(g.abgenommen_am, { jahr: true })}` : ""}</dd></div>
              {g.haftungshinweis && <div className="col-span-2"><dt>Hinweis</dt><dd className="text-bo-text-soft">{g.haftungshinweis}</dd></div>}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <ProjektStatus doctype="PH Fremdgewerk" wert={g.status} groesse="m" />
              {(FREMDGEWERK_UEBERGAENGE[g.status] || []).map((s) => (
                <AktionKnopf key={s} size="s" art="fremdgewerk" args={{ name: g.name, status: s }} ok={`Status ${s}`}>{`→ ${s}`}</AktionKnopf>
              ))}
            </div>
          </Kachel>
          <Kachel className="md:col-span-5" titel={G.termine}>
            {(g.termine || []).length ? (
              <ul className="bo-prj-liste">
                {g.termine.map((t) => <li key={t.name}><span className="min-w-0 flex-1"><span className="bo-prj-titel block">{t.art}</span><span className="bo-prj-unter">{terminText(t.von, heute)}{t.bis ? ` – ${terminText(t.bis, heute)}` : ""}</span></span><Pille material="travertin" groesse="sm">{t.status || "geplant"}</Pille></li>)}
              </ul>
            ) : (
              <Leer groesse="karte" titel="Noch keine Termine." />
            )}
            <h3 className="mt-5 mb-2 text-[13px] font-medium text-bo-text-soft">Mängel</h3>
            {(g.maengel || []).length ? g.maengel.map((m) => <p key={m.name} className={`text-[15px] ${istErledigt(m.status) ? "text-bo-text-soft line-through" : ""}`}>{m.beschreibung}</p>) : <p className="text-[14px] text-bo-text-soft">Keine Mängel.</p>}
          </Kachel>
        </Bento>
      )}
      <Tabelle
        titel={G.titel}
        unter={`${alle.length} Gewerke`}
        testid="gewerke-liste"
        spalten={[{ titel: "Gewerk" }, { titel: "Nächster Termin" }, { titel: G.abnahme, versteckt: "max-lg:hidden" }, { titel: "Status" }]}
        zeilen={alle.map((x) => ({ key: x.name, href: `/projekte/fremdgewerke?gewerk=${encodeURIComponent(x.name)}`, titel: `${x.gewerk} · ${x.partner_text || ""}`, unter: `${pj[x.projekt]?.titel || x.projekt}${Number(x.vertrag_direkt_kunde) ? ` · ${G.vertragDirekt}` : ""}`, zellen: [x.termin_von ? terminText(x.termin_von, heute) : "–", statusText("*", x.abnahme_status || "–"), <ProjektStatus key="s" doctype="PH Fremdgewerk" wert={x.status} />] }))}
        leer={<Leer groesse="karte" titel={G.leer} />}
      />
    </Shell>
  );
}
