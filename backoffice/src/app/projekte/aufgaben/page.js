import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import AufgabenBoard from "@/components/Backoffice/Projekte/AufgabenBoard";
import { heuteIso, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { montagePersonen } from "@/lib/backoffice/projekte/planen";
import { tonKarte, LAUFEND } from "@/lib/backoffice/projekte/status";
import { terminText } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aufgaben · Projekte" };
const A = TEXTE.aufgaben;

/** Aufgaben (T3, § 5.14): Schnellanlage + Kanban; „Für mich“ über ?sicht=mir. */
export default async function Aufgaben({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/aufgaben");
  const client = projekteClient(session);
  const heute = heuteIso();
  const sicht = sp.sicht === "mir" ? "mir" : "alle";
  const [alle, projekte, monteure] = await Promise.all([
    client.getList("PH Projekt Aufgabe", { fields: ["name", "titel", "projekt", "status", "faellig", "zugewiesen_an", "prioritaet", "art"], orderBy: "faellig asc", limit: 400 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "status", "berater", "planer"], limit: 500 }).catch(() => []),
    montagePersonen(client),
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const leute = await personen(client, [...alle.map((a) => a.zugewiesen_an), ...projekte.flatMap((p) => [p.berater, p.planer]), session.user]);
  const liste = alle.filter((a) => (sicht === "alle" || a.zugewiesen_an === session.user) && (!sp.projekt || a.projekt === sp.projekt));
  const status = ["Offen", "In Arbeit", "Erledigt", "Verworfen"];
  const spalten = status.map((s) => ({
    status: s,
    karten: liste.filter((a) => a.status === s).map((a) => ({ ...a, zugewiesen_an: leute[a.zugewiesen_an]?.name || a.zugewiesen_an, projekt_titel: pj[a.projekt]?.titel || a.projekt, faellig_text: a.faellig ? (a.faellig < heute && ["Offen", "In Arbeit"].includes(s) ? `${A.ueberfaellig} · ${terminText(a.faellig, heute, { mitZeit: false })}` : terminText(a.faellig, heute, { mitZeit: false })) : "–" })),
  }));
  const offen = liste.filter((a) => ["Offen", "In Arbeit"].includes(a.status));
  const leuteListe = [...new Map([...Object.values(leute).map((x) => [x.email, { user: x.email, name: x.name }]), ...monteure.map((m) => [m.user, m])]).values()];
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={A.titel}
        untertitel={A.unter}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: A.titel }]}
        kennzahlen={[{ wert: offen.length, text: "offen" }, { wert: offen.filter((a) => a.faellig && a.faellig < heute).length, text: A.ueberfaellig }]}
        aktionen={<Segment label="Sicht" aktiv={sicht} optionen={[{ wert: "alle", titel: "Alle", href: "/projekte/aufgaben" }, { wert: "mir", titel: "Für mich", href: "/projekte/aufgaben?sicht=mir" }]} />}
      />
      <AufgabenBoard spalten={spalten} statusTon={tonKarte("PH Projekt Aufgabe")} projekte={projekte.filter((p) => LAUFEND.includes(p.status)).map((p) => ({ name: p.name, titel: p.titel }))} leute={leuteListe} vorProjekt={sp.projekt || ""} fokus={sp.neu === "1"} />
    </Shell>
  );
}
