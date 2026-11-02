import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { PROJECT_STEPS } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";
import { Badge, Empty, Overline } from "@/components/Portal/Core/ui";
import { loadPlanning } from "@/components/Portal/Planung/server/planungData";
import VariantImage from "@/components/Portal/Planung/VariantImage";
import { portalMetadata } from "@/lib/portal/metadata";

// /de/portal/projekte – all projects of the customer with their latest planning.

export const generateMetadata = portalMetadata({
  title: "Projekte",
  robots: { index: false, follow: false },
});

export default async function ProjektePage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const portal = await getPortal("/de/portal/projekte");
  const projects = await portal.listProjects();
  const plannings = await Promise.all(projects.map((p) => loadPlanning(portal, p.id)));

  return (
    <>
      <Overline>Ihre Vorhaben</Overline>
      <h1 className="mt-1 mb-6 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">Ihre Projekte</h1>
      {!projects.length && <Empty>Noch kein Projekt angelegt.</Empty>}
      <ul className="grid gap-5 md:grid-cols-2">
        {plannings.filter(Boolean).map(({ project, variants, approval }) => {
          const latest = variants[variants.length - 1];
          const step = PROJECT_STEPS.find((s) => s.key === project.currentStep);
          return (
            <li key={project.id}>
              <Link
                href={`/de/portal/projekte/${project.id}`}
                className="group block overflow-hidden border border-ink/10 bg-white transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <div className="relative aspect-16/9 bg-stone">
                  {latest ? <VariantImage variant={latest} /> : null}
                  <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {latest?.aiGenerated && (
                      <span className="border border-ink/40 bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-ink">KI-generiert</span>
                    )}
                    {latest && !latest.imageUrl && <span className="bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-ink">Platzhalter</span>}
                  </span>
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{project.room}</p>
                  <h2 className="font-display text-2xl text-ink">{project.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="gold">{step?.label || project.currentStep}</Badge>
                    <Badge>
                      {variants.length} {variants.length === 1 ? "Variante" : "Varianten"}
                    </Badge>
                    {approval && <Badge tone="new">Freigegeben</Badge>}
                  </div>
                  <p className="flex items-center justify-between pt-1 text-sm text-ink/70">
                    <span>Aktualisiert {formatDate(project.updatedAt)}</span>
                    <span className="inline-flex items-center gap-1 text-ink underline decoration-ink/25 underline-offset-4">
                      Öffnen <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
