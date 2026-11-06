import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import Drive, { DriveKnoepfe } from "@/components/Backoffice/Ablage/Drive";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { infoFuerClient, ladeDrive, ladeFaehigkeiten, ladeInfo, ladeNamen, ladeZaehler, sicher } from "@/lib/backoffice/ablage/daten";
import { groesseText, ordnerName } from "@/lib/backoffice/ablage/regeln";
import { darstellung } from "@/lib/backoffice/faehigkeiten";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  return { title: sp?.q ? `Suche · Ablage` : "Dateien · Ablage" };
}

export default async function AblageDateien({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage", sp);
  const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;
  const ordner = NAME_RE.test(sp.ordner || "") ? sp.ordner : "";
  const [daten, info, zaehler, faehig] = await Promise.all([
    sicher(() => ladeDrive(ctx, { ordner, q: (sp.q || "").slice(0, 100), sort: sp.sort, endung: (sp.endung || "").slice(0, 120) })),
    sicher(() => ladeInfo(ctx)),
    ladeZaehler(ctx),
    ladeFaehigkeiten(ctx).catch(() => ({})),
  ]);
  const d = daten.ok ? daten.daten : null;
  const items = d?.dateien.items || [];
  const namen = d ? await ladeNamen(ctx, [...items, ...(d.suche || [])].flatMap((x) => [x.hochgeladen_von, x.gesperrt_von])) : {};
  const ordnerTitel = {};
  if (d && !ordner) for (const x of items) ordnerTitel[x.ordner] = x.bezug_titel || "";
  const zip = faehig["ablage.zip_download"];
  const zipStatus = zip ? { an: darstellung(zip) === "an", grundText: zip.grund ? `${zip.grund}${zip.ersatz?.titel ? ` – ${zip.ersatz.titel}` : ""}` : undefined } : { an: false };
  const letzter = d?.kette?.[d.kette.length - 1];
  const titel = (letzter && ordnerName(letzter)) || d?.aktuell?.titel || T.bereich;
  const summe = items.reduce((s, x) => s + (Number(x.groesse) || 0), 0);
  const unter = letzter?.ist_bezugswurzel ? letzter.bezug_name || undefined : d?.aktuell?.bezug_titel && d.aktuell.bezug_titel !== titel ? d.aktuell.bezug_titel : undefined;
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf
        titel={titel}
        ueber={ordner ? T.kopf.ueber : undefined}
        untertitel={unter}
        krumen={[...KRUMEN_BASIS.slice(0, 1), { titel: T.bereich, href: "/ablage" }, ...(ordner ? [{ titel }] : [])]}
        kennzahlen={ordner && d ? [{ wert: d.dateien.gesamt, text: T.kopf.dateien }, ...(summe ? [{ wert: groesseText(summe), text: T.kopf.belegt }] : [])] : []}
        aktionen={<DriveKnoepfe ordner={ordner} anlegen={ctx.anlegen} hochladenGrund="Erst einen Ordner öffnen" />}
      />
      <Erstbesuch text={T.erstbesuch.dateien} route="/ablage" />
      {d ? (
        <Drive
          key={`${ordner}|${sp.q || ""}`}
          daten={d}
          params={{ ordner, ansicht: sp.ansicht || "", sort: sp.sort || "", q: sp.q || "", endung: sp.endung || "", datei: sp.datei || "", hochladen: sp.hochladen === "1" }}
          info={infoFuerClient(info.ok ? info.daten : null)}
          user={ctx.user}
          rollen={ctx.rollen}
          schreiben={ctx.schreiben}
          anlegen={ctx.anlegen && (info.ok || ctx.modus !== "frappe")}
          zaehler={zaehler}
          namen={namen}
          ordnerTitel={ordnerTitel}
          zipStatus={zipStatus}
          linkMailen={faehig["ablage.link_mailen"] ? darstellung(faehig["ablage.link_mailen"]) === "an" : false}
        />
      ) : (
        <Fehler code={daten.fehler.code} message={daten.fehler.message} zurueckHref="/ablage" />
      )}
    </Shell>
  );
}
