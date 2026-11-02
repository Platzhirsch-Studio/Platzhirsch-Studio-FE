// /de/ki-assistenten/bestaetigen#<token> – Double-Opt-in eines Terminwunschs aus
// einem KI-Assistenten. Der Token steht im Fragment (erreicht nie einen Server-Log);
// ConfirmClient liest ihn und spricht /api/agent/confirm an. noindex, nur Deutsch.
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui";
import ConfirmClient from "@/components/Agent/ConfirmClient";
import { CONFIRM } from "@/lib/agent/copy";

export const metadata = {
  title: CONFIRM.metaTitle,
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default async function Page({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return (
    <Container size="text" className="py-16 md:py-24">
      <Eyebrow>{CONFIRM.overline}</Eyebrow>
      <Heading level={1} size="display-m" className="mt-stack-s text-balance">
        {CONFIRM.title}
      </Heading>
      <Lead tone="soft" className="mt-stack-s">
        {CONFIRM.lead}
      </Lead>
      <ConfirmClient />
    </Container>
  );
}
