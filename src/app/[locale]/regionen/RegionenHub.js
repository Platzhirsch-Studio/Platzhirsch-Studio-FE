// Regionen-Hub (Server Component): Kopf, eine Gruppe je Land mit den
// Regionsseiten und ihrer Anfahrt, Themenseiten, Abschluss mit Terminweg.
// Galerie-Look wie Ratgeber und Landingpages (Bibel §6/§10): Überschrift in
// Spalte 1–4, Inhalt 6–12, Haarlinien statt Karten.
import { Breadcrumbs, CTABand, Eyebrow, Heading, LinkArrow, SmartLink } from "@/components/ui";
import { landingTermin } from "@/components/Landing/parts";
import { REGIONEN_META, REGION_TOPICS } from "@/lib/seo/regionen";
import { schreibenHref, terminLabel } from "@/lib/forms/terminLink";

export default function RegionenHub({ groups, count }) {
  const termin = landingTermin({ thema: "Regionen" }, "de");
  return (
    <div className="bg-surface text-text">
      <header className="pt-8 pb-12 md:pt-12 lg:pb-16">
        <div className="mx-auto w-full max-w-page px-gutter">
          <Breadcrumbs items={[{ label: "Startseite", href: "/" }, { label: "Regionen" }]} className="[&_a]:min-h-11" />
          <Eyebrow className="mt-10">{REGIONEN_META.eyebrow}</Eyebrow>
          <Heading level={1} size="display-l" className="mt-stack-s max-w-[18ch]">
            {REGIONEN_META.h1}
          </Heading>
          <p className="mt-stack-m max-w-measure text-lead text-text">{REGIONEN_META.lead}</p>
          <nav aria-labelledby="regionen-laender" className="mt-10">
            <h2 id="regionen-laender" className="text-small text-text-soft">
              {count} Regionen in vier Ländern
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="inline-flex min-h-11 items-center border border-line-control px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-surface-band"
                  >
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-32 border-t border-line py-12 lg:py-16">
          <div className="mx-auto grid w-full max-w-page gap-x-grid gap-y-8 px-gutter lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow tone="soft">{g.country}</Eyebrow>
              <Heading id={`${g.id}-title`} level={2} size="display-m" className="mt-stack-s">
                {g.title}
              </Heading>
              <p className="mt-stack-s max-w-measure text-body text-text-soft">{g.note}</p>
              {g.guide && (
                <LinkArrow href={g.guide.href} className="mt-3">
                  {g.guide.label}
                </LinkArrow>
              )}
            </div>
            <ul className="divide-y divide-line lg:col-span-7 lg:col-start-6">
              {g.regions.map((r) => (
                <li key={r.path} className="py-6 first:pt-0 last:pb-0">
                  <article className="group relative">
                    <h3 className="text-title text-text">
                      <SmartLink
                        href={r.path}
                        className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-text after:absolute after:inset-0"
                      >
                        Designermöbel {r.name}
                      </SmartLink>
                    </h3>
                    {r.drive && (
                      <p className="mt-2 max-w-measure text-body text-text-soft">
                        <span className="text-text">Anfahrt nach Lochau:</span> {r.drive}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section aria-labelledby="regionen-themen" className="border-t border-line bg-surface-band py-12 lg:py-16">
        <div className="mx-auto grid w-full max-w-page gap-x-grid gap-y-8 px-gutter lg:grid-cols-12">
          <Heading id="regionen-themen" level={2} size="display-m" className="lg:col-span-4">
            Für jede Region
          </Heading>
          <ul className="grid gap-x-grid gap-y-6 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {REGION_TOPICS.map((t) => (
              <li key={t.href}>
                <LinkArrow href={t.href}>{t.label}</LinkArrow>
                <p className="max-w-measure text-small text-text-soft">{t.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTABand
        title="Termin in Lochau"
        text="Harald Menghin zeichnet Ihr Konzept von Hand, baut ein Modell und plant danach in 3D. Für Aufmaß und Licht kommen wir auf Wunsch zu Ihnen."
        primary={termin}
        secondary={{ href: schreibenHref("de", { context: { thema: "Regionen" } }), label: terminLabel("de", { kind: "write" }) }}
      />
    </div>
  );
}
