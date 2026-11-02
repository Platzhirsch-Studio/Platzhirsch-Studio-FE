import ConsentEmbed from "@/components/Cookies/ConsentEmbed";
import { Eyebrow, Heading, Hairline, LinkArrow, Section } from "@/components/ui";
import { ADDRESS, DIRECTIONS_URL, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import useInhalt from "./inhalt/useInhalt";

// Visit block of "Das Haus": opening hours as <dl> (same hours as the
// LocalBusiness JSON-LD in [locale]/layout.js), address, contact, route and
// the Street View tour behind the Google-Maps consent (ConsentEmbed).
// Server component; only ConsentEmbed is a client island.
export default function Ausstellung() {
  const { t } = useInhalt("about");
  const common = useInhalt("common");
  const hours = common.raw("hours") || [];

  return (
    <Section labelledBy="about-visit">
      <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12">
        <div className="lg:col-span-5 xl:col-start-2 xl:col-span-4">
          <Eyebrow className="mb-stack-s">{t("visitEyebrow")}</Eyebrow>
          <Heading id="about-visit" level={2}>
            {t("visitTitle")}
          </Heading>

          <div className="mt-stack-m space-y-8 text-body">
            <div>
              <h3 className="text-overline uppercase text-text-soft">{common.t("hoursTitle")}</h3>
              <dl className="mt-3 divide-y divide-line border-y border-line">
                {hours.map((row) => (
                  <div key={row.days} className="flex flex-wrap justify-between gap-x-6 py-3">
                    <dt className="text-text">{row.days}</dt>
                    <dd className="tabular text-text-soft">{row.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-small text-text-soft">{common.t("hoursNote")}</p>
            </div>

            <div>
              <h3 className="text-overline uppercase text-text-soft">{common.t("addressTitle")}</h3>
              <address className="mt-3 not-italic text-text">
                Platzhirsch Home Living
                <br />
                {ADDRESS.street}
                <br />
                {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.country}
              </address>
              <LinkArrow href={DIRECTIONS_URL} target="_blank" className="mt-1">
                {common.t("route")}
                <span className="sr-only"> {common.t("newTab")}</span>
              </LinkArrow>
            </div>

            <div>
              <h3 className="text-overline uppercase text-text-soft">{common.t("contactTitle")}</h3>
              <ul className="mt-1">
                <li>
                  <a href={PHONE_HREF} className="inline-flex min-h-11 items-center gap-2 text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    <span className="text-text-soft">{common.t("phone")}</span>
                    <span className="tabular">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a href={EMAIL_HREF} className="inline-flex min-h-11 items-center gap-2 break-all text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    <span className="text-text-soft">{common.t("email")}</span>
                    <span>{EMAIL}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <h3 className="text-title text-text">{t("tourTitle")}</h3>
          <p className="mt-stack-s max-w-measure text-body text-text-soft">{t("tourText")}</p>
          <Hairline className="my-6" />
          <div className="aspect-[4/5] w-full bg-surface-band sm:aspect-[3/2]">
            <ConsentEmbed service="googleMaps" className="h-full">
              <iframe
                title="Google Street View – Showroom Platzhirsch Home Living, Lochau"
                src="https://www.google.com/maps/embed?pb=!4v1735203151096!6m8!1m7!1sCAoSLEFGMVFpcE9INDQ0M1hMX3BwU2dfbm5RTzlnb2hVR0hDTzBuU1k1cEdBV2JO!2m2!1d47.53018791759509!2d9.751478651722408!3f280!4f0!5f0.7820865974627469"
                allowFullScreen
                loading="lazy"
                className="h-full w-full border-0"
              />
            </ConsentEmbed>
          </div>
        </div>
      </div>
    </Section>
  );
}
