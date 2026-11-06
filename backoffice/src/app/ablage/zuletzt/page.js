import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import Sammlung from "@/components/Backoffice/Ablage/Sammlung";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { infoFuerClient, ladeInfo, ladeNamen, ladeWurzeln, ladeZaehler, ladeZuletzt, sicher } from "@/lib/backoffice/ablage/daten";
import { sperreArt } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zuletzt · Ablage" };

export default async function AblageZuletzt({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage/zuletzt", sp);
  const ausgecheckt = sp.filter === "ausgecheckt";
  const [liste, wurzeln, zaehler, info] = await Promise.all([
    sicher(() => ladeZuletzt(ctx, { tage: ausgecheckt ? 3650 : 30, limit: ausgecheckt ? 500 : 90 })),
    sicher(() => ladeWurzeln(ctx)),
    ladeZaehler(ctx),
    sicher(() => ladeInfo(ctx)),
  ]);
  let items = liste.ok ? liste.daten : [];
  if (ausgecheckt) items = items.filter((d) => sperreArt(d, ctx.user) === "eigen");
  const namen = await ladeNamen(ctx, items.flatMap((x) => [x.hochgeladen_von, x.gesperrt_von]));
  const ordnerTitel = Object.fromEntries(items.map((d) => [d.ordner, d.bezug_titel || ""]));
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf
        titel={ausgecheckt ? "Von dir ausgecheckt" : T.seiten.zuletzt}
        krumen={[...KRUMEN_BASIS, { titel: T.seiten.zuletzt }]}
        untertitel={ausgecheckt ? "Andere können diese Dateien bis zum Einchecken nicht ändern." : "Geänderte Dateien der letzten 30 Tage"}
      />
      {liste.ok ? (
        <Sammlung
          variante="zuletzt"
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
          leer={T.leer.zuletzt}
        />
      ) : (
        <Fehler code={liste.fehler.code} message={liste.fehler.message} />
      )}
    </Shell>
  );
}
