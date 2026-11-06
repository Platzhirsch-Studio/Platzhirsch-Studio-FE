import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { BERICHTE as T } from "@/lib/backoffice/logistik/texte";
import { seite } from "../_teile";

export const metadata = { title: "Berichte Logistik" };
export const dynamic = "force-dynamic";

// Berichte (§ 4.15): die Script Reports von ph_logistik; Wert-Berichte nur Leitung/GF.
export default async function Berichte() {
  const { session, leitung } = await seite("/logistik/berichte");
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.titel} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.titel }]} />
      <Bento testid="berichte">
        {T.liste.filter((b) => !b.leitung || leitung).map((b) => (
          <Kachel key={b.slug} className="md:col-span-4" titel={b.titel} unter={b.report} href={`/logistik/berichte/${b.slug}`} />
        ))}
      </Bento>
    </Shell>
  );
}
