import { Horizon, Section } from "@/components/ui";
import SectionIntro from "@/components/Home/SectionIntro";
import Services, { ToolsShowcase } from "@/components/Home/Services";
import { getHomeT } from "@/components/Home/copy";
import { ROW_REVEAL, SECTION_Y } from "@/components/Home/row";

// "Gastgeber" chapter of the homepage (Bibel §1.2, Jury §3.1: the four host
// promises of the Dreiländereck prototype). Replaces the former CMS benefit
// cards (gold icons, stars, white cards on a photo). Only promises the site
// already makes elsewhere – no "Anzahlung abgesichert", no response times.
// Mobile: two columns with small text (QA runde 1, P2-4: page length), R3:
// tighter section rhythm and horizon spacing on phones.
// Carries the page's one Horizontlinie (§6, max. 1 per page).
//
// B12 (31.10.2026, Startseite 13 → 9 Kapitel, Rat 9,5 / Tempo-Team
// freigegeben): the three list chapters that told the same kind of list –
// promises, "Mehr als Möbel" (services) and "Vorab ausprobieren" (online
// tools) – are ONE chapter "So arbeiten wir mit Ihnen": the host promise as
// the chapter head, then the services and the tools as blocks with an H3
// (Services.js, ToolsShowcase). Same texts, same links, no new copy.
// Design-Jury P1-2 (one main movement per viewport): the chapter no longer
// carries `.reveal` – a 24 px lift of this tall section plus the H2's own
// .ph-chapter lift added up. Only the H2 moves now (globals.css, untouched).
// Motion shell-home (01.11.2026): the four promises answer it one after
// another (ROW_REVEAL, 16 px, transform only) – they enter the viewport after
// the H2 has settled, so it is still one movement at a time.
const ITEMS = ["time", "touch", "plan", "finish"];

export default async function HostPromises({ locale }) {
  const t = await getHomeT(locale);
  return (
    <Section labelledBy="home-host-title" spacing="none" className={SECTION_Y} data-home-work="">
      {/* QM shell-home r3: balance left "Wir sind" alone on the first phone line –
          pretty fills the first line ("Wir sind Gastgeber, / bevor wir …"). */}
      <SectionIntro id="home-host-title" eyebrow={t("host.eyebrow")} title={t("host.title")} lead={t("host.lead")} titleClassName="[text-wrap:pretty]" />
      <Horizon className="mt-6 sm:mt-16 lg:mt-12" />
      {/* QM shell-home r4 (200 % text, phone + desktop): the columns followed
          the viewport and stayed 2 (phone) / 4 (desktop) – "Probesitzen",
          "confrontare" reached the screen edge, one word per line. Now a
          container query in rem like the other home grids: 2 columns from
          18rem (every phone at 100 %), 4 from 52rem (≈ 830 px at 100 %, the
          lg layout), fewer with enlarged text. */}
      <div className="@container mt-6 lg:mt-12">
      <ol className={`${ROW_REVEAL} grid grid-cols-1 gap-x-5 gap-y-8 @min-[18rem]:grid-cols-2 @min-[52rem]:grid-cols-4 sm:gap-x-grid sm:gap-y-10`}>
        {ITEMS.map((key, i) => (
          <li key={key}>
            <span className="tabular text-overline uppercase text-text-accent" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-stack-s text-ui text-text [overflow-wrap:break-word] sm:text-title">{t(`host.items.${key}.title`)}</h3>
            <p className="mt-2 max-w-measure text-small text-text-soft sm:text-body">{t(`host.items.${key}.text`)}</p>
          </li>
        ))}
      </ol>
      </div>
      <Services locale={locale} />
      <ToolsShowcase locale={locale} />
    </Section>
  );
}
