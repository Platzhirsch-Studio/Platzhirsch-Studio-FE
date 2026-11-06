import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import Freigaben from "@/components/Backoffice/Ablage/Freigaben";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { infoFuerClient, ladeFreigaben, ladeInfo, ladeNamen, sicher } from "@/lib/backoffice/ablage/daten";
import { resttage } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Freigaben · Ablage" };

export default async function AblageFreigaben({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage/freigaben", sp);
  const beendet = sp.reiter === "beendet";
  const [daten, info] = await Promise.all([sicher(() => ladeFreigaben(ctx, { beendet })), sicher(() => ladeInfo(ctx))]);
  const links = daten.ok ? daten.daten.links : [];
  const namen = await ladeNamen(ctx, links.map((l) => l.erstellt_von));
  const bald = links.filter((l) => l.status === "Aktiv" && (resttage(l.ablauf) ?? 99) <= 3).length;
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf
        titel={T.seiten.freigaben}
        krumen={[...KRUMEN_BASIS, { titel: T.seiten.freigaben }]}
        kennzahlen={daten.ok && !beendet ? [{ wert: links.length, text: "aktive Links" }, { wert: bald, text: "laufen in 3 Tagen ab" }] : []}
      />
      <Erstbesuch text={T.erstbesuch.freigaben} route="/ablage/freigaben" />
      <div className="mb-6">
        <Segment
          label="Freigaben"
          aktiv={beendet ? "beendet" : "aktiv"}
          optionen={[
            { wert: "aktiv", titel: T.freigaben.reiter.aktiv, href: "/ablage/freigaben" },
            { wert: "beendet", titel: T.freigaben.reiter.beendet, href: "/ablage/freigaben?reiter=beendet" },
          ]}
          testid="abl-freigaben-reiter"
        />
      </div>
      {daten.ok ? (
        <Freigaben links={links} portal={daten.daten.portal} beendet={beendet} info={infoFuerClient(info.ok ? info.daten : null)} user={ctx.user} rollen={ctx.rollen} schreiben={ctx.schreiben} namen={namen} />
      ) : (
        <Fehler code={daten.fehler.code} message={daten.fehler.message} />
      )}
    </Shell>
  );
}
