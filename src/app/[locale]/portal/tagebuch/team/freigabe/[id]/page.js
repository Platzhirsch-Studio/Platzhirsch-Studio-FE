import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { portalMetadata } from "@/lib/portal/metadata";
import { formatDate, formatTime } from "@/lib/portal/format";
import { LEISTUNGEN } from "@/lib/content/projekte";
import { darf, teamLoginAktiv } from "@/lib/portal/tagebuch/konten";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";
import { FREIGABE_ID, slugVorschlag } from "@/lib/portal/tagebuch/schemas";
import { nennungVon, oeffentlicherOrt } from "@/lib/portal/tagebuch/anzeige";
import { teamAusCookies } from "@/lib/portal/tagebuch/zugriff";
import { Badge, Card, Notice, Overline } from "@/components/Portal/Core/ui";
import TeamPruefung from "@/components/Portal/Tagebuch/TeamPruefung";
import { tagebuchT } from "@/components/Portal/Tagebuch/texte";

// /de/portal/tagebuch/team/freigabe/[id] – Studio prüft eine Referenz-Freigabe:
// Einwilligung (Version, Zeitpunkt), Nennung, Bilder, Texte → veröffentlichen.

export const generateMetadata = portalMetadata({ title: "Referenz prüfen (Team)", robots: { index: false, follow: false } });

const ym = (iso) => String(iso || "").slice(0, 7);

export default async function FreigabePruefen({ params }) {
  const { locale, id } = await params;
  if (locale !== "de" || !teamLoginAktiv() || !FREIGABE_ID.test(id)) notFound();
  const team = await teamAusCookies();
  if (!team) redirect("/de/portal/tagebuch/team");
  const s = tagebuchT(await getTranslations());
  const a = tagebuchAdapter();
  const f = await a.leseFreigabe(id);
  if (!f) notFound();
  const tb = await a.leseTagebuch(f.projektId);
  // Alle Bilder liegen noch im Tagebuch (Löschen ist bei aktiver Freigabe gesperrt).
  const fotos = f.bilder.map((b) => ({ ...b, ...(tb?.fotos?.find((x) => x.id === b.id) || {}) }));
  const datumListe = (tb?.fotos || []).map((x) => x.hochgeladenAm).filter(Boolean).sort();
  const vorschlag = {
    slug: slugVorschlag(oeffentlicherOrt(f.anzeige), "projekt", f.id),
    von: ym(tb?.erstellt || datumListe[0] || f.erstellt),
    bis: ym(datumListe[datumListe.length - 1] || f.erstellt),
  };

  return (
    <>
      <header className="mb-6">
        <Link href="/de/portal/tagebuch/team" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <ArrowLeft size={16} aria-hidden="true" /> {s("teamTitle")}
        </Link>
        <Overline className="mt-2">{f.projektId}</Overline>
        <h1 className="mt-2 font-display text-[2rem] leading-tight text-ink sm:text-4xl">{s("reviewTitle")}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{s(`refStatus_${f.status}`)}</Badge>
          {f.beispiel && <Badge tone="ai">{s("example")}</Badge>}
        </div>
      </header>
      {f.beispiel && <div className="mb-5"><Notice tone="dev">{s("reviewExample")}</Notice></div>}
      <Card className="mb-5" aria-labelledby="fg-ew">
        <h2 id="fg-ew" className="mb-2 font-display text-xl text-ink">{s("reviewConsent")}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink/70">Version</dt>
          <dd className="m-0">{f.einwilligung.version} ({f.einwilligung.textStatus})</dd>
          <dt className="text-ink/70">Zeitpunkt</dt>
          <dd className="m-0">{formatDate(f.einwilligung.zeitpunkt)}, {formatTime(f.einwilligung.zeitpunkt)} Uhr · {f.einwilligung.kanal}</dd>
          <dt className="text-ink/70">{s("reviewNaming")}</dt>
          <dd className="m-0">{nennungVon(f.anzeige) || `${s("refAnonym")} (${oeffentlicherOrt(f.anzeige)})`}</dd>
          {f.widerruf && (
            <>
              <dt className="text-ink/70">Widerruf</dt>
              <dd className="m-0">{formatDate(f.widerruf.zeitpunkt)}, {formatTime(f.widerruf.zeitpunkt)} Uhr</dd>
            </>
          )}
        </dl>
      </Card>
      {(f.status === "eingereicht" || f.status === "veroeffentlicht") && !darf(team, "referenz_pruefen") ? (
        <Notice tone="info">{s("reviewRoleOnly", { name: team.name })}</Notice>
      ) : f.status === "eingereicht" || f.status === "veroeffentlicht" ? (
        <Card>
          <TeamPruefung freigabe={f} projektId={f.projektId} fotos={fotos} leistungenListe={[...LEISTUNGEN]} vorschlag={vorschlag} />
        </Card>
      ) : (
        <Notice tone="info">{s(`refStatus_${f.status}`)}</Notice>
      )}
    </>
  );
}
