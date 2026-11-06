// /de/portal/kundenkarte – „Meine Kundenkarte“ im Kundenportal.
// Daten nur über getPortal() (Sitzung geprüft): portal.getCustomerCard() →
// Adapter-Vertrag src/lib/portal/adapters/interface.js (Frappe später:
// ph_kundenkarte.api.portal_card). Komponenten: src/components/Portal/Kundenkarte/.
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import MeineKarte from "@/components/Portal/Kundenkarte/MeineKarte";
import { portalMetadata } from "@/lib/portal/metadata";

const COPY = {
  overline: "Mein Platzhirsch",
  title: "Meine Kundenkarte",
  intro: "Ihre Stufe, Ihre Vorteile und was Sie davon schon genutzt haben. Guthaben oder Punkte gibt es nicht – alle Vorteile sind Leistungen.",
};

export const generateMetadata = portalMetadata({
  title: COPY.title,
  robots: { index: false, follow: false },
});

export default async function PortalKundenkartePage() {
  const portal = await getPortal("/de/portal/kundenkarte");
  const card = await portal.getCustomerCard();
  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader overline={COPY.overline} title={COPY.title} intro={COPY.intro} />
      <MeineKarte card={card} customer={portal.customer} />
    </>
  );
}
