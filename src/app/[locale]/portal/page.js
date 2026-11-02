import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { Advisor, Appointments, CurrentProject, Documents, Greeting, Messages, QuickLinks } from "@/components/Portal/Core/Dashboard";
import { Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice } from "@/components/Portal/Docs/SectionNav";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  // Das Template des Layouts greift nicht im eigenen Segment (R4 P3), daher absolut.
  title: { absolute: "Übersicht | Mein Platzhirsch" },
  robots: { index: false, follow: false },
});

export default async function PortalDashboard({ params }) {
  await params;
  const portal = await getPortal("/de/portal");

  const [projects, documents, appointments, messages] = await Promise.all([
    portal.listProjects(),
    portal.listDocuments(),
    portal.listAppointments({ from: new Date().toISOString() }),
    portal.listMessages(),
  ]);

  // "Current" project = most recently updated one that isn't handed over yet.
  const open = projects.filter((p) => p.currentStep !== "uebergabe");
  const current = open[0] || projects[0];
  const others = projects.filter((p) => p.id !== current?.id);
  const unread = messages.filter((m) => !m.read && m.from === "studio").length;
  const newDocuments = documents.filter((d) => d.status === "neu").length;

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />

      <Greeting customer={portal.customer} stats={{ projects: projects.length, newDocuments, unread }} />

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-5 lg:col-span-2 lg:space-y-6">
          {current ? <CurrentProject project={current} others={others} /> : <Empty>Noch kein Projekt angelegt.</Empty>}
          <Documents items={documents.slice(0, 4)} />
        </div>
        <div className="space-y-5 lg:space-y-6">
          <Appointments items={appointments.slice(0, 3)} />
          <Messages items={messages.slice(0, 3)} />
          <Advisor advisor={portal.customer.advisor} />
        </div>
      </div>

      <QuickLinks />
    </>
  );
}
