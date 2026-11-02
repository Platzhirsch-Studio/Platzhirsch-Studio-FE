// /[locale]/outdoor-winterservice – Winterlager und Pflege für Outdoor-Möbel
// (Inhaber-Auftrag 29.10.2026, Service Nr. 3). DE und EN.
// Texte: src/lib/service/winterlager/copy.js · offene Inhaber-Werte:
// src/lib/service/winterlager/config.js (leer = Zeile entfällt, Preise „auf Anfrage“).
// Doku: qa-screenshots/service/winterlager-bau.md
//
// Dramaturgie (mobil zuerst, Design-Bibel „ein Gedanke pro Bildschirm“):
// Auftakt (H1 = LCP, Text, KEIN Bild – die Outdoor-Fotos sind nicht
// freigegeben, Stock/KI verboten) mit „Auf einen Blick“ · Ablauf · Pflegewissen
// mit Herstellerquelle · Einmal oder Abo · Anmeldung · Passend dazu.
// Ein Primärknopf im Auftakt, Formular-Knopf im Formular. Server-Komponente;
// Inseln nur Formular und (falls ein Anmeldeschluss gesetzt ist) Countdown.
import { Check } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, Eyebrow, Heading, Horizon, Lead, LinkArrow, Section, cx } from "@/components/ui";
import { MATERIAL_KEYS, SOURCES, SOURCES_CHECKED, fill, winterlagerCopy } from "@/lib/service/winterlager/copy";
import { WINTERLAGER_CONFIG, parseDeadline } from "@/lib/service/winterlager/config";
import { crumbs, winterlagerSchema } from "@/lib/service/winterlager/schema";
import { factRows, formatDeadline, optionRows, termsPath, visibleSteps } from "@/lib/service/winterlager/view";
import WinterlagerAnmeldung from "./WinterlagerAnmeldung";
import WinterlagerCountdown from "./WinterlagerCountdown";

function SectionHead({ id, eyebrow, title, intro }) {
  return (
    <div className="mb-stack-m max-w-text">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading id={id} level={2} className="mt-stack-s text-balance">
        {title}
      </Heading>
      {intro && <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{intro}</p>}
    </div>
  );
}

function CheckList({ items, className }) {
  return (
    <ul className={cx("space-y-3", className)}>
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-body text-text">
          <Check aria-hidden="true" strokeWidth={1.5} className="mt-1 size-5 flex-none text-text-soft" />
          <span className="text-pretty">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * @param {{ locale: "de"|"en" }} props
 */
export default function WinterlagerPage({ locale }) {
  const c = winterlagerCopy(locale);
  const facts = factRows(locale);
  const steps = visibleSteps(locale);
  const deadline = parseDeadline(WINTERLAGER_CONFIG.anmeldeschluss);
  const terms = termsPath();
  const checked = parseDeadline(SOURCES_CHECKED);
  const deOnly = locale === "de" ? {} : { locale: "de", hrefLang: "de" };
  const deOnlySuffix = c.links.deOnly ? ` ${c.links.deOnly}` : "";

  return (
    <>
      <JsonLd data={winterlagerSchema(locale)} />

      {/* Auftakt */}
      <Section spacing="none" className="pt-6 pb-section md:pt-10" labelledBy="wl-title">
        <Breadcrumbs items={crumbs(locale)} />
        <div className="mt-10 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-8">
          <div className="max-w-text lg:col-span-7">
            <Eyebrow>{c.hero.eyebrow}</Eyebrow>
            <Heading id="wl-title" level={1} className="mt-stack-s text-balance">
              {c.hero.title}
            </Heading>
            <Lead className="mt-stack-m text-pretty">{c.hero.lead}</Lead>
            <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Button href="#anmeldung" arrow>
                {c.hero.cta}
              </Button>
              <LinkArrow href="#ablauf">{c.hero.secondary}</LinkArrow>
            </div>
            {deadline && <WinterlagerCountdown locale={locale} />}
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-4">
            <Heading level={2} size="title" id="wl-facts">
              {c.facts.label}
            </Heading>
            <dl className="mt-4 border-t border-line" aria-labelledby="wl-facts" data-testid="wl-facts">
              {facts.map((row) => (
                <div key={row.key} className="border-b border-line py-3">
                  <dt className="text-small text-text-soft">{row.label}</dt>
                  <dd className="mt-1 text-body text-text text-pretty">
                    {row.value}
                    {row.hint && <span className="mt-1 block text-small text-text-soft">{row.hint}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <Horizon className="mt-16 md:mt-24" />
      </Section>

      {/* Ablauf */}
      <Section spacing="compact" labelledBy="wl-ablauf" id="ablauf" className="scroll-mt-22 pt-0 md:pt-0">
        <SectionHead id="wl-ablauf" eyebrow={c.steps.eyebrow} title={c.steps.title} intro={c.steps.text} />
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-8" data-testid="wl-steps">
          {steps.map((s, i) => (
            <li key={s.key} className="border-t border-line-strong pt-5">
              <p className="text-small tabular-nums text-text-soft">
                <span className="sr-only">{c.steps.stepWord} </span>
                {String(i + 1).padStart(2, "0")}
              </p>
              <Heading level={3} className="mt-2">
                {s.title}
              </Heading>
              <p className="mt-3 max-w-measure text-body text-pretty text-text-soft">{s.text}</p>
              {s.extra.map((e) => (
                <p key={e} className="mt-2 text-small text-text">
                  {e}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </Section>

      {/* Pflegewissen mit Herstellerquelle */}
      <Section tone="band" spacing="compact" labelledBy="wl-care">
        <SectionHead id="wl-care" eyebrow={c.care.eyebrow} title={c.care.title} intro={c.care.text} />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {MATERIAL_KEYS.map((key) => {
            const m = c.care.items[key];
            return (
              <article key={key} aria-labelledby={`wl-care-${key}`} className="flex flex-col border-t border-line-strong pt-6">
                <Heading id={`wl-care-${key}`} level={3}>
                  {m.name}
                </Heading>
                <CheckList items={m.points} className="mt-4" />
                <p className="mt-5 text-small text-text-soft">
                  <a href={SOURCES[key]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-text">
                    {fill(c.care.sourceLabel, { name: m.sheet })}
                  </a>
                </p>
              </article>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
          {checked && <p className="text-small text-text-soft">{fill(c.care.checked, { date: formatDeadline(checked, locale) })}</p>}
          <LinkArrow href={SOURCES.overview} target="_blank" rel="noopener noreferrer">
            {c.care.overview}
          </LinkArrow>
          <LinkArrow href="/ueber-uns/marken/gloster" prefetch={false}>
            {c.care.brandLink}
          </LinkArrow>
        </div>
      </Section>

      {/* Einmal oder Abo */}
      <Section spacing="compact" labelledBy="wl-options">
        <SectionHead id="wl-options" eyebrow={c.options.eyebrow} title={c.options.title} />
        <div className="grid gap-10 md:grid-cols-2 lg:gap-8">
          {["einmal", "abo"].map((variant) => {
            const o = c.options.items[variant];
            return (
              <article key={variant} aria-labelledby={`wl-opt-${variant}`} className="flex flex-col border-t border-line-strong pt-6">
                <Heading id={`wl-opt-${variant}`} level={3}>
                  {o.title}
                </Heading>
                <p className="mt-3 max-w-measure text-body text-pretty text-text-soft">{o.text}</p>
                <CheckList items={o.points} className="mt-5" />
                <dl className="mt-6 border-t border-line" data-testid={`wl-konditionen-${variant}`}>
                  {optionRows(variant, locale).map((row) => (
                    <div key={row.key} className="flex justify-between gap-4 border-b border-line py-3 text-body">
                      <dt className="text-text-soft">{row.label}</dt>
                      <dd className="text-right text-text">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {variant === "abo" && terms && (
                  <LinkArrow href={terms} className="mt-4" prefetch={false}>
                    {c.options.bedingungen}
                  </LinkArrow>
                )}
              </article>
            );
          })}
        </div>
      </Section>

      {/* Anmeldung */}
      <Section tone="raised" spacing="compact" labelledBy="wl-form-title" id="anmeldung" className="scroll-mt-22">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow>{c.form.eyebrow}</Eyebrow>
            <Heading id="wl-form-title" level={2} className="mt-stack-s text-balance">
              {c.form.title}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{c.form.text}</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <WinterlagerAnmeldung locale={locale} />
          </div>
        </div>
      </Section>

      {/* Passend dazu */}
      <Section spacing="compact" labelledBy="wl-links">
        <SectionHead id="wl-links" eyebrow={c.links.eyebrow} title={c.links.title} />
        <ul className="grid gap-8 md:grid-cols-3 lg:gap-8">
          <li className="border-t border-line-strong pt-5">
            <Heading level={3}>{c.links.gartenplanung.title}</Heading>
            <p className="mt-2 max-w-measure text-body text-pretty text-text-soft">{c.links.gartenplanung.text}</p>
            <LinkArrow href="/outdoor-gartenplanung" className="mt-3" prefetch={false} {...deOnly}>
              {c.links.gartenplanung.title}
              {deOnlySuffix}
            </LinkArrow>
          </li>
          <li className="border-t border-line-strong pt-5">
            <Heading level={3}>{c.links.licht.title}</Heading>
            <p className="mt-2 max-w-measure text-body text-pretty text-text-soft">{c.links.licht.text}</p>
            <LinkArrow href="/bodensee-licht" className="mt-3" prefetch={false} {...deOnly}>
              {c.links.licht.title}
              {deOnlySuffix}
            </LinkArrow>
          </li>
          <li className="border-t border-line-strong pt-5">
            <Heading level={3}>{c.links.process.title}</Heading>
            <p className="mt-2 max-w-measure text-body text-pretty text-text-soft">{c.links.process.text}</p>
            <LinkArrow href="/arbeitsweise" className="mt-3" prefetch={false}>
              {c.links.process.title}
            </LinkArrow>
          </li>
        </ul>
      </Section>
    </>
  );
}
