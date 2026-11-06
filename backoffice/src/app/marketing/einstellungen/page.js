// /marketing/einstellungen – Einstellungen (10-konzept-marketing § 2.14, T9, nur Leitung): Zustandsleiste mit Ampeln,
// Bereitschaft für den Livebetrieb (K11), Schalter mit Außenwirkung, Reiter mit Speicherleiste.
import { redirect } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import { AkteTabs } from "@/components/Backoffice/Akte";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { EinstellungenFormular } from "@/components/Backoffice/Marketing/Verwaltung";
import { marketingKontext } from "@/lib/backoffice/marketing/daten";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { bereitschaftPunkte } from "@/lib/backoffice/marketing/regeln";
import { EINSTELLUNGEN, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Einstellungen") };

export default async function EinstellungenSeite({ searchParams }) {
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: "/marketing/einstellungen", doctype: "PH Marketing Einstellungen" });
  if (!ctx.leitung) redirect("/kein-zugriff?bereich=marketing&aktion=einstellungen");
  const a = ctx.an;
  const b = bereitschaftPunkte({ faehig: { einladungen: a.einladungen, einwilligungKanaele: a.kanaele, bestandskunde: a.bestandskunde, stoppRegeln: a.stoppRegeln, bestaetigungStapel: false, widerspruch: a.widerspruch, empfehlungAuftrag: a.gutschein, gutschein: a.gutschein, abmeldeToken: a.abmeldeToken, testmailIntern: a.testmailIntern }, einst: ctx.einst });
  const tabs = Object.entries(EINSTELLUNGEN.tabs).map(([id, titel]) => ({ id, titel }));
  const tab = aktiverTab(tabs, sp.tab);
  return (
    <Rahmen ctx={ctx}>
      <Seitenkopf titel={EINSTELLUNGEN.titel} untertitel={EINSTELLUNGEN.untertitel} krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: EINSTELLUNGEN.titel }]} />
      <div className="mb-6"><AkteTabs tabs={tabs} aktiv={tab} basis="/marketing/einstellungen" params={{}} /></div>
      <EinstellungenFormular key={tab} einst={ctx.einst} tab={tab} bereitschaft={b} p0Offen={b.p0Offen} />
    </Rahmen>
  );
}
