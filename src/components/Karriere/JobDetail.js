import { houseCrumb } from "@/components/UberUns/houseCrumb";
import { Button, Eyebrow, Heading, LinkArrow, Section, SmartLink } from "@/components/ui";
import PageHeader from "@/components/UberUns/PageHeader";
import { softHyphens } from "@/components/UberUns/softHyphens";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { localizedJobDescription } from "@/lib/seo/structuredData";
import { localeUrl } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/utils/routing";
import ShareJob from "./ShareJob";
import BewerbungForm from "./BewerbungForm";
import { APPLICATION_EMAIL } from "./karriereposition";
import { fehlendeAngaben } from "./glbg";
import { localizedTitle } from "@/lib/karriere/stellen";
import { BEWERBUNG_ANSPRECHPERSON, entgeltText, karriereTexte } from "@/lib/karriere/texte";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";

const hasText = (value) => typeof value === "string" && value.trim() !== "";

// Per-language CMS tables (responsibilities_de/_en …), German as fallback.
function localizedRows(job, field, locale) {
  const own = job?.[`${field}_${locale}`];
  if (Array.isArray(own) && own.length > 0) return own;
  return Array.isArray(job?.[`${field}_de`]) ? job[`${field}_de`] : [];
}

function localizedString(job, field, locale) {
  const own = job?.[`${field}_${locale}`];
  if (hasText(own)) return own;
  return hasText(job?.[`${field}_de`]) ? job[`${field}_de`] : "";
}

function dateOf(value, locale) {
  const date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString(locale === "de" ? "de-AT" : locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

// QM wm-r4: soft hyphens at known compound joints (Kollektiv-/vertragliches …):
// at 200 % text size long words broke without a hyphen.
function Paragraphs({ text }) {
  return (
    <div className="space-y-4 text-body text-text">
      {text
        .split(/\n\s*\n/)
        .filter(hasText)
        .map((paragraph, i) => (
          <p key={i} className="max-w-measure whitespace-pre-line">
            {softHyphens(paragraph.trim())}
          </p>
        ))}
    </div>
  );
}

function RowList({ rows, field }) {
  const items = rows.map((row) => row?.[field]).filter(hasText);
  if (items.length === 0) return null;
  return (
    // QM wm-fix2: kein hängendes „[“ (html hat hanging-punctuation, Safari) –
    // in Zeilen und Werten stand die Klammer sonst über der Kante.
    <ul className="divide-y divide-line border-y border-line text-body text-text [hanging-punctuation:none]">
      {items.map((item, i) => (
        <li key={i} className="max-w-measure py-3">
          {softHyphens(item)}
        </li>
      ))}
    </ul>
  );
}

// Job detail (server component, R3-inhalt). Replaces the old client page:
//   - no react-share (third-party buttons and icons) – sharing is the Web
//     Share API with plain links as fallback (./ShareJob.js),
//   - no simulated application form: it showed „Vielen Dank für Ihre
//     Bewerbung“ without sending anything. Applications go by e-mail to the
//     contact named on the career page, as the list page says.
// Texts: inhalt.career (src/messages), inhalt.job / inhalt.share (proposal
// messages-r3-inhalt.json until merged).
// `blocked` (Vorschau, glbg.js): Stelle ohne Entgeltangabe – sichtbare
// Sperr-Markierung, fehlende Angaben als „[vom Inhaber ergänzen]“.
// bewerbungOnline: Gruppe "bewerbung" auf ph mit Zugang (src/lib/karriere/bewerbungSend.js) →
// Online-Formular (ph_personal.api.create_bewerbung); sonst nur der bisherige Weg per E-Mail.
export default function JobDetail({ job, blocked = false, bewerbungOnline = false }) {
  const { t, locale } = useInhalt("job");
  const career = useInhalt("career");
  const share = useInhalt("share");
  const common = useInhalt("common");
  const careerPath = ROUTES.karriere[locale] || ROUTES.karriere.de;
  const pageUrl = localeUrl(locale, `${careerPath}/${job.slug}`);
  const k = karriereTexte(locale);
  const title = localizedTitle(job, locale);
  const missing = blocked ? fehlendeAngaben(job) : [];

  const description = localizedJobDescription(job, locale);
  const sections = [
    { id: "tasks", title: t("tasks"), rows: localizedRows(job, "responsibilities", locale), field: "responsibility" },
    { id: "profile", title: t("profile"), rows: localizedRows(job, "requirement", locale), field: "anforderungen" },
    { id: "hours", title: t("hours"), rows: localizedRows(job, "working_hours", locale), field: "working_hours" },
    { id: "benefits", title: t("benefits"), rows: localizedRows(job, "benefits", locale), field: "benefit" },
  ]
    .map((section) =>
      // Vorschau: weitere Leistungen fehlen noch – sichtbar als Platzhalter.
      section.id === "benefits" && missing.includes("leistungen")
        ? { ...section, rows: [...section.rows, { benefit: `${k.platzhalter} ${k.fehlt.leistungen}` }] }
        : section
    )
    .filter((section) => section.rows.some((row) => hasText(row?.[section.field])));
  const statement = localizedString(job, "statement", locale);

  const posted = dateOf(job.posted || job.creation, locale);
  const facts = [
    { label: career.t("location"), value: career.t("locationValue") },
    {
      label: t("employment"),
      value: localizedString(job, "job_status", locale) || job.type || (blocked && job.statisch ? k.platzhalter : null),
    },
    ...(job.statisch ? [{ label: k.start, value: localizedString(job, "start", locale) || job.start || (blocked ? k.platzhalter : null) }] : []),
    { label: t("category"), value: localizedString(job, "category", locale) },
    { label: t("positions"), value: job.positions, tabular: true },
    job.entgelt
      ? { label: k.entgelt, value: entgeltText(job.entgelt, locale) || (blocked ? k.gesperrt : null) }
      : { label: t("salary"), value: hasText(String(job.salary ?? "")) ? `€ ${job.salary}` : null, tabular: true },
    { label: t("experience"), value: job.experience ? t("experienceValue", { years: job.experience }) : null, tabular: true },
    { label: t("posted"), date: posted },
  ].filter((fact) => (fact.date ? true : hasText(String(fact.value ?? ""))));

  const mailto = `mailto:${APPLICATION_EMAIL}?subject=${encodeURIComponent(t("mailSubject", { title }))}`;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: common.t("home"), href: "/" },
          houseCrumb(common.locale || "de"),
          { label: career.t("breadcrumb"), href: careerPath },
          { label: t("crumb") },
        ]}
        eyebrow={t("eyebrow")}
        title={title}
        lead={career.t("locationValue")}
      >
        <Button href="#bewerbung" variant="primary" arrow>
          {t("applyTitle")}
        </Button>
      </PageHeader>

      {blocked && (
        <Section as="div" spacing="compact">
          <div role="note" data-testid="job-blocked" className="max-w-text border border-line bg-stone p-4 text-small text-text">
            <p className="font-medium">{k.gesperrt}</p>
            <p className="mt-2">{k.vorschau}</p>
            <ul className="mt-2 list-disc pl-5">
              {missing.map((key) => (
                <li key={key}>
                  {softHyphens(k.fehlt[key])} {k.platzhalter}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      <Section as="div" tone="band" spacing="compact">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid @5xl/page:grid-cols-12">
          <div className="space-y-12 @5xl/page:col-span-7">
            {/* QM wm-fix4: small section titles 24 px above their text (as on
                /platzhirsch) and without the 8 px chapter lift (as="h2"), which
                pulled the title onto the text while it scrolled in. */}
            {hasText(description) && (
              <div>
                <Heading id="job-description" level={2} size="title" as="h2">
                  {t("description")}
                </Heading>
                <div className="mt-6">
                  <Paragraphs text={description} />
                </div>
              </div>
            )}
            {sections.map((section) => (
              <div key={section.id}>
                <Heading id={`job-${section.id}`} level={2} size="title" as="h2">
                  {section.title}
                </Heading>
                <div className="mt-6">
                  <RowList rows={section.rows} field={section.field} />
                </div>
              </div>
            ))}
            {hasText(statement) && (
              <div>
                <Heading id="job-statement" level={2} size="title" as="h2">
                  {t("statement")}
                </Heading>
                <div className="mt-6">
                  <Paragraphs text={statement} />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-10 @5xl/page:col-span-4 @5xl/page:col-start-9" aria-labelledby="job-facts">
            <div>
              <Heading id="job-facts" level={2} size="title" as="h2">
                {t("factsTitle")}
              </Heading>
              <dl className="mt-6 divide-y divide-line border-y border-line text-body [hanging-punctuation:none]">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
                    <dt className="text-text-soft">{softHyphens(fact.label)}</dt>
                    <dd className={fact.tabular ? "tabular text-text" : "text-text"}>
                      {fact.date ? <time dateTime={fact.date.iso}>{fact.date.label}</time> : softHyphens(fact.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <ShareJob
              url={pageUrl}
              title={title}
              labels={{
                title: share.t("title"),
                native: share.t("native"),
                copy: share.t("copy"),
                copied: share.t("copied"),
                copyFailed: share.t("copyFailed"),
                email: share.t("email"),
                whatsapp: share.t("whatsapp"),
                linkedin: share.t("linkedin"),
                newTab: common.t("newTab"),
                mailBody: share.t("mailBody", { url: pageUrl }),
              }}
            />
          </aside>
        </div>
      </Section>

      <Section labelledBy="bewerbung-title" id="bewerbung">
        <div className="max-w-text">
          <Eyebrow className="mb-stack-s">{t("applyEyebrow")}</Eyebrow>
          <Heading id="bewerbung-title" level={2}>
            {t("applyTitle")}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("applyText")}</p>
          {bewerbungOnline && !blocked && <BewerbungForm locale={locale} slug={job.slug} titel={title} email={APPLICATION_EMAIL} />}
          <div className="mt-stack-m">
            <Button href={mailto} variant="secondary" arrow>
              {t("applyMail")}
            </Button>
          </div>
          {/* Ansprechperson laut Inhaber (31.10.2026); Kontakt über die allgemeine Adresse. */}
          <p className="mt-stack-m text-small text-text" data-testid="job-contact-person">
            {k.ansprechperson}: {BEWERBUNG_ANSPRECHPERSON}
          </p>
          <p className="mt-2 break-all text-small text-text-soft">{APPLICATION_EMAIL}</p>
          <p className="mt-2 text-small text-text-soft">
            {k.telefon}: <a href={PHONE_HREF} className="underline underline-offset-4">{PHONE_DISPLAY}</a>
          </p>
          {/* Datenschutz: Bewerbung per E-Mail, erklärt unter /datenschutz#bewerbungen. */}
          <p className="mt-stack-s max-w-measure text-small text-text-soft">
            {k.datenschutzVor}{" "}
            <SmartLink href="/datenschutz#bewerbungen" className="underline underline-offset-4">
              {k.datenschutzLink}
            </SmartLink>
            .
          </p>
          <LinkArrow href={careerPath} className="mt-stack-m">
            {t("allJobs")}
          </LinkArrow>
        </div>
      </Section>
    </>
  );
}
