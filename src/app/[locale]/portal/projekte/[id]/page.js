import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { PROJECT_STEPS } from "@/lib/portal/constants";
import StatusTimeline from "@/components/Portal/Core/StatusTimeline";
import { Badge, Card, Empty, Overline } from "@/components/Portal/Core/ui";
import PlanungWorkspace from "@/components/Portal/Planung/PlanungWorkspace";
import { loadPlanning } from "@/components/Portal/Planung/server/planungData";
import { portalMetadata } from "@/lib/portal/metadata";
import { tagebuchVerfuegbar } from "@/lib/portal/tagebuch/config";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";

// /de/portal/projekte/[id] – project detail with the planning area:
// gallery (A/B/C), before/after, comparison, 3D, pins, votes, voice notes,
// thread with the team and approval ("bitte Angebot").

export const generateMetadata = portalMetadata({
  title: "Projekt",
  robots: { index: false, follow: false },
});

const ITEM_STATUS = { geplant: "geplant", angeboten: "angeboten", bestellt: "bestellt", geliefert: "geliefert", montiert: "montiert" };

export default async function ProjektPage({ params }) {
  const { locale, id } = await params;
  if (locale !== "de") notFound();
  const portal = await getPortal(`/de/portal/projekte/${encodeURIComponent(id)}`);
  // Short links (e-mails, QA scripts): /projekte/aktuell and /projekte/demo open
  // the customer's current project (most recently updated, not yet handed over).
  if (id === "aktuell" || id === "demo") {
    const projects = await portal.listProjects();
    const current = projects.find((p) => p.currentStep !== "uebergabe") || projects[0];
    redirect(current ? `/de/portal/projekte/${encodeURIComponent(current.id)}` : "/de/portal/projekte");
  }
  const planning = await loadPlanning(portal, id);
  if (!planning) notFound();
  const { project, variants } = planning;
  const step = PROJECT_STEPS.find((s) => s.key === project.currentStep);

  return (
    <>
      {adapterName() === "mock" && (
        <p className="mb-4 border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-ink sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
          Demo-Daten: Visualisierungen sind Platzhalter, Antworten des Teams sind Beispieltexte. Keine Preise.
        </p>
      )}

      <header className="mb-5 lg:mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/de/portal/projekte"
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Alle Projekte
          </Link>
          <span aria-hidden="true" className="text-ink/30">
            ·
          </span>
          <Overline>{project.room}</Overline>
        </div>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">{project.title}</h1>
        {project.summary && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">{project.summary}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="gold">Aktuell: {step?.label || project.currentStep}</Badge>
          <Badge>Projekt {project.id}</Badge>
        </div>
        {/* Projekt-Tagebuch (Inhaber-Entscheidung Nr. 13): Fotos je Phase, Vorher/Nachher, Referenz-Freigabe.
            Nur mit verbundenem Speicher (Frappe-Adapter ist noch Platzhalter) – QA Technik P1-2. */}
        {tagebuchVerfuegbar(tagebuchAdapter()) && (
          <Link
            href={`/de/portal/projekte/${encodeURIComponent(project.id)}/tagebuch`}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 border border-ink/30 px-4 text-sm font-semibold text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Projekt-Tagebuch öffnen
          </Link>
        )}
      </header>

      <Card className="mb-5 lg:mb-6" aria-label="Projektstatus">
        <StatusTimeline steps={project.steps} />
      </Card>

      {variants.length ? (
        <PlanungWorkspace
          projectId={project.id}
          variants={variants}
          beforeScene={planning.beforeScene}
          initialEntries={planning.entries}
          initialVotes={planning.votes}
          initialApproval={planning.approval}
        />
      ) : (
        <Empty>Für dieses Projekt gibt es noch keine Planung. Sobald Ihr Beratungsteam Visualisierungen bereitstellt, erscheinen sie hier.</Empty>
      )}

      {project.items?.length > 0 && (
        <Card className="mt-5 lg:mt-6" aria-labelledby="positionen-title">
          <h2 id="positionen-title" className="mb-4 font-display text-xl text-ink sm:text-2xl">
            Positionen
          </h2>
          <ul className="divide-y divide-ink/10">
            {project.items.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">
                    {item.quantity > 1 ? `${item.quantity} × ` : ""}
                    {item.name} <span className="font-normal text-ink/70">· {item.brand}</span>
                  </p>
                  {item.variant && <p className="text-sm text-ink/70">{item.variant}</p>}
                </div>
                <Badge>{ITEM_STATUS[item.status] || item.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
