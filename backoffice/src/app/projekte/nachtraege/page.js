import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { istLeitung, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz, euroRund } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nachträge · Projekte" };
const STATUS = ["Entwurf", "Vorgelegt", "Freigegeben", "Abgelehnt", "Storniert"];

/** Nachträge aller Projekte (T2, § 5.12). Differenz nur für Leitung. */
export default async function Nachtraege({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/nachtraege");
  const client = projekteClient(session);
  const leitung = istLeitung(session);
  const [alle, projekte] = await Promise.all([
    client.getList("PH Nachtrag", { fields: ["name", "titel", "bezeichnung", "projekt", "status", "datum", "vorgelegt_am", "freigabe_frist", "uebernommen", ...(leitung ? ["differenz_cent"] : [])], orderBy: "datum desc", limit: 300 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => []),
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const status = STATUS.includes(sp.status) ? sp.status : "alle";
  const liste = alle.filter((n) => status === "alle" || n.status === status);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={TEXTE.nachtrag.titel}
        untertitel={TEXTE.nachtrag.unter}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: TEXTE.nachtrag.titel }]}
        unternav={<Segment label="Status" groesse="s" aktiv={status} optionen={[{ wert: "alle", titel: "Alle", anzahl: alle.length, href: "/projekte/nachtraege" }, ...STATUS.map((s) => ({ wert: s, titel: s, anzahl: alle.filter((n) => n.status === s).length, href: `/projekte/nachtraege?status=${s}` }))]} />}
      />
      <Tabelle
        titel={TEXTE.nachtrag.titel}
        unter={`${liste.length} Nachträge`}
        testid="nachtrag-liste"
        spalten={[{ titel: "Nachtrag" }, { titel: "Status" }, { titel: "Vorgelegt", rechts: true }, ...(leitung ? [{ titel: TEXTE.nachtrag.differenz, rechts: true }] : []), { titel: "AB" }]}
        zeilen={liste.map((n) => ({
          key: n.name,
          href: `/projekte/${encodeURIComponent(n.projekt)}/nachtraege/${encodeURIComponent(n.name)}`,
          titel: n.titel || n.bezeichnung,
          unter: `${pj[n.projekt]?.titel || n.projekt} · ${n.name}`,
          zellen: [
            <ProjektStatus key="s" doctype="PH Nachtrag" wert={n.status} />,
            n.vorgelegt_am ? datumKurz(n.vorgelegt_am, { jahr: true }) : "–",
            ...(leitung ? [`${Number(n.differenz_cent) >= 0 ? "+" : ""}${euroRund(n.differenz_cent)}`] : []),
            n.status === "Freigegeben" ? (Number(n.uebernommen) ? "angepasst" : <span key="ab" className="text-bo-warning-text">offen</span>) : "–",
          ],
        }))}
        leer={alle.length ? <Leer art="gefiltert" groesse="karte" titel="Keine Nachträge mit diesem Status." zuruecksetzenHref="/projekte/nachtraege" /> : <Leer groesse="karte" titel={TEXTE.nachtrag.leer} />}
      />
    </Shell>
  );
}
