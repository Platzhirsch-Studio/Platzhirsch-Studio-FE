import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import Sammlung from "@/components/Backoffice/Ablage/Sammlung";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { infoFuerClient, ladeInfo, ladeNamen, ladePapierkorb, ladeWurzeln, ladeZaehler, sicher } from "@/lib/backoffice/ablage/daten";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Papierkorb · Ablage" };

export default async function AblagePapierkorb({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage/papierkorb", sp);
  const [liste, wurzeln, zaehler, info] = await Promise.all([sicher(() => ladePapierkorb(ctx)), sicher(() => ladeWurzeln(ctx)), ladeZaehler(ctx), sicher(() => ladeInfo(ctx))]);
  const items = liste.ok ? liste.daten.items || [] : [];
  const namen = await ladeNamen(ctx, items.map((x) => x.hochgeladen_von));
  const ordnerTitel = Object.fromEntries(items.map((d) => [d.ordner, d.bezug_titel || ""]));
  const tage = info.ok ? info.daten.papierkorb_tage : 30;
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf titel={T.seiten.papierkorb} krumen={[...KRUMEN_BASIS, { titel: T.seiten.papierkorb }]} kennzahlen={liste.ok ? [{ wert: items.length, text: "Dateien" }, { wert: `${tage} Tage`, text: "bis zum Löschen" }] : []} />
      <Erstbesuch text={T.erstbesuch.papierkorb} route="/ablage/papierkorb" />
      {liste.ok ? (
        <Sammlung
          variante="papierkorb"
          items={items}
          wurzeln={wurzeln.ok ? wurzeln.daten : []}
          zaehler={zaehler}
          info={infoFuerClient(info.ok ? info.daten : null)}
          user={ctx.user}
          rollen={ctx.rollen}
          schreiben={ctx.schreiben}
          namen={namen}
          ordnerTitel={ordnerTitel}
          ansicht={sp.ansicht === "liste" ? "liste" : "raster"}
          leer={T.leer.papierkorb}
        />
      ) : (
        <Fehler code={liste.fehler.code} message={liste.fehler.message} />
      )}
    </Shell>
  );
}
