import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { heuteIso, ladeMaengel, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mängel · Projekte" };
const T = TEXTE.maengel;

/** Mängel (T2, § 5.11): drei Quellen, Filter Quelle/Überfällig in der URL, Zeilenaktion Erledigt und → Servicefall. */
export default async function Maengel({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/maengel");
  const client = projekteClient(session);
  const heute = heuteIso();
  const [alle, projekte] = await Promise.all([ladeMaengel(client, { heute, projekt: sp.projekt || null }), client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => [])]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const quelle = ["montage", "abnahme", "fremdgewerk"].includes(sp.quelle) ? sp.quelle : "alle";
  const nurUeber = sp.ueberfaellig === "1";
  const liste = alle.filter((m) => (quelle === "alle" || m.quelle === quelle) && (!nurUeber || m.ueberfaellig > 0));
  const href = (q, u) => {
    const s = new URLSearchParams({ ...(q !== "alle" ? { quelle: q } : {}), ...(u ? { ueberfaellig: "1" } : {}), ...(sp.projekt ? { projekt: sp.projekt } : {}) }).toString();
    return `/projekte/maengel${s ? `?${s}` : ""}`;
  };
  const akteHref = (m) => (m.quelle === "montage" ? `/projekte/montagen/${encodeURIComponent(m.doc)}?tab=maengel` : m.quelle === "abnahme" ? `/projekte/abnahmen/${encodeURIComponent(m.doc)}` : `/projekte/fremdgewerke?gewerk=${encodeURIComponent(m.doc)}`);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.titel}
        untertitel={T.unter}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: T.titel }]}
        kennzahlen={[{ wert: alle.length, text: "offen" }, { wert: alle.filter((m) => m.ueberfaellig > 0).length, text: "über der Frist" }]}
        unternav={
          <div className="bo-prj-filter">
            <Segment label="Quelle" groesse="s" aktiv={quelle} optionen={["alle", "montage", "abnahme", "fremdgewerk"].map((q) => ({ wert: q, titel: q === "alle" ? "Alle" : T.quelle[q], anzahl: q === "alle" ? alle.length : alle.filter((m) => m.quelle === q).length, href: href(q, nurUeber) }))} />
            <Segment label="Frist" groesse="s" aktiv={nurUeber ? "ueber" : "alle"} optionen={[{ wert: "alle", titel: "Alle Fristen", href: href(quelle, false) }, { wert: "ueber", titel: T.nurUeberfaellig, href: href(quelle, true) }]} />
          </div>
        }
      />
      <Tabelle
        titel="Offene Mängel"
        unter={`${liste.length} Einträge · dringendste zuerst`}
        testid="maengel-liste"
        spalten={[{ titel: "Mangel" }, { titel: "Quelle" }, { titel: "Frist", rechts: true }, { titel: "Verantwortlich", versteckt: "max-lg:hidden" }, { titel: "" }]}
        zeilen={liste.map((m) => ({
          key: m.id,
          href: akteHref(m),
          titel: m.beschreibung,
          unter: `${pj[m.projekt]?.titel || m.projekt} · ${pj[m.projekt]?.kunde_name || ""}`,
          zellen: [
            <Pille key="q" material={m.quelle === "abnahme" ? "salbei" : m.quelle === "fremdgewerk" ? "eiche" : "see"} groesse="sm">{T.quelle[m.quelle]}</Pille>,
            <span key="f" className={m.ueberfaellig ? "font-medium text-bo-warning-text" : ""}>{m.ueberfaellig ? T.ueberfaellig(m.ueberfaellig) : m.frist ? datumKurz(m.frist) : "–"}</span>,
            <span key="v">{m.verantwortlich || "–"}{m.verantwortlich === "Lieferant" ? <span className="bo-prj-unter block">{T.lieferantHinweis}</span> : null}</span>,
            <span key="a" className="flex justify-end gap-2">
              <AktionKnopf size="s" icon="Check" art="mangel" args={{ quelle: m.quelle, doc: m.doc, zeile: m.zeile, aktion: "erledigt" }} ok={TEXTE.abnahme.mangelErledigt}>{T.erledigt}</AktionKnopf>
            </span>,
          ],
        }))}
        leer={alle.length ? <Leer art="gefiltert" groesse="karte" titel={T.leerFilter} zuruecksetzenHref="/projekte/maengel" /> : <Leer art="erledigt" groesse="karte" titel={T.leer} />}
      />
    </Shell>
  );
}
