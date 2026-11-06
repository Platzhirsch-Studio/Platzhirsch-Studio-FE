import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import { Bento } from "@/components/Backoffice/Kachel";
import Kachel from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { Balken } from "@/components/Backoffice/Charts";
import { berichtDaten, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { berichtKennzahlen, bestellungenJeMonat, bestellungenNachStatus, produkteJeMarke, termintreue } from "@/lib/backoffice/sortiment/berichte";
import { BERICHTE, GLOSSAR } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berichte · Sortiment" };

export default async function BerichtePage() {
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/berichte", doctype: "PH Produkt" });
  const d = await berichtDaten(client);
  const k = berichtKennzahlen(d);
  const monate = bestellungenJeMonat(d.bestellungen);
  const treue = termintreue(d.bestellungen);
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={BERICHTE.titel} untertitel={BERICHTE.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: BERICHTE.titel }]} />
      <Bento>
        <Kennzahl className="md:col-span-6 xl:col-span-3" titel={BERICHTE.preisVeraltet} wert={k.preisVeraltet} href="/sortiment/produkte?sicht=veraltet" />
        <Kennzahl className="md:col-span-6 xl:col-span-3" titel={BERICHTE.ohneBild} wert={k.ohneBild} href="/sortiment/produkte?sicht=ohneBild" />
        <Kennzahl className="md:col-span-6 xl:col-span-3" titel={BERICHTE.shopOhneLieferzeit} wert={k.shopOhneLieferzeit} href="/sortiment/freigaben?art=lieferzeiten" />
        <Kennzahl className="md:col-span-6 xl:col-span-3" titel={BERICHTE.reklamiert30} wert={k.reklamiert30} href="/sortiment/wareneingang?status=Reklamiert" />
        <Balken className="md:col-span-12 xl:col-span-7" titel={BERICHTE.jeMonat} untertitel={BERICHTE.jeMonatUnter} punkte={monate.map((m) => ({ label: m.label, wert: m.wert }))} hervorheben={monate.length - 2} laufend="letzter" hoehe={180} />
        <Balken className="md:col-span-12 xl:col-span-5" titel={BERICHTE.nachStatus} untertitel={BERICHTE.nachStatusUnter} punkte={bestellungenNachStatus(d.bestellungen).map((s) => ({ label: GLOSSAR.bestellStatus[s.status], wert: s.wert }))} hoehe={180} />
        <Balken className="md:col-span-12 xl:col-span-7" titel={BERICHTE.jeMarke} untertitel={BERICHTE.jeMarkeUnter} punkte={produkteJeMarke(d.produkte)} hoehe={180} />
        <Kachel className="md:col-span-12 xl:col-span-5" titel={BERICHTE.termintreue} unter={BERICHTE.termintreueUnter}>
          {treue.length === 0 ? (
            <p className="bo-sor-unter">Noch keine Bestellungen mit bestätigtem Termin.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {treue.map((t) => (
                <li key={t.label} className="flex items-center gap-3">
                  <Link href={`/sortiment/lieferanten/${encodeURIComponent(t.label)}`} className="w-44 shrink-0 truncate text-[14px] hover:underline">
                    {t.label}
                  </Link>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-bo-fill-2" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-bo-text" style={{ width: `${Math.min(100, (Math.max(0, t.wert) / Math.max(1, ...treue.map((x) => x.wert))) * 100)}%` }} />
                  </span>
                  <span className="w-24 text-right text-[14px] tabular-nums">
                    {t.wert > 0 ? "+" : ""}
                    {t.wert.toLocaleString("de-DE")} Tage
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
      </Bento>
    </Shell>
  );
}
