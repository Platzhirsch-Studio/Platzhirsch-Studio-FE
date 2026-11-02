import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { NewsletterSignup } from "./NewsletterContent";

// Newsletter page opening (server component).
const NewsletterBanner = () => {
  const { t } = useInhalt("newsletter");
  const common = useInhalt("common");

  return (
    <PageHeader
      breadcrumbs={[{ label: common.t("home"), href: "/" }, { label: t("title") }]}
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
      image={{ src: "/Images/Newsletter/minotti-patio.jpg", alt: t("heroAlt") }}
    >
      {/* QM content-legal r3: the sign-up next to the photo (no empty left half). */}
      <NewsletterSignup />
    </PageHeader>
  );
};

export default NewsletterBanner;
