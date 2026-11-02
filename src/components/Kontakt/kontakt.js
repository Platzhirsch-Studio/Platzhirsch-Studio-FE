// Kontaktseite im Neuauftritt (Design-Bibel §2, §4–§6, §9, §14).
// Server component: address, phone, e-mail, opening hours and the form's
// labels are in the server HTML. Client islands: the form (KontaktForm) and
// the map behind the consent gate (ConsentEmbed, Google Maps only after opt-in).
// All business facts come from src/lib/site.js – the house number is NOT set
// here (Firmenbuch question open, see r2-R2-leads.md).
import { useLocale, useTranslations } from "next-intl";
import { Eyebrow, Heading, LinkArrow, Section, cx } from "@/components/ui";
import ConsentEmbed from "@/components/Cookies/ConsentEmbed";
import {
  ADDRESS,
  DIRECTIONS_URL,
  EMAIL,
  EMAIL_HREF,
  GEO,
  PHONE_DISPLAY,
  PHONE_HREF,
  SITE_NAME,
} from "@/lib/site";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import SelfReportField from "@/components/Forms/SelfReportField";
import KontaktForm from "./KontaktForm";
// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15): nur mit WHATSAPP_NUMBER.
import WhatsApp from "@/components/WhatsApp";
import { OPENING_HOURS, contactCopy, countryName, weekday } from "./copy";
// QM content-legal r3: one time format per page – the footer's house format („10–18 Uhr“).
import { houseTimeRange } from "@/components/Navbar/menuHours";

const dtClass = "text-overline uppercase text-text-soft";
const ddClass = "mt-2 text-body text-text";
const inlineLink =
  "inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

// QM content-legal r2 (200 % text): the address broke mid-word ("platz / hirsch.stud /
// io", break-all). Break opportunities only after "@" and before the dot.
function emailParts(email) {
  const [user, host = ""] = String(email).split("@");
  const dot = host.lastIndexOf(".");
  return dot > 0 ? [user + "@", host.slice(0, dot), host.slice(dot)] : [email];
}

function mapSrc() {
  const q = encodeURIComponent(`${SITE_NAME}, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`);
  return `https://maps.google.com/maps?q=${q}&ll=${GEO.latitude},${GEO.longitude}&z=17&output=embed`;
}

function OpeningHours({ locale, closed }) {
  return (
    // QM r2: days and hours side by side from 18rem (container query), stacked with 200 % text.
    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-body @min-[18rem]:grid-cols-[auto_1fr]">
      {OPENING_HOURS.map((row) => (
        <div key={row.days.join("-")} className="contents">
          <dt className="whitespace-nowrap text-text">
            {row.days.length === 2 && !row.closed
              ? `${weekday(locale, row.days[0])} – ${weekday(locale, row.days[1])}`
              : row.days.map((d) => weekday(locale, d)).join(", ")}
          </dt>
          <dd className={cx("tabular whitespace-nowrap", row.closed ? "text-text-soft" : "text-text")}>
            {row.closed ? closed : houseTimeRange(locale, row.from, row.to)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Kontakt() {
  const locale = useLocale();
  const t = useTranslations("contact");
  const c = (key) => contactCopy(t, locale, key);

  return (
    <>
      {/* Besuch: address, phone, mail, hours, map */}
      {/* QM r3: compact band – 180 px of empty beige stood above „Besuch“. */}
      <Section tone="band" spacing="compact" labelledBy="kontakt-besuch-title">
        {/* QM content-legal r2 (200 % text): columns follow the space in rem (container
            query) – with large text address, map and hours stack instead of one word per line. */}
        <div className="@container">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid @min-[56rem]:grid-cols-12">
          <div className="@container min-w-0 @min-[56rem]:col-span-5">
            <Eyebrow className="mb-stack-s">{c("visitEyebrow")}</Eyebrow>
            <Heading id="kontakt-besuch-title" level={2}>
              {c("visitTitle")}
            </Heading>

            <dl className="mt-stack-m grid grid-cols-1 gap-8 @min-[28rem]:grid-cols-2">
              <div>
                <dt className={dtClass}>{c("addressLabel")}</dt>
                <dd className={ddClass}>
                  <address className="not-italic">
                    {SITE_NAME}
                    <br />
                    {ADDRESS.street}
                    <br />
                    {ADDRESS.postalCode} {ADDRESS.city}
                    <br />
                    {countryName(locale, ADDRESS.countryCode)}
                  </address>
                  <LinkArrow href={DIRECTIONS_URL} target="_blank" className="mt-2">
                    {t("directions")}
                    <span className="sr-only"> ({c("newTab")})</span>
                  </LinkArrow>
                </dd>
              </div>
              <div>
                <dt className={dtClass}>{t("phone")}</dt>
                <dd className={ddClass}>
                  <a href={PHONE_HREF} className={cx(inlineLink, "tabular")}>
                    {PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={dtClass}>{t("email")}</dt>
                <dd className={ddClass}>
                  <a href={EMAIL_HREF} className={cx(inlineLink, "flex-wrap")}>
                    {emailParts(EMAIL).map((part, i) => (
                      <span key={i} className="whitespace-nowrap">
                        {part}
                      </span>
                    ))}
                  </a>
                </dd>
              </div>
              <div className="@min-[28rem]:col-span-2">
                <dt className={dtClass}>{t("opening")}</dt>
                <dd className="mt-0">
                  <OpeningHours locale={locale} closed={c("closed")} />
                  <p className="mt-3 max-w-[34ch] text-small text-text-soft">{c("byAppointment")}</p>
                </dd>
              </div>
            </dl>

            {/* "Schreiben statt anrufen": hint first, then wa.me (#whatsapp
                opens it, e.g. from the concierge). Nothing without a number. */}
            <WhatsApp locale={locale} variant="block" copy="kontakt" anchorId="whatsapp" headingLevel={3} className="mt-12 border-t border-line pt-8" />
          </div>

          <div className="min-w-0 @min-[56rem]:col-span-6 @min-[56rem]:col-start-7">
            {/* Fixed ratio = no layout shift when the map loads after consent. */}
            {/* Optik QA: hairline frame – raised on band alone read as an empty half. */}
            {/* QM content-legal r3 (laptop/1920): the square placeholder was very tall and faint – 5:4, stronger frame. */}
            <div className="aspect-[4/5] w-full border border-line-strong bg-surface-raised sm:aspect-[3/2] @min-[56rem]:aspect-[5/4]">
              <ConsentEmbed service="googleMaps">
                <iframe
                  title={c("mapTitle")}
                  src={mapSrc()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
              </ConsentEmbed>
            </div>
          </div>
        </div>
        </div>
      </Section>

      {/* Nachricht: the form. Below the fold on every device (top 1870–2430 px),
          so its first layout is skipped until it nears the viewport
          (content-visibility:auto, R6-release fix): the form's <select> made
          Chromium force a 330–380 ms style+layout task when parsing ended
          (A/B on the prod build: TBT mobile 480 → about 220 ms). The content
          stays in the DOM, the accessibility tree and find-in-page; the
          intrinsic sizes are the measured heights (mobile 1434, lg 1159 px),
          "auto" remembers the real size after the first render. */}
      <Section
        id="nachricht"
        spacing="compact"
        labelledBy="kontakt-form-title"
        className="scroll-mt-20 lg:scroll-mt-24 [content-visibility:auto] [contain-intrinsic-size:auto_1430px] lg:[contain-intrinsic-size:auto_1160px]"
      >
        <div className="@container">
        <div className="grid grid-cols-1 gap-y-10 gap-x-grid @min-[56rem]:grid-cols-12">
          {/* Motion: the intro lifts in once with its heading (12 px, transform only); the form itself stays put. */}
          <div className="reveal min-w-0 [--reveal-y:12px] @min-[56rem]:col-span-4">
            <Eyebrow className="mb-stack-s">{t("formHeadline")}</Eyebrow>
            <Heading id="kontakt-form-title" level={2}>
              {t("welcomeBack")}
            </Heading>
            <p className="mt-5 max-w-measure text-body text-text-soft">{t("welcomeMsg")}</p>
            <p className="mt-stack-m max-w-measure text-body text-text-soft">
              {c("formAside")}{" "}
              {/* QM r2: plain inline link in running text (inline-flex min-h-11 gave its
                  line a larger leading); WCAG 2.5.8 exempts links inside a sentence. */}
              <a href={PHONE_HREF} className="tabular whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {PHONE_DISPLAY}
              </a>
            </p>
          </div>
          <div className="min-w-0 @min-[56rem]:col-span-7 @min-[56rem]:col-start-6 xl:@min-[56rem]:col-span-6 xl:@min-[56rem]:col-start-7">
            {/* Static parts rendered here on the server (R5-leads-perf, TBT). */}
            <KontaktForm privacyNote={<FormPrivacyNote />} selfReport={<SelfReportField id="kontakt-selbstauskunft" />} />
          </div>
        </div>
        </div>
      </Section>
    </>
  );
}
