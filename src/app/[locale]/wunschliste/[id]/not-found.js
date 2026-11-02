// Unbekannter, widerrufener oder abgelaufener Wunschliste-Link (page.js ruft
// notFound()): HTTP 404 (Next setzt noindex) mit ruhigem Hilfetext statt der
// allgemeinen 404 – wer einen alten Link bekommt, weiß, was zu tun ist.
import { useLocale, useTranslations } from "next-intl";
import { Button, Container, Heading } from "@/components/ui";
import { localeOf, wlCopyFrom } from "@/lib/wunschliste/copy";

export default function WunschlisteNotFound() {
  const locale = localeOf(useLocale());
  const root = useTranslations();
  const c = wlCopyFrom(locale, root);
  return (
    <Container className="pt-14 pb-section">
      <div className="max-w-text">
        <Heading level={1} size="display-m" className="text-balance">
          {c("public.notFoundTitle")}
        </Heading>
        <p className="mt-stack-s max-w-measure text-body text-text-soft">{c("public.notFoundText")}</p>
        <Button href="/" variant="secondary" className="mt-stack-m">
          {c("public.notFoundCta")}
        </Button>
      </div>
    </Container>
  );
}
