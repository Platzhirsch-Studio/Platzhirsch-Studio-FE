// /[locale]/pflege-service – Pflege-Abo für Leder, Stoff und Holz (Service Nr. 4).
// Doku: qa-screenshots/service/pflege-bau.md · Texte: src/lib/service/pflege/copy.js
// Offene Inhaber-Werte: src/lib/service/pflege/config.js (leer = Zeile entfällt).
//
// Dramaturgie (mobil zuerst, Design-Bibel §2 P2 „ein Gedanke pro Bildschirm“):
// Auftakt (H1 = LCP, Text, kein Bild – es gibt noch keine eigenen Pflegefotos,
// Stock/KI ist verboten) · Leistungen je Material · Ablauf · Abo · Hersteller
// und Garantie · Pflegemittel · Portal · Fragen · Anfrage · Ratgeber.
// Keine Walnut-Fläche (der Footer ist die dunkle Fläche), ein Primärknopf im
// Auftakt, Formular-Knopf im Formular. Server-Komponente; Insel nur das Formular.
import { Check } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import { Accordion, Breadcrumbs, Button, Eyebrow, Heading, Horizon, Lead, LinkArrow, Section, cx } from "@/components/ui";
import { materialCopyAll, pflegeCopyAll } from "@/lib/service/pflege/copy-intl";
import { PFLEGE_CONFIG, gesetzt, konditionenZeilen } from "@/lib/service/pflege/config";
import { MATERIAL_KEYS, leistungenVon } from "@/lib/service/pflege/materials";
import { pflegeSchema } from "@/lib/service/pflege/schema";
import PflegeAnfrage from "./PflegeAnfrage";
import { REKLAMATION_PATH, reklamationCopy } from "@/lib/service/reklamation/copy";

// Holz und Stein stehen auf der Seite in einer Karte („Holz, Furnier und Marmor“).
const GROUPS = [["leder"], ["stoff"], ["holz", "stein"]];

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

function MaterialCard({ keys, mats, labels }) {
  return (
    <article aria-labelledby={`material-${keys[0]}`} className="flex flex-col border-t border-line-strong pt-6">
      {keys.map((key, i) => {
        const m = mats[key];
        return (
          <div key={key} className={cx(i > 0 && "mt-8 border-t border-line pt-6")}>
            <Heading id={`material-${key}`} level={3}>
              {m.title}
            </Heading>
            <p className="mt-2 text-small text-text-soft">{m.intro}</p>
            <p className="mt-5 text-overline uppercase text-text-soft">{labels.leistungenLabel}</p>
            <CheckList items={leistungenVon(m, PFLEGE_CONFIG.ausbesserungenFreigegeben)} className="mt-3" />
            <p className="mt-5 text-overline uppercase text-text-soft">{labels.grenzenLabel}</p>
            <p className="mt-2 max-w-measure text-small text-pretty text-text">{m.grenzen}</p>
          </div>
        );
      })}
    </article>
  );
}

/**
 * @param {{locale: "de"|"en"|"fr"|"it", termin?: {href:string}|null, uploadEnabled?: boolean}} props
 */
export default function PflegePage({ locale, termin = null }) {
  // FR/IT (copy-intl.js) nur serverseitig; der Client bekommt FORM als Prop.
  const c = pflegeCopyAll(locale);
  const mats = materialCopyAll(locale);
  const konditionen = konditionenZeilen(c.KONDITIONEN);
  const produkte = PFLEGE_CONFIG.pflegeprodukte.filter((p) => p && gesetzt(p.name));
  // Der Ratgeber ist deutsch (EN/FR/IT 404): Link immer mit locale="de".
  const ratgeberHref = PFLEGE_CONFIG.ratgeberPfad || null;

  return (
    <>
      <JsonLd data={pflegeSchema(locale)} />

      {/* Auftakt */}
      <Section spacing="none" className="pt-6 pb-section md:pt-10" labelledBy="pflege-title">
        <Breadcrumbs items={c.CRUMBS} />
        <div className="mt-10 max-w-text md:mt-16">
          <Eyebrow>{c.HERO.eyebrow}</Eyebrow>
          <Heading id="pflege-title" level={1} className="mt-stack-s text-balance">
            {c.HERO.title}
          </Heading>
          <Lead className="mt-stack-m text-pretty">{c.HERO.lead}</Lead>
          <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
            <Button href="#anfrage" arrow>
              {c.HERO.primary}
            </Button>
            {ratgeberHref && (
              <LinkArrow href={ratgeberHref} locale="de" hrefLang={locale === "de" ? undefined : "de"}>
                {c.HERO.secondary}
              </LinkArrow>
            )}
          </div>
        </div>
        <Horizon className="mt-16 md:mt-24" />
      </Section>

      {/* Leistungen je Material */}
      <Section labelledBy="pflege-material" spacing="compact" className="pt-0 md:pt-0">
        <SectionHead id="pflege-material" eyebrow={c.MATERIAL_SECTION.eyebrow} title={c.MATERIAL_SECTION.title} intro={c.MATERIAL_SECTION.intro} />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {GROUPS.map((keys) => (
            <MaterialCard key={keys[0]} keys={keys.filter((k) => MATERIAL_KEYS.includes(k))} mats={mats} labels={c.MATERIAL_SECTION} />
          ))}
        </div>
      </Section>

      {/* Ablauf */}
      <Section tone="band" spacing="compact" labelledBy="pflege-ablauf">
        <SectionHead id="pflege-ablauf" eyebrow={c.ABLAUF.eyebrow} title={c.ABLAUF.title} />
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {c.ABLAUF.steps.map((s, i) => (
            <li key={s.title} className="border-t border-line-strong pt-5">
              <p aria-hidden="true" className="text-small tabular-nums text-text-soft">
                {String(i + 1).padStart(2, "0")}
              </p>
              <Heading level={3} className="mt-2">
                {s.title}
              </Heading>
              <p className="mt-3 max-w-measure text-body text-pretty text-text-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Abo + Konditionen */}
      <Section spacing="compact" labelledBy="pflege-abo">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <SectionHead id="pflege-abo" eyebrow={c.ABO.eyebrow} title={c.ABO.title} intro={c.ABO.text} />
            <CheckList items={c.ABO.punkte} />
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-10">
            <Heading level={3}>{c.ABO.konditionenTitle}</Heading>
            <dl className="mt-4 border-t border-line" data-testid="pflege-konditionen">
              {konditionen.map((row) => (
                <div key={row.key} className="flex justify-between gap-4 border-b border-line py-3 text-body">
                  <dt className="text-text-soft">{row.label}</dt>
                  <dd className="text-right text-text">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-small text-text-soft">{c.ABO.konditionenHinweis}</p>
          </div>
        </div>
      </Section>

      {/* Hersteller und Garantie */}
      <Section tone="raised" spacing="compact" labelledBy="pflege-hersteller">
        <SectionHead id="pflege-hersteller" eyebrow={c.HERSTELLER.eyebrow} title={c.HERSTELLER.title} />
        <div className="max-w-text space-y-4">
          {c.HERSTELLER.absaetze.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-measure text-body text-pretty text-text">
              {p}
            </p>
          ))}
        </div>
      </Section>

      {/* Pflegemittel + Portal */}
      <Section spacing="compact" labelledBy="pflege-produkte">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <div>
            <SectionHead id="pflege-produkte" eyebrow={c.PRODUKTE.eyebrow} title={c.PRODUKTE.title} intro={c.PRODUKTE.text} />
            {produkte.length > 0 && (
              <>
                <Heading level={3}>{c.PRODUKTE.listeTitle}</Heading>
                <ul className="mt-3 border-t border-line">
                  {produkte.map((p) => (
                    <li key={p.name} className="border-b border-line py-3 text-body text-text">
                      {p.name}
                      {p.material && mats[p.material] ? <span className="text-text-soft"> · {mats[p.material].title}</span> : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div aria-labelledby="pflege-portal" role="region" className="lg:border-l lg:border-line lg:pl-8">
            <Eyebrow>{c.PORTAL.eyebrow}</Eyebrow>
            <Heading id="pflege-portal" level={2} size="title" className="mt-stack-s">
              {c.PORTAL.title}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{c.PORTAL.text}</p>
            <LinkArrow href="/portal/pflege" locale="de" hrefLang={locale === "de" ? undefined : "de"} className="mt-4" prefetch={false}>
              {c.PORTAL.link}
            </LinkArrow>
          </div>
        </div>
      </Section>

      {/* Fragen */}
      <Section tone="band" spacing="compact" labelledBy="pflege-faq">
        <div className="max-w-text">
          <Heading id="pflege-faq" level={2} className="mb-stack-m">
            {c.FAQ_TITLE}
          </Heading>
          <Accordion name="pflege-faq" headingLevel={3} items={c.FAQ.map((f, i) => ({ id: `faq-${i + 1}`, title: f.q, content: <p className="text-pretty">{f.a}</p> }))} />
        </div>
      </Section>

      {/* Anfrage */}
      <Section spacing="compact" labelledBy="pflege-anfrage-title" id="anfrage" className="scroll-mt-22">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow>{c.FORM.eyebrow}</Eyebrow>
            <Heading id="pflege-anfrage-title" level={2} className="mt-stack-s text-balance">
              {c.FORM.title}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{c.FORM.intro}</p>
            {termin?.href && (
              <p className="mt-6 text-body text-text">
                {c.FORM.terminText}{" "}
                <LinkArrow href={termin.href} prefetch={false}>
                  {c.FORM.terminLink}
                </LinkArrow>
              </p>
            )}
            {/* Reklamation (Schaden, Mangel): eigenes Formular /service/reklamation (ph_service). */}
            <p className="mt-6 text-body text-text" data-pflege-reklamation>
              {reklamationCopy(locale).pflege.text}{" "}
              <LinkArrow href={REKLAMATION_PATH} prefetch={false}>
                {reklamationCopy(locale).pflege.link}
              </LinkArrow>
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <PflegeAnfrage locale={locale} copy={c.FORM} />
          </div>
        </div>
      </Section>

      {/* Ratgeber */}
      {ratgeberHref && (
        <Section tone="raised" spacing="compact" labelledBy="pflege-ratgeber">
          <div className="max-w-text">
            <Heading id="pflege-ratgeber" level={2} size="title">
              {c.RATGEBER.title}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{c.RATGEBER.text}</p>
            <LinkArrow href={ratgeberHref} locale="de" hrefLang={locale === "de" ? undefined : "de"} className="mt-4">
              {c.RATGEBER.link}
            </LinkArrow>
            <p className="mt-8 max-w-measure text-small text-pretty text-text-soft">
              {c.USP.text}{" "}
              <LinkArrow href="/arbeitsweise" className="align-middle">
                {c.USP.link}
              </LinkArrow>
            </p>
          </div>
        </Section>
      )}
    </>
  );
}
