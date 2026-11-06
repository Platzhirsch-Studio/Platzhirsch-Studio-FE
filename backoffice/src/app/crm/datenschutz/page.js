import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { CrmStatus, Symbol } from "@/components/Backoffice/Crm/Teile";
import { ladeDatenschutz } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { datum } from "@/lib/backoffice/format";
import { restTage } from "@/lib/backoffice/crm/vorgang";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Datenschutz · CRM" };

const SICHTEN = ["offen", "frist", "erledigt"];

export default async function DatenschutzSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/datenschutz");
  const client = backoffice(session);
  await requireDocRecht(await ladeMeta(client, "PH Datenschutzanfrage"), "read", "/crm/datenschutz");
  const sicht = SICHTEN.includes(sp?.sicht) ? sp.sicht : "offen";
  const liste = await ladeDatenschutz(session, client, { sicht });
  const jetzt = new Date();
  return (
    <Shell session={session}>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.datenschutz} />
      <Erstbesuch text={T.datenschutz.erstbesuch} route="/crm/datenschutz" />
      <div className="mb-6"><Segment label="Ansicht" aktiv={sicht} optionen={SICHTEN.map((s) => ({ wert: s, titel: T.datenschutz.ansichten[s], href: `/crm/datenschutz${s === "offen" ? "" : `?sicht=${s}`}` }))} /></div>
      <Kachel testid="crm-datenschutz-liste">
        {liste.length === 0 ? <Leer art={sicht === "erledigt" ? "leer" : "erledigt"} text={T.datenschutz.leer} groesse="karte" /> : (
          <ul className="grid gap-1">
            {liste.map((s) => {
              const rest = restTage(s.frist, jetzt);
              const offen = ["Offen", "In Arbeit"].includes(s.status);
              return (
                <li key={s.name}>
                  <Link href={`/crm/datenschutz/${encodeURIComponent(s.name)}`} className="bo-crm-zeile" style={{ gridTemplateColumns: "36px minmax(0,1fr) auto auto" }} data-testid="crm-dsa-zeile">
                    <Symbol icon="Shield" ton={offen && rest <= 7 ? "ziegel" : "see"} />
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{T.dsaArt[s.art] || s.art} · {s.kontaktTitel}</span><span className={`block text-[13px] ${offen && rest < 0 ? "text-bo-danger-text" : offen && rest <= 7 ? "text-bo-warning-text" : "text-bo-text-soft"}`}>{offen ? T.datenschutz.frist(datum(s.frist), rest) : `Frist ${datum(s.frist)}`} · Eingang {datum(s.eingang)} · {s.kanal}</span></span>
                    {s.zustaendigName ? <PersonZelle person={s.zustaendigName} groesse={24} nurAvatar /> : <span />}
                    <CrmStatus objekt="datenschutz" wert={s.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Kachel>
    </Shell>
  );
}
