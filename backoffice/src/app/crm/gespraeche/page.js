import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Avatar from "@/components/Backoffice/Avatar";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { CrmStatus } from "@/components/Backoffice/Crm/Teile";
import { istLeitung, ladeGespraeche } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { faelligText, kurzDatum } from "@/lib/backoffice/crm/vorgang";
import { cent } from "@/lib/backoffice/format";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gespräche · CRM" };

const SICHTEN = ["offen", "faellig", "meine", "alle"];

export default async function GespraecheSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/gespraeche");
  const client = backoffice(session);
  await requireDocRecht(await ladeMeta(client, "PH Beratungsgespraech"), "read", "/crm/gespraeche");
  const sicht = SICHTEN.includes(sp?.sicht) ? sp.sicht : "offen";
  const { liste, zaehler } = await ladeGespraeche(session, client, { sicht });
  const leitung = istLeitung(session);
  const jetzt = new Date();
  const leer = sicht === "faellig" ? T.gespraeche.leerFaellig : sicht === "offen" || sicht === "alle" ? T.gespraeche.leer : T.gespraeche.leerGefiltert;
  return (
    <Shell session={session} breit>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.gespraeche} kennzahlen={[{ wert: String(zaehler.offen), text: "offen" }, { wert: String(zaehler.faellig), text: "Schritt fällig" }]} />
      <Erstbesuch text={T.erstbesuch.gespraeche} route="/crm/gespraeche" />
      <div className="mb-6"><Segment label="Ansicht" aktiv={sicht} optionen={SICHTEN.map((s) => ({ wert: s, titel: T.gespraeche.ansichten[s], href: `/crm/gespraeche${s === "offen" ? "" : `?sicht=${s}`}`, anzahl: zaehler[s] }))} /></div>
      <Kachel flach testid="crm-gespraeche-liste">
        {liste.length === 0 ? <div className="p-6"><Leer art={sicht === "faellig" ? "erledigt" : "leer"} text={leer} /></div> : (
          <div className="bo-scroll-x px-3 py-5">
            <table className="bo-crm-tabelle">
              <thead><tr><th>Kunde</th><th>Räume</th><th className="hidden lg:table-cell">Budget</th><th className="hidden md:table-cell">Vereinbart</th><th className="hidden xl:table-cell"><span className="sr-only">Berater</span></th><th>Status</th></tr></thead>
              <tbody>
                {liste.map((g) => {
                  const f = g.naechster_schritt_bis ? faelligText(g.naechster_schritt_bis, jetzt) : null;
                  const darfBudget = leitung || g.berater === session.user;
                  return (
                    <tr key={g.name} data-testid="crm-gespraech-zeile">
                      <td><Link href={`/crm/gespraeche/${encodeURIComponent(g.name)}`} className="bo-crm-objekt"><Avatar name={g.kontaktTitel || g.titel} groesse={44} /><span className="min-w-0"><span className="bo-crm-objekt__titel">{g.kontaktTitel || g.titel || g.name}</span><span className="bo-crm-objekt__unter">{[kurzDatum(g.datum), T.modus[g.ort], g.kontaktOrt].filter(Boolean).join(" · ")}</span></span></Link></td>
                      <td><span className="flex flex-wrap gap-1.5">{(g.raeume || []).slice(0, 3).map((r, i) => <Pille key={r.name || i} material={r.prioritaet === "Hoch" ? "cognac" : "stein"}>{T.raum[r.raum] || r.raum}</Pille>)}{(g.raeume || []).length > 3 ? <Pille material="stein" punkt={false}>+{g.raeume.length - 3}</Pille> : null}{!(g.raeume || []).length && <span className="text-[13px] text-bo-text-faint">–</span>}</span></td>
                      <td className="hidden whitespace-nowrap tabular-nums lg:table-cell">{darfBudget && g.budget_gesamt_cent ? cent(g.budget_gesamt_cent) : "–"}</td>
                      <td className="hidden max-w-[260px] md:table-cell"><span className="block truncate">{g.naechster_schritt || "–"}</span>{f && <span className={`block text-[13px] ${f.wort ? "text-bo-warning-text" : "text-bo-text-soft"}`}>bis {f.text}</span>}</td>
                      <td className="hidden xl:table-cell">{g.beraterName ? <PersonZelle person={g.beraterName} groesse={24} nurAvatar /> : null}</td>
                      <td><CrmStatus objekt="gespraech" wert={g.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Kachel>
    </Shell>
  );
}
