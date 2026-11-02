// /de/portal/pflege – „Meine Stücke & Pflege“ (Service Nr. 4, Pflege-Abo).
// Komponenten: src/components/Portal/Pflege/** · Logik: src/lib/service/pflege/portal.js
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import MeineStuecke from "@/components/Portal/Pflege/MeineStuecke";
import { portalMetadata } from "@/lib/portal/metadata";
import { PORTAL_COPY } from "@/lib/service/pflege/copy";
import { buildCareEntries } from "@/lib/service/pflege/portal";

export const generateMetadata = portalMetadata({
  title: PORTAL_COPY.title,
  robots: { index: false, follow: false },
});

export default async function PflegePortalPage() {
  const portal = await getPortal("/de/portal/pflege");
  const [projects, appointments] = await Promise.all([portal.listProjects(), portal.listAppointments({ from: new Date().toISOString() })]);
  const passIds = [...new Set(projects.flatMap((p) => (p.items || []).map((i) => i.productPassId).filter(Boolean)))];
  const passList = await Promise.all(passIds.map((id) => portal.getProductPass(id)));
  const passes = Object.fromEntries(passIds.map((id, i) => [id, passList[i]]));
  // Optional, bis der Adapter-Vertrag erweitert ist (siehe Schnittstellen-Doku).
  const subscriptions = typeof portal.listCareSubscriptions === "function" ? await portal.listCareSubscriptions() : [];
  const entries = buildCareEntries({ projects, passes, appointments, subscriptions });

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader overline={PORTAL_COPY.overline} title={PORTAL_COPY.title} intro={PORTAL_COPY.intro} />
      <MeineStuecke entries={entries} />
    </>
  );
}
