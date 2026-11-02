import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { Card } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import { PlanningForm } from "@/components/Portal/Docs/Forms";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Neue Planung anfragen",
  robots: { index: false, follow: false },
});

const STEPS = [
  ["Anfrage", "Sie beschreiben Raum und Vorhaben – Budget und Termin sind optional."],
  ["Rückmeldung", "Ihr Beratungsteam meldet sich innerhalb von zwei Werktagen."],
  ["Unterlagen", "Fotos und Grundrisse senden Sie über einen geschützten Upload-Link."],
  ["Planung", "Wir planen im Showroom in Lochau oder bei Ihnen vor Ort."],
];

export default async function AnfragenPage({ searchParams }) {
  const sp = await searchParams;
  const portal = await getPortal("/de/portal/anfragen");
  const projects = (await portal.listProjects()).map((p) => ({ id: p.id, title: p.title }));
  const defaultProjectId = projects.some((p) => p.id === sp?.projekt) ? sp.projekt : "";

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader
        overline="Das nächste Projekt"
        title="Neue Planung anfragen"
        intro="Ein weiterer Raum, eine Ergänzung oder ein ganz neues Vorhaben? Als Kunde starten Sie hier direkt – Ihre Daten kennen wir schon."
      />
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2" aria-label="Planungsanfrage">
          <PlanningForm projects={projects} defaultProjectId={defaultProjectId} />
        </Card>
        <aside aria-labelledby="anf-ablauf">
          <Card>
            <h2 id="anf-ablauf" className="font-display text-xl text-ink">
              So geht es weiter
            </h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold-text">
                    {i + 1}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="block leading-relaxed text-ink/70">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </>
  );
}
