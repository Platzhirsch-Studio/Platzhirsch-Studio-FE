import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import ZeitBuchenKnopf from "@/components/Backoffice/Projekte/ZeitBuchenKnopf";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { istLeitung, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { hmm, stunden } from "@/lib/backoffice/projekte/zeit";
import { LAUFEND } from "@/lib/backoffice/projekte/status";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zeiten · Projekte" };
const Z = TEXTE.zeiten;

/** Zeiten (T2, § 5.15): Projektzeiten, keine Arbeitszeitaufzeichnung; Abrechnen läuft in Faktura. */
export default async function Zeiten({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/zeiten");
  const client = projekteClient(session);
  const leitung = istLeitung(session);
  const [alle, projekte] = await Promise.all([
    client.getList("PH Projektzeit", { fields: ["name", "datum", "user", "projekt", "taetigkeit", "dauer_min", "status", "abrechenbar", "beschreibung", ...(leitung ? ["beleg_ref"] : [])], filters: leitung ? [] : [["user", "=", session.user]], orderBy: "datum desc", limit: 300 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "status"], limit: 500 }).catch(() => []),
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const leute = await personen(client, alle.map((z) => z.user));
  const sicht = sp.sicht === "abrechenbar" ? "abrechenbar" : "alle";
  const liste = sicht === "abrechenbar" ? alle.filter((z) => Number(z.abrechenbar) && z.status === "Offen") : alle;
  const summe = liste.reduce((s, z) => s + Number(z.dauer_min || 0), 0);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={Z.titel}
        untertitel={Z.hinweis}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: Z.titel }]}
        kennzahlen={[{ wert: `${stunden(summe)} h`, text: sicht === "abrechenbar" ? "abrechenbar offen" : leitung ? "gebucht, alle" : "gebucht, eigene" }]}
        aktionen={<ZeitBuchenKnopf projekte={projekte.filter((p) => LAUFEND.includes(p.status))} />}
        unternav={<Segment label="Sicht" groesse="s" aktiv={sicht} optionen={[{ wert: "alle", titel: "Alle", href: "/projekte/zeiten" }, { wert: "abrechenbar", titel: "Abrechenbar offen", href: "/projekte/zeiten?sicht=abrechenbar" }]} />}
      />
      <Tabelle
        titel="Buchungen"
        unter={`${liste.length} Einträge · Abgerechnet wird beim Stellen der Rechnung in Faktura.`}
        testid="zeiten-liste"
        spalten={[{ titel: "Projekt" }, { titel: "Datum" }, { titel: "Person", versteckt: "max-lg:hidden" }, { titel: Z.taetigkeit }, { titel: Z.dauer, rechts: true }, { titel: "Status" }]}
        zeilen={liste.map((z) => ({
          key: z.name,
          href: `/projekte/${encodeURIComponent(z.projekt)}`,
          titel: pj[z.projekt]?.titel || z.projekt,
          unter: z.beschreibung || z.name,
          zellen: [datumKurz(z.datum, { jahr: true }), <span key="p" className="flex items-center gap-2"><Avatar name={leute[z.user]?.name || z.user} groesse={24} dekorativ />{leute[z.user]?.name || z.user}</span>, statusText("*", z.taetigkeit), hmm(z.dauer_min), <ProjektStatus key="s" doctype="PH Projektzeit" wert={z.status} />],
        }))}
        leer={sicht === "abrechenbar" ? <Leer art="erledigt" groesse="karte" titel="Alle abrechenbaren Zeiten sind abgerechnet." /> : <Leer groesse="karte" titel={Z.leer} />}
      />
    </Shell>
  );
}
