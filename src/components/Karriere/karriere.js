import { houseCrumb } from "@/components/UberUns/houseCrumb";
import { Eyebrow, Heading, Section } from "@/components/ui";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";

// Career page opening + "Arbeiten bei uns" (server component).
// Rat 9,5 B5 (QA Recht −0,4): no photo without documented rights – the CMS
// image, livingroom-view.jpg and unique-workplace.jpg are "offen" in
// Marktresearch/recht/bildrechte.csv. Text-only until a released photo exists.
const Team = () => {
  const { t, raw } = useInhalt("career");
  const common = useInhalt("common");

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: common.t("home"), href: "/" }, houseCrumb(common.locale || "de"), { label: t("breadcrumb") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead")}
      />

      <Section tone="band" labelledBy="career-intro">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 xl:col-start-2 xl:col-span-7">
            <Eyebrow className="mb-stack-s">{t("introEyebrow")}</Eyebrow>
            <Heading id="career-intro" level={2}>
              {t("introTitle")}
            </Heading>
            <div className="mt-stack-m space-y-4 text-body text-text-soft">
              {(raw("introText") || []).map((paragraph, i) => (
                <p key={i} className="max-w-measure">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Team;
