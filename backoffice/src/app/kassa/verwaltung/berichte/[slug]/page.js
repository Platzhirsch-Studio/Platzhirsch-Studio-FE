import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { Balken } from "@/components/Backoffice/Charts";
import BerichtTabelle from "@/components/Backoffice/Kassa/BerichtTabelle";
import { KRUMEN, V, verwaltungsZugang } from "@/components/Backoffice/Kassa/Verwaltung";
import { bericht } from "@/lib/backoffice/kassa/daten";
import { VERWALTUNG } from "@/lib/backoffice/kassa/texte";
import { MONATE } from "@/lib/backoffice/datum";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: VERWALTUNG.berichte.liste.find((b) => b.slug === slug)?.titel || "Bericht" };
}

function monate(n = 4) {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return { wert: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`, titel: `${MONATE[x.getMonth()].slice(0, 3)} ${x.getFullYear()}` };
  }).reverse();
}

// Ein Bericht (Team B-KAS, Konzept §4.10): Monat als Segment, Diagramm bei Tageswerten, Tabelle mit Summe.
export default async function BerichtSeite({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const def = VERWALTUNG.berichte.liste.find((b) => b.slug === slug);
  if (!def) notFound();
  const { session, leitung } = await verwaltungsZugang(`${V}/berichte/${slug}`, "report");
  if (def.nurLeitung && !leitung) redirect("/kein-zugriff?bereich=kassa&aktion=cancel");
  const ms = monate();
  const monat = ms.some((m) => m.wert === sp?.monat) ? sp.monat : ms.at(-1).wert;
  const r = await bericht(session, def, { monat });
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={def.titel}
        untertitel={def.text}
        krumen={[...KRUMEN, { titel: VERWALTUNG.berichte.titel, href: `${V}/berichte` }, { titel: def.titel }]}
        aktionen={<Segment label="Monat" aktiv={monat} optionen={ms.map((m) => ({ ...m, href: `${V}/berichte/${slug}?monat=${m.wert}` }))} />}
      />
      <Bento>
        {r.chart && r.zeilen.length > 0 && <Balken className="col-span-12" titel={def.titel} punkte={r.zeilen.map((z) => ({ label: `${String(z[r.chart.label]).slice(8, 10)}.`, wert: z[r.chart.feld] }))} format="cent-rund" einblenden />}
        <Kachel className="col-span-12" titel="Zahlen" unter={r.quelle === "server" ? "Bericht des Servers" : "Aus Belegen und Abschlüssen gerechnet"}>
          {r.zeilen.length === 0 ? <Leer titel="Keine Daten in diesem Monat" groesse="karte" /> : <BerichtTabelle spalten={r.spalten} zeilen={r.zeilen} />}
        </Kachel>
      </Bento>
    </Shell>
  );
}
