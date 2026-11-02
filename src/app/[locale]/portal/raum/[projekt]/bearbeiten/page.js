import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { portalMetadata } from "@/lib/portal/metadata";
import { Badge, Overline } from "@/components/Portal/Core/ui";
import { RAUM_STATUS } from "@/lib/raumzwilling/config";
import { teamAusCookie } from "@/lib/raumzwilling/access";
import { teamAktiv } from "@/lib/raumzwilling/team";
import { leseRaum, PROJEKT_ID } from "@/lib/raumzwilling/store";
import { DEMO_RAEUME, demoAktiv } from "@/lib/raumzwilling/seed";
import { oeffentlicheSicht } from "@/lib/raumzwilling/zugriff";
import RaumEditor from "@/components/Portal/Raum/RaumEditor";

// /de/portal/raum/<projekt>/bearbeiten – Team-Werkzeug (nur Team-Rolle).

export const generateMetadata = portalMetadata({ title: "Raum bearbeiten (Team)", robots: { index: false, follow: false }, referrer: "no-referrer" });

export default async function BearbeitenSeite({ params }) {
  const { locale, projekt } = await params;
  if (locale !== "de" || !teamAktiv() || !PROJEKT_ID.test(projekt)) notFound();
  const team = await teamAusCookie();
  if (!team) redirect(`/de/portal/raum/team?next=${encodeURIComponent(`/de/portal/raum/${projekt}/bearbeiten`)}`);
  const raum = await leseRaum(projekt);
  if (!raum) notFound();

  return (
    <>
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/de/portal/raum/team" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <ArrowLeft size={16} aria-hidden="true" /> Alle Räume (Team)
          </Link>
          <span aria-hidden="true" className="text-ink/30">
            ·
          </span>
          <Overline>Raum-Werkzeug · {team.name}</Overline>
        </div>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:text-4xl">
          {raum.titel} · {projekt}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={RAUM_STATUS[raum.status]?.tone}>{RAUM_STATUS[raum.status]?.label}</Badge>
          <Link href={`/de/portal/raum/${projekt}`} className="inline-flex min-h-11 items-center px-2 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Kundenansicht öffnen
          </Link>
        </div>
        {raum.kennzeichnung && <p className="mt-3 border border-gold/50 bg-gold/10 px-3 py-2 text-sm">{raum.kennzeichnung}</p>}
      </header>
      <RaumEditor projektId={projekt} raum={oeffentlicheSicht(raum, "team")} demo={demoAktiv() && Boolean(DEMO_RAEUME[projekt])} />
    </>
  );
}
