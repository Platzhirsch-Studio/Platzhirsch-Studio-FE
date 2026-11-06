import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { ladeEinstellungen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referenzen · Projekte" };
const R = TEXTE.referenzen;
const STATUS = ["Eingereicht", "Veroeffentlicht", "Abgelehnt", "Widerrufen"];

/** Referenzen (§ 5.18): Liste, Prüfung durch Leitung auf der Prüfseite. */
export default async function Referenzen({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/referenzen");
  const client = projekteClient(session);
  const [alle, projekte, einst] = await Promise.all([
    client.getList("PH Referenz", { fields: ["name", "titel", "projekt", "status", "anzeige_art", "anzeige_vorname", "anzeige_ort", "eingereicht_am", "geprueft_am"], orderBy: "eingereicht_am desc", limit: 200 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => []),
    ladeEinstellungen(client),
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const status = STATUS.includes(sp.status) ? sp.status : "alle";
  const liste = alle.filter((r) => status === "alle" || r.status === status);
  return (
    <Shell session={session}>
      <Seitenkopf titel={R.titel} untertitel={R.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: R.titel }]}
        unternav={<Segment label="Status" groesse="s" aktiv={status} optionen={[{ wert: "alle", titel: "Alle", anzahl: alle.length, href: "/projekte/referenzen" }, ...STATUS.map((s) => ({ wert: s, titel: statusText("PH Referenz", s), anzahl: alle.filter((r) => r.status === s).length, href: `/projekte/referenzen?status=${s}` }))]} />} />
      {!Number(einst.referenz_freigabe_aktiv ?? 1) && <p className="mb-6 rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[14px] text-bo-warning-text">{R.ausgeschaltet}</p>}
      <Tabelle titel={R.titel} unter={`${liste.length} Referenzen`} testid="referenz-liste"
        spalten={[{ titel: "Referenz" }, { titel: "Anzeige", versteckt: "max-lg:hidden" }, { titel: "Eingereicht", rechts: true }, { titel: "Status" }]}
        zeilen={liste.map((r) => ({ key: r.name, href: `/projekte/referenzen/${encodeURIComponent(r.name)}`, titel: r.titel, unter: `${pj[r.projekt]?.titel || r.projekt} · ${r.name}`, zellen: [r.anzeige_art === "anonym" ? "anonym" : [r.anzeige_vorname, r.anzeige_ort].filter(Boolean).join(", "), r.eingereicht_am ? datumKurz(r.eingereicht_am, { jahr: true }) : "–", <ProjektStatus key="s" doctype="PH Referenz" wert={r.status} />] }))}
        leer={alle.length ? <Leer art="erledigt" groesse="karte" titel="Nichts zu prüfen." /> : <Leer groesse="karte" titel={R.leer} />} />
    </Shell>
  );
}
