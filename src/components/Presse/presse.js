import { houseCrumb } from "@/components/UberUns/houseCrumb";
import { Eyebrow, Heading, Section } from "@/components/ui";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { softHyphens } from "@/components/UberUns/softHyphens";

// QM wm-fix4: flex-wrap – at 200 % text size the label ("E-Mail") moves above
// the value instead of being split „E-M|ail“ beside it.
const LINK =
  "inline-flex min-h-11 flex-wrap items-center gap-x-2 text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

// Press page opening + press contact (server component).
// Rat 9,5 B5 (QA Recht −0,4): no photo without documented rights. The former
// hero (cool-living-room.jpg or the CMS image) and the contact photo
// (black-chair-and-desk.jpg) have freigabe "offen" in
// Marktresearch/recht/bildrechte.csv and look like manufacturer images →
// text-only opening, like the legal pages. A released photo can come back
// once its row in bildrechte.csv is "erteilt".
const Presse = () => {
  const { t } = useInhalt("press");
  const common = useInhalt("common");

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: common.t("home"), href: "/" }, houseCrumb(common.locale || "de"), { label: t("title") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead")}
      />

      <Section tone="band" labelledBy="press-contact">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 xl:col-start-2 xl:col-span-7">
            <Eyebrow className="mb-stack-s">{t("contactEyebrow")}</Eyebrow>
            <Heading id="press-contact" level={2}>
              {t("contactTitle")}
            </Heading>
            <p className="mt-stack-m max-w-measure text-body text-text-soft">{softHyphens(t("contactText"))}</p>
            <ul className="mt-stack-m text-ui">
              <li>
                <a href={EMAIL_HREF} className={`${LINK} break-all`}>
                  <span className="text-text-soft">{common.t("email")}</span>
                  <span>{EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={PHONE_HREF} className={LINK}>
                  <span className="text-text-soft">{common.t("phone")}</span>
                  <span className="tabular">{PHONE_DISPLAY}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Presse;
