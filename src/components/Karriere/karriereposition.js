import { Button, Eyebrow, Heading, Section } from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { EMAIL, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { publishableJob, visibleJobs } from "./glbg";
import SmartLink from "@/components/ui/SmartLink";
import { localizedTitle } from "@/lib/karriere/stellen";
import { BEWERBUNG_ANSPRECHPERSON, entgeltText, karriereTexte } from "@/lib/karriere/texte";

const hasText = (value) => typeof value === "string" && value.trim() !== "";
function localizedField(job, field, locale) {
  const own = job?.[`${field}_${locale}`];
  if (hasText(own)) return own;
  return hasText(job?.[`${field}_de`]) ? job[`${field}_de`] : "";
}

// Runde 4 (r4-recht-inhalt P1-3, Fix-Team P6): applications go to the general
// address from src/lib/site.js. The former contact person (name, photo,
// personal address) was never confirmed by the owner and is not on the team
// page. Since 31.10.2026 the owner names Harald Menghin as contact person
// (BEWERBUNG_ANSPRECHPERSON, src/lib/karriere/texte.js); contact stays the
// general address and phone, no personal e-mail. The Datenschutz
// page explains the processing (section „Bewerbungen“, #bewerbungen).
export const APPLICATION_EMAIL = EMAIL;

// Benefits the owner has not confirmed are not shown (r3-R3-inhalt P3-6,
// r4-recht-inhalt P1-3): „faire Bezahlung“ in all four languages. Only that
// part is cut; the rest of the bullet stays („Flexible Arbeitszeiten“).
const UNCONFIRMED_BENEFIT = /\s*(?:und|and|et|e)\s+(?:faire Bezahlung|fair pay|rémunération équitable|retribuzione equa)\s*$/iu;
const UNCONFIRMED_ONLY = /^(?:faire Bezahlung|fair pay|rémunération équitable|retribuzione equa)$/iu;

/** Benefit bullets as they may be shown (unconfirmed ones removed). */
export function confirmedBullets(bullets) {
  return (Array.isArray(bullets) ? bullets : [])
    .map((b) => String(b || "").replace(UNCONFIRMED_BENEFIT, "").trim())
    .filter((b) => b && !UNCONFIRMED_ONLY.test(b));
}

function postedDate(value, locale) {
  const date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString(locale === "de" ? "de-AT" : locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

// Open positions + application contact (server component – every job title
// and link is in the HTML). Facts per job as <dl>; one secondary action per
// row, the page's one primary action is the closing CTA.
// The former floating badges "+15 % Bewerberzahl" and "#1 Arbeitgeberregion"
// were unsupported claims (UWG) and are gone.
const KarrierePosition = ({ karriere }) => {
  const { t, raw, locale } = useInhalt("career");
  const careerPath = ROUTES.karriere[locale] || ROUTES.karriere.de;
  const k = karriereTexte(locale);
  // GlBG § 9 Abs 2 (Rat 9,5 A13): öffentlich nur aktive Stellen mit
  // Entgeltangabe; in der Vorschau auch gesperrte, mit Markierung (./glbg.js).
  const jobs = visibleJobs(karriere);

  return (
    <>
      <Section labelledBy="career-jobs">
        <div className="max-w-text">
          <Eyebrow className="mb-stack-s">{t("jobsEyebrow")}</Eyebrow>
          <Heading id="career-jobs" level={2}>
            {t("jobsTitle")}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("jobsText")}</p>
        </div>

        {jobs.length === 0 ? (
          <p className="mt-stack-m max-w-measure border-t border-line pt-6 text-body text-text">{t("noJobs")}</p>
        ) : (
          <ul className="mt-12 grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3" data-testid="job-list">
            {jobs.map((job, index) => {
              const posted = postedDate(job.posted, locale);
              const title = localizedTitle(job, locale);
              const blocked = !publishableJob(job);
              const bereich = localizedField(job, "category", locale);
              const ausmass = localizedField(job, "job_status", locale) || job.type || (blocked && job.statisch ? k.platzhalter : "");
              return (
                <li
                  key={job.slug || index}
                  className="group relative flex flex-col border-t border-line pt-6"
                  data-blocked={blocked ? "true" : undefined}
                >
                  {blocked && (
                    <p className="mb-3 self-start border border-line bg-stone px-2 py-1 text-small font-medium text-text">{k.gesperrt}</p>
                  )}
                  <h3 className="text-title text-text">
                    <SmartLink
                      href={`${careerPath}/${job.slug}`}
                      className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
                    >
                      {title}
                    </SmartLink>
                  </h3>
                  {/* QM wm-fix2: ohne hängende Klammer – sonst „Ausmaß:[vom …]“ ohne Abstand (Safari). */}
                  <dl className="mt-3 space-y-1 text-small text-text-soft [hanging-punctuation:none]">
                    {bereich && (
                      <div className="flex gap-1.5">
                        <dt>{k.bereich}:</dt>
                        <dd className="text-text">{bereich}</dd>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <dt>{t("location")}:</dt>
                      <dd className="text-text">{t("locationValue")}</dd>
                    </div>
                    {ausmass && (
                      <div className="flex gap-1.5">
                        <dt>{k.ausmass}:</dt>
                        <dd className="text-text">{ausmass}</dd>
                      </div>
                    )}
                    {job.positions && (
                      <div className="flex gap-1.5">
                        <dt>{t("positions")}:</dt>
                        <dd className="tabular text-text">{job.positions}</dd>
                      </div>
                    )}
                    {!job.entgelt && job.salary && (
                      <div className="flex gap-1.5">
                        <dt>{t("salary")}:</dt>
                        <dd className="tabular text-text">€ {job.salary}</dd>
                      </div>
                    )}
                    {posted && (
                      <div className="flex gap-1.5">
                        <dt>{t("posted")}:</dt>
                        <dd className="tabular text-text">
                          <time dateTime={posted.iso}>{posted.label}</time>
                        </dd>
                      </div>
                    )}
                  </dl>
                  {/* § 9 Abs 2 GlBG: Mindestentgelt und Überzahlung schon in der Liste (Nr. 47). */}
                  {job.entgelt && entgeltText(job.entgelt, locale) && (
                    <p className="mt-3 text-small text-text-soft" data-testid="job-entgelt">
                      {entgeltText(job.entgelt, locale)}
                    </p>
                  )}
                  <p className="mt-4 text-small font-medium text-text" aria-hidden="true">
                    {t("viewJob")} →
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Application contact – the general address, no unconfirmed person */}
      <Section tone="band" labelledBy="career-contact">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-start-2">
            <Eyebrow className="mb-stack-s">{t("contactEyebrow")}</Eyebrow>
            <Heading id="career-contact" level={2}>
              {t("contactTitle")}
            </Heading>
            <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("contactText")}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="text-overline uppercase text-text-soft">{t("bulletsTitle")}</h3>
            <ul className="mt-3 divide-y divide-line border-y border-line text-body text-text">
              {confirmedBullets(raw("bullets")).map((bullet) => (
                <li key={bullet} className="py-3">
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-stack-m">
              <Button href={`mailto:${APPLICATION_EMAIL}`} variant="primary" arrow>
                {t("contactMail")}
              </Button>
            </div>
            <p className="mt-6 text-small text-text" data-testid="career-contact-person">
              {k.ansprechperson}: {BEWERBUNG_ANSPRECHPERSON}
            </p>
            <p className="mt-2 break-all text-small text-text-soft">{APPLICATION_EMAIL}</p>
            <p className="mt-2 text-small text-text-soft">
              {k.telefon}: <a href={PHONE_HREF} className="underline underline-offset-4">{PHONE_DISPLAY}</a>
            </p>
            <p className="mt-stack-s max-w-measure text-small text-text-soft">
              {k.datenschutzVor}{" "}
              <SmartLink href="/datenschutz#bewerbungen" className="underline underline-offset-4">
                {k.datenschutzLink}
              </SmartLink>
              .
            </p>
          </div>
        </div>
      </Section>

    </>
  );
};

export default KarrierePosition;
