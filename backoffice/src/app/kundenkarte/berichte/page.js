import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { erlaubteBerichte } from "@/lib/backoffice/kundenkarte/daten";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berichte · Kundenkarte" };

const TEXT = { kundenwert: T.berichte.kundenwert, stufenwechsel: T.berichte.stufenwechsel, vorteile: T.berichte.vorteile, "ohne-einkauf": T.berichte.ohneEinkauf, manuell: T.berichte.manuell };

export default async function BerichteSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/berichte", sp);
  const liste = erlaubteBerichte(ctx.rolle);
  return (
    <Shell session={ctx.session}>
      <Seitenkopf titel={T.berichte.liste} krumen={[...KRUMEN_BASIS, { titel: T.berichte.liste }]} untertitel="Nur Anzahlen – Euro sieht ausschließlich die Leitung." />
      <Bento testid="kk-berichte">
        {liste.map((b) => (
          <Kachel key={b.id} className="md:col-span-6 xl:col-span-4" titel={TEXT[b.id].titel} unter={TEXT[b.id].text} href={`/kundenkarte/berichte/${b.id}`} oeffnenLabel={`${TEXT[b.id].titel} öffnen`} testid={`kk-bericht-${b.id}`} />
        ))}
      </Bento>
    </Shell>
  );
}
