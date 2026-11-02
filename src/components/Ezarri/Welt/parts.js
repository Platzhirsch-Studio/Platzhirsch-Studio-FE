// Gemeinsame Bausteine der Ezarri-Welt (Server-Komponenten, keine Hooks außer
// denen der ui-Primitive). Auch für Team B/C nutzbar (Konzept §7.4 Nr. 6).
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, Button, Container, Eyebrow, Heading, Lead, Section } from "@/components/ui";
import JsonLd from "@/components/Reusable/JsonLd";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ezarriCredit } from "@/lib/ezarri/config";
import { ezCopy, ezLang, ezT } from "@/lib/ezarri/lang";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { crumbsSchema, graph } from "./schema";
import styles from "./ezarri.module.css";
// Welle 2 (Englisch): die Bausteine lesen die Sprache selbst (useLocale geht in
// Server-Komponenten ohne async; setRequestLocale setzt layout.js der Welt).

/** Brotkrumen-Basis: Startseite / Outdoor & Pool / Ezarri Glasmosaik / … */
// R2 gesamtwerk P2-1: Brotkrumen = Menü (shellNav.js: „Outdoor & Pool“ → „Ezarri Glasmosaik“).
// Runde 4 P5 (seo P1-3): „Outdoor & Pool“ hat jetzt eine URL (gültiges
// BreadcrumbList); Daten und Regel in src/lib/ezarri/crumbs.js (rein, getestet).
export { EZ_MENU_GROUP, ezCrumbs, ezCrumbsFor } from "@/lib/ezarri/crumbs"; // EZ_MENU_GROUP = „Outdoor & Pool“ → /outdoor-gartenplanung

/**
 * Kopf einer Unterseite: Brotkrumen, Overline, H1 (Bodoni display-l), Lead.
 * `jsonLd` = weitere Knoten für denselben @graph (BreadcrumbList kommt dazu).
 */
export function PageHead({ crumbs, eyebrow, title, lead, leadClassName = "", compact = false, children, jsonLd = [] }) {
  // compact: Katalogseiten, deren Ergebnis mobil im ersten Bildschirm beginnen soll (QM P2-1).
  const locale = useLocale();
  const pad = !title ? "pb-6 pt-6" : compact ? "pb-6 pt-6 md:pb-10 md:pt-10" : "pb-10 pt-8 md:pb-14 md:pt-12";
  return (
    <Container as="header" className={pad}>
      <Breadcrumbs items={crumbs} />
      <JsonLd data={graph(crumbsSchema(crumbs, { locale }), ...jsonLd)} />
      {eyebrow && <Eyebrow className={compact ? "mt-6 [overflow-wrap:anywhere] md:mt-8" : "mt-8 [overflow-wrap:anywhere]"}>{eyebrow}</Eyebrow>}
      {title && (
        <Heading level={1} size="display-l" className="mt-stack-s max-w-[20ch] text-balance [overflow-wrap:break-word] max-sm:text-[length:min(var(--text-display-l),12vw)]">
          {title}
        </Heading>
      )}
      {lead && <Lead className={`mt-stack-m text-pretty ${leadClassName}`}>{lead}</Lead>}
      {children}
    </Container>
  );
}

/** Sammel-Quellenangabe unter Rastern/Tabellen (14 px, text-soft). */
export function CreditNote({ kinds = ["bild"], className = "" }) {
  const lang = ezLang(useLocale());
  return (
    <p className={`text-small text-text-soft ${className}`}>
      {/* QM r4: Trenner mit geschütztem Leerzeichen am Wort davor – keine Zeile beginnt mit „· Stand“ */}
      {kinds.map((k) => ezarriCredit(k, lang)).join("\u00a0· ")}{"\u00a0· "}{ezT(lang)("Stand", "as of", "état au", "aggiornato al")} 28.10.2026
    </p>
  );
}

/** Faktenliste als <dl>, Zahlen tabular. Lücken werden als Lücke gezeigt. */
export function FactList({ rows, gap, className = "" }) {
  const luecke = ezCopy(useLocale()).DETAIL.luecke;
  gap ??= luecke;
  return (
    <dl className={`grid grid-cols-1 border-t border-line text-small sm:grid-cols-[minmax(0,12rem)_1fr] ${className}`}>
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="pt-3 text-text-soft sm:border-b sm:border-line sm:pb-3">{label}</dt>
          <dd className={`border-b border-line pb-3 tabular-nums sm:pt-3 ${value ? "text-text" : "text-text-soft italic"}`}>{value || gap}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Zeile mit Pfeil (Technik-Liste, Weiterführendes). */
export function LinkRow({ href, title, text }) {
  const locale = useLocale();
  return (
    <li className="group relative border-b border-line">
      <Link href={href} {...ezLinkProps(locale, href)} className="ph-stretched flex min-h-16 items-center justify-between gap-6 py-5">
        <span className="flex flex-col gap-1">
          <span className="text-title text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">{title}</span>
          {text && <span className="text-body text-text-soft">{text}</span>}
        </span>
        <ArrowRight aria-hidden="true" className="ph-arrow size-5 shrink-0 text-text" strokeWidth={1.5} />
      </Link>
    </li>
  );
}

/** Abschnittskopf (Overline + H2 + optional Text) für Abschnitte unter dem Seitenkopf. */
export function SectionHead({ id, eyebrow, title, text, tone = "accent", className = "" }) {
  // QM r4: fitHead – die H2 passt bei großer Schrift in die Spalte (ezarri.module.css)
  return (
    <div className={`max-w-measure ${styles.fitHead} ${className}`}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Heading id={id} level={2} size="display-m" className="mt-stack-s text-balance">
        {title}
      </Heading>
      {text && <p className="mt-4 text-body text-text-soft text-pretty lg:mt-5">{text}</p>}
    </div>
  );
}

/**
 * Schluss jeder Ezarri-Seite: Leitsatz-freier Band mit Termin (1 Primärknopf)
 * und Musteranfrage. `inverse` nur, wenn die Seite sonst keine Walnut-Fläche hat.
 */
export function Schluss({ refIds = [], tone = "band" }) {
  const locale = useLocale();
  const { LINKS, SCHLUSS } = ezCopy(locale);
  const dark = tone === "inverse";
  return (
    // QM r4 (ipad, desktop): volle Inhaltsbreite statt schmalem, zentriertem Textcontainer – der Block
    // fluchtet jetzt mit der Seitenkante und den Abschnitten darüber (vorher x ≈ 75/143/440 px).
    <Section tone={tone} labelledBy="ez-schluss" spacing="compact">
      <div className={`flex flex-col items-start ${styles.fitHead}`}>
        <Heading id="ez-schluss" level={2} size="display-m" tone={dark ? "inverse" : "text"}>
          {SCHLUSS.title}
        </Heading>
        <p className={`mt-stack-s max-w-measure text-body ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>{SCHLUSS.text}</p>
        <div className="mt-stack-m flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href={LINKS.beratung} arrow onDark={dark}>
            {SCHLUSS.primary}
          </Button>
          <Button href={LINKS.muster(refIds)} {...ezLinkProps(locale, LINKS.muster(refIds))} variant="secondary" onDark={dark}>
            {SCHLUSS.secondary}
          </Button>
        </div>
      </div>
    </Section>
  );
}
