import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import Kachel from "@/components/Backoffice/Kachel";
import { Balken } from "@/components/Backoffice/Charts";
import BerichtTabelle from "@/components/Backoffice/Kundenkarte/BerichtTabelle";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { BERICHTE, erlaubteBerichte, ladeBericht, ladeBerater, ladeFaehigkeiten, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { darfBetraege, darfSchreiben } from "@/lib/backoffice/kundenkarte/regeln";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";

const TEXT = { kundenwert: T.berichte.kundenwert, stufenwechsel: T.berichte.stufenwechsel, vorteile: T.berichte.vorteile, "ohne-einkauf": T.berichte.ohneEinkauf, manuell: T.berichte.manuell };

export async function generateMetadata({ params: p }) {
  const { report } = await p;
  return { title: `${TEXT[report]?.titel || "Bericht"} · Kundenkarte` };
}

export default async function BerichtSeite({ params: p, searchParams }) {
  const { report } = await p;
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/kundenkarte/berichte/${report}`, sp);
  if (!BERICHTE.some((b) => b.id === report) || !erlaubteBerichte(ctx.rolle).some((b) => b.id === report)) notFound(); // K16
  const meine = sp.meine === "1";
  const [r, berater, faehig] = await Promise.all([sicher(() => ladeBericht(ctx, report, { meine })), ladeBerater(ctx), ladeFaehigkeiten(ctx)]);
  const betraege = darfBetraege(ctx.rolle);
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf titel={TEXT[report].titel} untertitel={TEXT[report].text} krumen={[...KRUMEN_BASIS, { titel: T.berichte.liste, href: "/kundenkarte/berichte" }, { titel: TEXT[report].titel }]} zurueck="/kundenkarte/berichte" kennzahlen={r.ok ? [{ wert: r.daten.zeilen.length, text: "Zeilen" }] : []} />
      {report === "kundenwert" && betraege && !faehig["kundenkarte.umsatzregeln"]?.an && <p className="bo-kk-warn mb-4">{T.berichte.imAufbau}</p>}
      {!r.ok ? (
        <Fehler code={r.fehler.code} message={r.fehler.message} />
      ) : (
        <div className="flex flex-col gap-5">
          {report === "vorteile" && r.daten.zeilen.length > 0 && (
            <Kachel titel="Einlösungen je Vorteil" unter={T.berichte.fussVorteile}>
              <Balken kachel={false} punkte={r.daten.zeilen.map((z) => ({ label: z.titel.length > 14 ? `${z.titel.slice(0, 13)}…` : z.titel, wert: z.einloesungen }))} einblenden />
            </Kachel>
          )}
          <BerichtTabelle report={report} zeilen={r.daten.zeilen} betraege={betraege} berater={berater} darfAufgaben={darfSchreiben(ctx.rolle)} meine={meine} />
        </div>
      )}
    </Shell>
  );
}
