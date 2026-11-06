import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import Stufenplan from "@/components/Backoffice/Kundenkarte/Stufenplan";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { ladeStufenplan, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { darfBetraege, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import { druckHref } from "@/lib/backoffice/druck/index";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stufen & Vorteile · Kundenkarte" };

export default async function StufenSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/stufen", sp);
  const r = await sicher(() => ladeStufenplan(ctx));
  const erste = r.ok ? r.daten.stufen[0]?.name : null;
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf
        titel={T.seiten.stufen}
        krumen={[...KRUMEN_BASIS, { titel: T.seiten.stufen }]}
        untertitel="Leistungen ohne Geldwert – jede höhere Stufe enthält alles aus der Stufe darunter."
        aktionen={erste ? <Knopf icon="Printer" href={druckHref("PH Kundenkarte Stufe", erste, "PH Kundenkarte Vorteilsuebersicht")}>{T.stufen.drucken}</Knopf> : null}
      />
      {istLeitung(ctx.rolle) && <Erstbesuch text={T.erstbesuch.stufen} route="/kundenkarte/stufen" />}
      {r.ok ? <Stufenplan stufen={r.daten.stufen} vorteile={r.daten.vorteile} kartenJeStufe={r.daten.kartenJeStufe} nutzung={r.daten.nutzung} leitung={istLeitung(ctx.rolle)} betraege={darfBetraege(ctx.rolle)} startPanel={/^vorteil:[\w-]{3,60}$/.test(sp.panel || "") ? sp.panel : ""} /> : <Fehler code={r.fehler.code} message={r.fehler.message} />}
    </Shell>
  );
}
