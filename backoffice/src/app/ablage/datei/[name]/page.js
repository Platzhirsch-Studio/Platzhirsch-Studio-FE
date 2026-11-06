import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import DateiAkte, { DateiAkteKopf } from "@/components/Backoffice/Ablage/DateiAkte";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { infoFuerClient, ladeDatei, ladeFaehigkeiten, ladeFreigabelinks, ladeInfo, ladeNamen, ladeVerlauf, sicher } from "@/lib/backoffice/ablage/daten";
import { darstellung } from "@/lib/backoffice/faehigkeiten";
import { ordnerName } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;

export async function generateMetadata({ params: p }) {
  const { name } = await p;
  return { title: `${decodeURIComponent(name)} · Ablage` };
}

export default async function DateiSeite({ params: p, searchParams }) {
  const { name: roh } = await p;
  const name = decodeURIComponent(roh);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/ablage/datei/${encodeURIComponent(name)}`, sp, { akte: true });
  if (!NAME_RE.test(name)) notFound();
  const d = await sicher(() => ladeDatei(ctx, name));
  if (!d.ok && ["not_found", "forbidden"].includes(d.fehler.code)) notFound();
  if (!d.ok)
    return (
      <Shell session={ctx.session}>
        <Seitenkopf titel={T.seiten.datei} krumen={[...KRUMEN_BASIS, { titel: T.seiten.datei }]} />
        <Fehler code={d.fehler.code} message={d.fehler.message} zurueckHref="/ablage" />
      </Shell>
    );
  const datei = d.daten;
  const [links, verlauf, info, faehig] = await Promise.all([
    ladeFreigabelinks(ctx, name).catch(() => []),
    sp.tab === "verlauf" ? ladeVerlauf(ctx, name).catch(() => null) : Promise.resolve([]),
    sicher(() => ladeInfo(ctx)),
    ladeFaehigkeiten(ctx).catch(() => ({})),
  ]);
  const namen = await ladeNamen(ctx, [datei.hochgeladen_von, datei.gesperrt_von, ...(datei.versionen || []).map((v) => v.hochgeladen_von), ...links.map((l) => l.erstellt_von), ...(verlauf || []).map((e) => e.benutzer)]);
  const ordner = datei.kette?.[datei.kette.length - 1];
  const zurueck = ordner ? `/ablage?ordner=${encodeURIComponent(ordner.ordner)}` : "/ablage";
  const linkMailen = faehig["ablage.link_mailen"] ? darstellung(faehig["ablage.link_mailen"]) === "an" : false;
  const gemeinsam = { info: infoFuerClient(info.ok ? info.daten : null), user: ctx.user, rollen: ctx.rollen, schreiben: ctx.schreiben, linkMailen };
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf
        titel={datei.dateiname}
        ueber={ordner ? ordnerName(ordner) : undefined}
        zurueck={{ href: zurueck, titel: ordner ? ordnerName(ordner) : T.bereich }}
        krumen={[...KRUMEN_BASIS, ...(ordner ? [{ titel: ordnerName(ordner), href: zurueck }] : []), { titel: datei.dateiname }]}
        aktionen={<DateiAkteKopf datei={datei} {...gemeinsam} />}
      />
      <DateiAkte datei={datei} links={links} verlauf={verlauf} tab={sp.tab || "vorschau"} namen={namen} {...gemeinsam} />
    </Shell>
  );
}
