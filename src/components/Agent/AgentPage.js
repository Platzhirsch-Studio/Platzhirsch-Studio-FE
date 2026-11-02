// /de/ki-assistenten – „Platzhirsch für KI-Assistenten“ (N3, Neuland).
// Doku: Marktresearch/digital/features/neuland.md §4.
//
// Dramaturgie (mobil zuerst): K0 Auftakt mit Beispiel-Abfrage (echte Daten
// aus site.js) · K1 Adresse · K2 Verbinden · K3 Werkzeuge (aus tools.js) ·
// K4 das EINE dunkle Kapitel: Vorführung mit echtem Werkzeug-Aufruf ·
// K5 Arbeitsweise (Kern-USP Handzeichnung, Inhaber-Entscheidung Nr. 8) ·
// K6 Terminwunsch mit Double-Opt-in · K7 Spielregeln · K8 Fragen · K9 Abschluss.
// Keine Bilder (keine Herstellerbilder, kein KI-Material); Struktur aus Typo,
// Haarlinien und Papiertönen. Die H1 ist LCP (Text).
// Server-Komponente; Inseln: CopyEndpoint, ToolDemo, WebMcpTools.
import JsonLd from "@/components/Reusable/JsonLd";
import { Accordion, Breadcrumbs, Button, CTABand, Eyebrow, Heading, Horizon, Lead, LinkArrow, Section, cx } from "@/components/ui";
import { CLOSING, CONNECT, CRUMBS, DEMO, ENDPOINT, FAQ, HERO, RULES, TERMIN, TOOLS, USP } from "@/lib/agent/copy";
import { CARD_PATH, MCP_URL, PAGE_PATH, SITE_ORIGIN, appointmentMode } from "@/lib/agent/config";
import { TOOL_DEFS } from "@/lib/agent/tools";
import { showroomInfo } from "@/lib/agent/facts";
import { toolResult } from "@/lib/agent/adapter";
import CopyEndpoint from "./CopyEndpoint";
import ToolDemo from "./ToolDemo";
import WebMcpTools from "./WebMcpTools";

const firstSentence = (s) => s.split(/(?<=\.)\s/)[0];

function ChapterHead({ id, overline, title, tone = "light", className, children }) {
  const dark = tone === "dark";
  return (
    <div className={className}>
      <Eyebrow tone={dark ? "inverse" : "accent"}>{overline}</Eyebrow>
      <Heading id={id} level={2} tone={dark ? "inverse" : "text"} className="mt-stack-s max-w-[22ch] text-balance">
        {title}
      </Heading>
      {children}
    </div>
  );
}

/** Beispiel im Auftakt: Frage → Werkzeug → Daten (Daten echt aus site.js). */
function HeroExample() {
  const s = showroomInfo();
  return (
    <figure className="border border-line bg-surface-raised p-5 sm:p-6" aria-labelledby="ki-beispiel">
      <figcaption id="ki-beispiel" className="text-overline uppercase text-text-soft">
        Beispiel einer Abfrage
      </figcaption>
      <ol className="mt-4 space-y-4 text-small">
        <li>
          <p className="text-text-soft">Frage an den Assistenten</p>
          <p className="mt-1 text-ui text-text">„Wo am Bodensee kann ich ein ClassiCon-Stück Probe sitzen und mich beraten lassen?“</p>
        </li>
        <li className="border-t border-line pt-4">
          <p className="text-text-soft">Werkzeuge</p>
          <p className="mt-1 font-mono text-text">brand_overview · showroom_info</p>
        </li>
        <li className="border-t border-line pt-4">
          <p className="text-text-soft">Daten von Platzhirsch</p>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-text">
            <dt className="text-text-soft">Adresse</dt>
            <dd>{s.address.line}</dd>
            <dt className="text-text-soft">Offen</dt>
            <dd className="tabular">{s.openingHoursLine}</dd>
            <dt className="text-text-soft">Preis</dt>
            <dd>{s.price}</dd>
          </dl>
        </li>
      </ol>
    </figure>
  );
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_ORIGIN}${PAGE_PATH}`,
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export default function AgentPage() {
  const { mode } = appointmentMode(process.env);
  // Vorführung startet mit einer echten Antwort, ohne Netzwerk (showroom_info ist rein).
  const initial = { tool: DEMO.prompts[0].tool, args: DEMO.prompts[0].args, result: toolResult(showroomInfo()) };

  return (
    <>
      <JsonLd data={faqSchema()} />
      <WebMcpTools />

      {/* K0 Auftakt */}
      <Section spacing="none" className="pt-8 pb-16 md:pt-12 md:pb-24" labelledBy="ki-title">
        <Breadcrumbs items={CRUMBS} schema />
        <div className="relative mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Eyebrow>{HERO.overline}</Eyebrow>
            <Heading id="ki-title" level={1} className="mt-stack-s max-w-[16ch] text-balance">
              {HERO.title}
            </Heading>
            <Lead tone="soft" className="mt-stack-m max-w-measure text-pretty">
              {HERO.lead}
            </Lead>
            <div className="mt-stack-m flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <CopyEndpoint url={MCP_URL} label={HERO.primary} copied={ENDPOINT.copied} failed={ENDPOINT.copyFailed} variant="primary" />
              <Button href={HERO.secondary.href} variant="secondary">
                {HERO.secondary.label}
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5 lg:pt-4">
            <HeroExample />
          </div>
        </div>
        <Horizon className="mt-16 md:mt-24" />
      </Section>

      {/* K1 Adresse */}
      <Section tone="raised" spacing="compact" labelledBy="ki-adresse">
        <div className="grid gap-8 lg:grid-cols-12">
          <ChapterHead id="ki-adresse" overline={ENDPOINT.overline} title={ENDPOINT.title} className="lg:col-span-5" />
          <div className="min-w-0 lg:col-span-7">
            <p className="text-small text-text-soft">{ENDPOINT.label}</p>
            <div className="mt-2 flex flex-col gap-3 border border-line-strong bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <code className="min-w-0 break-all font-mono text-ui text-text" translate="no">
                {MCP_URL}
              </code>
              <CopyEndpoint url={MCP_URL} label="Kopieren" copied={ENDPOINT.copied} failed={ENDPOINT.copyFailed} variant="secondary" compact />
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-small text-text-soft">
              {ENDPOINT.facts.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block size-1.5 bg-see" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* K2 Verbinden */}
      <Section spacing="compact" labelledBy="ki-verbinden">
        <ChapterHead id="ki-verbinden" overline={CONNECT.overline} title={CONNECT.title} />
        <ol className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
          {CONNECT.steps.map((s, i) => (
            <li key={s.name} className="min-w-0 border-t border-line pt-5">
              <p aria-hidden="true" className="text-overline uppercase tabular text-text-soft">
                {String(i + 1).padStart(2, "0")}
              </p>
              <Heading level={3} className="mt-2">
                {s.name}
              </Heading>
              <p className="mt-3 max-w-measure text-body text-text-soft text-pretty">{s.text}</p>
              {s.code && (
                <pre className="mt-4 max-w-full overflow-x-auto border border-line bg-surface-raised p-4 text-small" tabIndex={0} aria-label={`Code: ${s.name}`}>
                  <code className="font-mono text-text" translate="no">
                    {s.code}
                  </code>
                </pre>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-10 text-small text-text-soft">
          {CONNECT.note.split(CARD_PATH)[0]}
          <a href={CARD_PATH} className="font-mono underline decoration-line-strong underline-offset-4 hover:decoration-current">
            {CARD_PATH}
          </a>
          {CONNECT.note.split(CARD_PATH)[1]}
        </p>
      </Section>

      {/* K3 Werkzeuge */}
      <Section tone="band" spacing="compact" labelledBy="ki-werkzeuge">
        <ChapterHead id="ki-werkzeuge" overline={TOOLS.overline} title={TOOLS.title}>
          <p className="mt-stack-s max-w-measure text-body text-text-soft text-pretty">{TOOLS.lead}</p>
        </ChapterHead>
        <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_DEFS.map((t) => (
            <li key={t.name} className="flex min-w-0 flex-col bg-surface-band p-5">
              <div className="flex items-baseline justify-between gap-3">
                <Heading level={3} size="subtitle">
                  {t.title}
                </Heading>
                <span className={cx("shrink-0 text-overline uppercase", t.annotations.readOnlyHint ? "text-text-soft" : "text-text-accent")}>
                  {t.annotations.readOnlyHint ? TOOLS.readOnly : TOOLS.write}
                </span>
              </div>
              <p className="mt-1 font-mono text-small text-text-soft" translate="no">
                {t.name}
              </p>
              <p className="mt-3 text-small text-text text-pretty">{firstSentence(t.description)}</p>
              <p className="mt-auto pt-4 text-small text-text-soft">
                {TOOLS.example}: „{t.question}“
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* K4 Vorführung – das eine dunkle Kapitel */}
      <Section tone="inverse" spacing="compact" labelledBy="ki-demo">
        <ChapterHead id="ki-demo" overline={DEMO.overline} title={DEMO.title} tone="dark">
          <p className="mt-stack-s max-w-measure text-body text-text-inverse-soft text-pretty">{DEMO.lead}</p>
        </ChapterHead>
        <ToolDemo initial={initial} />
      </Section>

      {/* K5 Arbeitsweise (Kern-USP) */}
      <Section spacing="compact" labelledBy="ki-usp">
        <div className="grid gap-8 lg:grid-cols-12">
          <ChapterHead id="ki-usp" overline={USP.overline} title={USP.title} className="lg:col-span-5" />
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="max-w-measure text-lead text-text text-pretty">{USP.text}</p>
            <LinkArrow href={USP.link.href} className="mt-stack-s">
              {USP.link.label}
            </LinkArrow>
          </div>
        </div>
      </Section>

      {/* K6 Terminwunsch */}
      <Section tone="raised" spacing="compact" labelledBy="ki-termin">
        <ChapterHead id="ki-termin" overline={TERMIN.overline} title={TERMIN.title} />
        <ol className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
          {TERMIN.steps.map((s, i) => (
            <li key={s.name} className="border-t border-line pt-5">
              <p aria-hidden="true" className="text-overline uppercase tabular text-text-soft">
                {String(i + 1).padStart(2, "0")}
              </p>
              <Heading level={3} className="mt-2">
                <span className="sr-only">Schritt {i + 1}: </span>
                {s.name}
              </Heading>
              <p className="mt-3 text-body text-text-soft text-pretty">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-3 border-l-2 border-see pl-5 lg:max-w-[68ch]">
          <p className="text-ui text-text">{TERMIN.nothingBooked}</p>
          <p className="text-small text-text-soft" data-agent-mode={mode}>
            {TERMIN.status[mode]}
          </p>
        </div>
      </Section>

      {/* K7 Spielregeln */}
      <Section spacing="compact" labelledBy="ki-regeln">
        <div className="grid gap-8 lg:grid-cols-12">
          <ChapterHead id="ki-regeln" overline={RULES.overline} title={RULES.title} className="lg:col-span-5" />
          <div className="lg:col-span-7">
            <dl className="divide-y divide-line border-y border-line">
              {RULES.items.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-ui text-text">{k}</dt>
                  <dd className="text-body text-text-soft text-pretty">{v}</dd>
                </div>
              ))}
            </dl>
            <LinkArrow href={RULES.privacy.href} className="mt-stack-s">
              {RULES.privacy.label}
            </LinkArrow>
          </div>
        </div>
      </Section>

      {/* K8 Fragen */}
      <Section tone="raised" spacing="compact" labelledBy="ki-fragen" contained="text">
        <Eyebrow>Fragen</Eyebrow>
        <Heading id="ki-fragen" level={2} className="mt-stack-s">
          Gut zu wissen.
        </Heading>
        <Accordion
          className="mt-8"
          headingLevel={3}
          items={FAQ.map(([q, a], i) => ({ id: `frage-${i + 1}`, title: q, content: <p className="max-w-measure text-body text-text-soft">{a}</p> }))}
        />
      </Section>

      {/* K9 Abschluss */}
      <CTABand title={CLOSING.title} text={CLOSING.text} primary={CLOSING.cta} leitsatz />
    </>
  );
}
