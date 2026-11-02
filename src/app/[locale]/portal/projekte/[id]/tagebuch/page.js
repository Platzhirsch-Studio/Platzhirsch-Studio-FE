import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getAdapter } from "@/lib/portal/adapters";
import { PORTAL_LOGIN_PATH } from "@/lib/portal/config";
import { portalMetadata } from "@/lib/portal/metadata";
import { leseRaum } from "@/lib/raumzwilling/store";
import { EINWILLIGUNG, LIMITS, referenzFreigabeAktiv, referenzTauglich, tagebuchVerfuegbar } from "@/lib/portal/tagebuch/config";
import { tagebuchSeitenZugriff } from "@/lib/portal/tagebuch/zugriff";
import { freigabenDesProjekts, ladeTagebuch, nachPhasen } from "@/lib/portal/tagebuch/service";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";
import { Badge, Card, Notice, Overline } from "@/components/Portal/Core/ui";
import Zeitleiste from "@/components/Portal/Tagebuch/Zeitleiste";
import VorherNachher from "@/components/Portal/Tagebuch/VorherNachher";
import FotoUpload from "@/components/Portal/Tagebuch/FotoUpload";
import ReferenzFreigabe from "@/components/Portal/Tagebuch/ReferenzFreigabe";
import { tagebuchT } from "@/components/Portal/Tagebuch/texte";

// /de/portal/projekte/[id]/tagebuch – Projekt-Tagebuch (Inhaber-Entscheidung Nr. 13):
// Zeitleiste Handzeichnung → Modell → Rendering → Lieferung → Montage → Vorher/Nachher,
// Upload für Kunde und Studio-Team, „Als Referenz freigeben“ mit Vorschau und Einwilligung.
// Zugriff: Kunde des Projekts (Portal-Session) oder Studio-Team (Team-Cookie).

export const generateMetadata = portalMetadata({ title: "Projekt-Tagebuch", robots: { index: false, follow: false } });

export default async function TagebuchSeite({ params }) {
  const { locale, id } = await params;
  if (locale !== "de") notFound();
  const z = await tagebuchSeitenZugriff(id);
  if (z.status === 401) redirect(`${PORTAL_LOGIN_PATH}?next=${encodeURIComponent(`/de/portal/projekte/${id}/tagebuch`)}`);
  if (!z.rolle) notFound();
  // Ohne verbundenen Speicher bzw. in Produktion ohne DSE-Ergänzung: kein Tagebuch (QA Technik P1-2).
  if (!tagebuchVerfuegbar(tagebuchAdapter())) notFound();
  const s = tagebuchT(await getTranslations());

  const tb = z.rolle === "kunde" ? await ladeTagebuch(z.projekt, z.kunde.id) : await tagebuchAdapter().leseTagebuch(id);
  const fotos = tb?.fotos || [];
  const gruppen = nachPhasen(fotos);
  let skizzen = [];
  try {
    skizzen = ((await leseRaum(id))?.skizzen || []).filter((sk) => sk.echt);
  } catch {
    skizzen = [];
  }
  const renderings = z.rolle === "kunde" ? (await getAdapter().listRenderings(z.kunde.id, id)).length : 0;
  const freigaben = (await freigabenDesProjekts(id)).map((f) => ({
    id: f.id,
    status: f.status,
    bilder: f.bilder.length,
    slug: f.status === "veroeffentlicht" ? f.pruefung?.slug || null : null,
    einwilligung: { version: f.einwilligung.version, zeitpunkt: f.einwilligung.zeitpunkt },
  }));
  const beispiel = fotos.some((f) => f.beispiel);

  return (
    <>
      <header className="mb-5 lg:mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {z.rolle === "kunde" ? (
            <Link href={`/de/portal/projekte/${encodeURIComponent(id)}`} className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              <ArrowLeft size={16} aria-hidden="true" /> {s("backProject")}
            </Link>
          ) : (
            <Link href="/de/portal/tagebuch/team" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              <ArrowLeft size={16} aria-hidden="true" /> {s("teamTitle")}
            </Link>
          )}
          <span aria-hidden="true" className="text-ink/30">·</span>
          <Overline>{s("overline")}</Overline>
        </div>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">{z.projekt.title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">{s("intro")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{s("privateNote")}</Badge>
          {z.rolle === "team" && <Badge tone="new">Team: {z.team.name}</Badge>}
        </div>
      </header>

      {beispiel && (
        <div className="mb-5">
          <Notice tone="dev">{s("demoNotice")}</Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-6">
        <Card aria-labelledby="tb-zeitleiste">
          <h2 id="tb-zeitleiste" className="mb-6 font-display text-2xl text-ink sm:text-3xl">
            {s("timelineTitle")}
          </h2>
          <Zeitleiste projektId={id} gruppen={gruppen} skizzen={skizzen} renderings={renderings} rolle={z.rolle} s={s} />
        </Card>
        <div className="space-y-5 lg:space-y-6">
          <Card aria-labelledby="tb-vn">
            <h2 id="tb-vn" className="mb-4 font-display text-xl text-ink sm:text-2xl">
              {s("beforeAfterTitle")}
            </h2>
            <VorherNachher projektId={id} vorher={gruppen.vorher} nachher={gruppen.nachher} />
          </Card>
          <Card>
            <FotoUpload projektId={id} rolle={z.rolle} />
          </Card>
        </div>
      </div>

      {z.rolle === "kunde" ? (
        <Card className="mt-5 lg:mt-6">
          <ReferenzFreigabe
            projektId={id}
            fotos={fotos.filter(referenzTauglich)}
            freigaben={freigaben}
            aktiv={referenzFreigabeAktiv()}
            entwurf={EINWILLIGUNG.status !== "freigegeben"}
            einwilligung={{ version: EINWILLIGUNG.version, absaetze: [...EINWILLIGUNG.absaetze] }}
            max={LIMITS.maxFotosJeFreigabe}
          />
        </Card>
      ) : (
        freigaben.length > 0 && (
          <Card className="mt-5 lg:mt-6" aria-labelledby="tb-fg">
            <h2 id="tb-fg" className="mb-3 font-display text-xl text-ink">{s("refExisting")}</h2>
            <ul className="divide-y divide-ink/10">
              {freigaben.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>{s(`refStatus_${f.status}`)}</span>
                  <Link href={`/de/portal/tagebuch/team/freigabe/${f.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    {s("teamReview")}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}
    </>
  );
}
