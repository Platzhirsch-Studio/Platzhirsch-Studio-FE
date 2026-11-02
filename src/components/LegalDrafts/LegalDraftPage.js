import { Badge, Breadcrumbs, Container, Eyebrow, Heading, Lead, SmartLink, cx } from "@/components/ui";
import { DOCS, DOC_SLUGS, docCounts, docOpenPoints, sectionOpenPoints } from "./index";
import { Block, Inline, KIND_LABEL, MARK_CLASS, PART_CLASS } from "./Prose";
import { LEGAL_APPROVAL, LEGAL_STATE_LABEL, LEGAL_TEXTS } from "./liveStatus";

const APPROVED_DE = LEGAL_APPROVAL.approvedAt.split("-").reverse().join(".");

// Page frame of one legal draft preview (Neuauftritt: ui primitives, light
// surfaces, no radius, no shadow). Layout: header with document switch,
// review box (band), then table of contents (sticky from lg) + text column.

const LINK = "underline decoration-line-strong underline-offset-4 hover:decoration-current";

export function DocSwitch({ current }) {
  return (
    <nav aria-label="Rechtstexte" className="mt-stack-m">
      <ul className="flex flex-wrap gap-2">
        {DOC_SLUGS.map((slug) => {
          const active = slug === current;
          return (
            <li key={slug}>
              <SmartLink
                href={`/preview/recht/${slug}`}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-11 items-center border px-4 text-ui transition-colors duration-(--duration-micro)",
                  active ? "border-action bg-action text-text-inverse" : "border-line-control text-text hover:border-action"
                )}
              >
                {DOCS[slug].navLabel}
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function StatusBadges({ section, count }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {count > 0 ? (
        <Badge tone="band" data-status="offen">
          [anwaltlich prüfen] · {count} {count === 1 ? "offene Stelle" : "offene Stellen"}
        </Badge>
      ) : (
        <Badge data-status="ohne">[anwaltlich prüfen] · Gesamttext</Badge>
      )}
      {section.module && <Badge>Modul – nur wenn live</Badge>}
      {section.added && <Badge>Neu ergänzt</Badge>}
      {section.draftOnly && <Badge>Nur für die Kanzlei</Badge>}
      {section.label && <Badge>{section.label}</Badge>}
    </div>
  );
}

function SectionBody({ section, level }) {
  const count = sectionOpenPoints(section).length;
  const headingId = `${section.id}-titel`;
  return (
    <section id={section.id} aria-labelledby={headingId} className="scroll-mt-28">
      <StatusBadges section={section} count={count} />
      <Heading level={level} size={level === 2 ? "title" : "subtitle"} id={headingId} className="mt-3 text-balance">
        {section.num && <span className="mr-2 text-text-soft">{section.num}</span>}
        {section.title}
      </Heading>
      {(section.source || section.added) && (
        <p className="mt-1 text-small text-text-soft">
          {section.added ? <>Neu aus {section.added}</> : <>Quelle: {section.source}</>}
        </p>
      )}
      {section.blocks?.length > 0 && (
        <div className="mt-4">
          {section.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      )}
      {section.sub?.length > 0 && (
        <div className="mt-8 space-y-12 border-l border-line pl-4 md:pl-6">
          {section.sub.map((sub) => (
            <SectionBody key={sub.id} section={sub} level={3} />
          ))}
        </div>
      )}
    </section>
  );
}

function Toc({ doc }) {
  return (
    <nav aria-label="Inhalt" className="lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
      <p className="text-overline uppercase text-text-soft">Inhalt</p>
      <ol className="mt-3 space-y-1 text-small">
        {doc.sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="inline-flex min-h-8 items-baseline gap-2 py-1 hover:underline">
              {s.num && <span className="shrink-0 text-text-soft">{s.num}</span>}
              <span>{s.title}</span>
            </a>
            {s.sub?.length > 0 && (
              <ol className="mb-2 ml-4 hidden border-l border-line pl-3 lg:block">
                {s.sub.map((sub) => (
                  <li key={sub.id}>
                    <a href={`#${sub.id}`} className="inline-flex min-h-7 items-baseline gap-2 py-0.5 text-text-soft hover:text-text hover:underline">
                      <span className="shrink-0">{sub.num}</span>
                      <span>{sub.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
        <li>
          <a href="#offene-stellen" className="inline-flex min-h-8 items-baseline gap-2 py-1 hover:underline">
            Alle offenen Stellen
          </a>
        </li>
      </ol>
    </nav>
  );
}

function ReviewBox({ doc, counts }) {
  const live = LEGAL_TEXTS.find((t) => t.id === doc.slug);
  return (
    <section aria-labelledby="pruefhinweis-titel" className="bg-surface-band py-12 md:py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-grid">
          <div className="lg:col-span-5">
            <Heading level={2} size="title" id="pruefhinweis-titel">
              Stand der Freigabe
            </Heading>
            <p className="mt-4 max-w-measure">
              Kanzlei-Fassung, freigegeben am {APPROVED_DE}{live ? <> ({LEGAL_STATE_LABEL[live.state]})</> : null}. Diese Seite ist nur im Entwicklungsmodus
              oder mit <code className="bg-surface px-1">LEGAL_PREVIEW=1</code> erreichbar, wird nie indexiert und steht in keiner Sitemap.{" "}
              {doc.livePath ? (
                <>
                  Öffentlich gilt die live Seite{" "}
                  <SmartLink href={doc.livePath} className={LINK}>
                    {doc.livePath}
                  </SmartLink>
                  ; Angaben des Unternehmens erscheinen dort erst, wenn sie wörtlich eingetragen sind.
                </>
              ) : (
                <>Eine live Seite gibt es dafür noch nicht.</>
              )}
            </p>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-small">
              <dt className="font-medium">Offene Stellen</dt>
              <dd>{counts.total}</dd>
              {Object.keys(KIND_LABEL).map((kind) => (
                <div key={kind} className="contents">
                  <dt>
                    <mark className={MARK_CLASS}>[{KIND_LABEL[kind]}]</mark>
                  </dt>
                  <dd>{counts[kind]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-small text-text-soft">
              Markiert ist jede eckige Klammer aus dem Entwurf: Rechtsfragen, fehlende Fakten des Unternehmens und Anbieterangaben. Kästen „Anmerkung“ und „Hinweis zur
              Vorschau“ sind nicht Teil des Textes.
            </p>
            <p className="mt-2 text-small text-text-soft" data-count-rule="">
              Zählregel: Jede äußere Klammer ist eine offene Stelle. Klammern darin (<span className={PART_CLASS}>[so markiert]</span>) gehören zu dieser Stelle und
              werden mit ihr erledigt
              {counts.parts > 0 ? ` – in diesem Text ${counts.parts} ${counts.parts === 1 ? "innere Klammer" : "innere Klammern"}, nicht gesondert gezählt` : ""}.
              Abschnitts-Badges, diese Summe und die Liste am Ende zählen gleich.
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            {doc.knownErrors?.length > 0 && (
              <>
                <Heading level={3} size="subtitle">
                  {doc.slug === "datenschutz" ? "Die 5 bekannten Fehler der heutigen Datenschutzerklärung" : "Bekannte Mängel der heutigen Seite"}
                </Heading>
                <ol className="mt-3 space-y-3">
                  {doc.knownErrors.map((e) => (
                    <li key={e.id} className="border-t border-line-strong pt-3">
                      <p className="font-medium">
                        <span className="mr-2 text-text-soft">{e.id}</span>
                        {e.title}
                      </p>
                      <p className="mt-1 text-small">{e.text}</p>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <Heading level={3} size="subtitle" className={doc.knownErrors?.length ? "mt-8" : undefined}>
              Quellen
            </Heading>
            <ul className="mt-3 space-y-1 text-small">
              {doc.sources.map((s) => (
                <li key={s}>
                  <code className="break-words">{s}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

function OpenPointList({ doc }) {
  const groups = docOpenPoints(doc);
  return (
    <section id="offene-stellen" aria-labelledby="offene-stellen-titel" className="scroll-mt-28 border-t border-line-strong pt-10">
      <Heading level={2} size="title" id="offene-stellen-titel">
        Alle offenen Stellen
      </Heading>
      <p className="mt-2 text-small text-text-soft">Prüfliste zum Abhaken in der Kanzleirunde, je Abschnitt mit Sprungmarke.</p>
      <ol className="mt-6 space-y-6">
        {groups.map((g) => (
          <li key={g.id}>
            <a href={`#${g.id}`} className={cx("font-medium", LINK)}>
              {g.num ? `${g.num} ` : ""}
              {g.title}
            </a>
            <ul className="mt-2 space-y-2 pl-5 text-small marker:text-text-soft" style={{ listStyleType: "square" }}>
              {g.points.map((p, i) => (
                <li key={i}>
                  <span className="text-text-soft">{KIND_LABEL[p.kind]}: </span>
                  <Inline text={p.text} inMark />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function LegalDraftPage({ doc }) {
  const counts = docCounts(doc);
  const headCount = docOpenPoints(doc).find((g) => g.id === "kopf")?.points.length || 0;
  return (
    <article data-legal-draft={doc.slug}>
      <header className="bg-surface pt-10 pb-12 md:pt-14 md:pb-16">
        <Container>
          <Breadcrumbs items={[{ label: "Startseite", href: "/" }, { label: "Rechtstexte-Vorschau", href: "/preview/recht" }, { label: doc.title }]} />
          <Eyebrow className="mt-stack-m">Kanzlei-Fassung · freigegeben {APPROVED_DE} · noindex</Eyebrow>
          <Heading level={1} className="mt-stack-s text-balance">
            {doc.heading || doc.title}
          </Heading>
          <Lead className="mt-stack-m">{doc.lead}</Lead>
          <DocSwitch current={doc.slug} />
        </Container>
      </header>

      <ReviewBox doc={doc} counts={counts} />

      <Container className="py-section">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-grid">
          <div className="lg:col-span-4 xl:col-span-3">
            <Toc doc={doc} />
          </div>
          <div className="min-w-0 max-w-measure text-body lg:col-span-8 xl:col-span-8 xl:col-start-5">
            <div id="kopf" className="scroll-mt-28 border-b border-line pb-6">
              {headCount > 0 && (
                <div className="mb-3">
                  <StatusBadges section={{}} count={headCount} />
                </div>
              )}
              <p className="text-small text-text-soft">
                <Inline text={doc.version} />
              </p>
              {doc.intro && (
                <div className="text-body">
                  <Block block={doc.intro} />
                </div>
              )}
            </div>
            <div className="mt-10 space-y-14">
              {doc.sections.map((s) => (
                <SectionBody key={s.id} section={s} level={2} />
              ))}
              <OpenPointList doc={doc} />
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
}
