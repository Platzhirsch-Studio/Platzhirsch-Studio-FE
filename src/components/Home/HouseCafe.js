import { Button, Section } from "@/components/ui";
import { ADDRESS, DIRECTIONS_URL, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import SectionIntro from "./SectionIntro";
import Picto from "./Pictos";
import { f1Copy, getHomeT } from "./copy";
import h from "./home.module.css";
import { SECTION_Y } from "./row";

// "Showroom & Café" – the page's ONE dark surface (walnut, Bibel §4.2/W5,
// Jury §3.3: "Haus & Café" as the only evening chapter, with the line
// "Erst ein Kaffee. Dann das Sofa."). Anchor #haus is the hero's secondary
// link. Opening hours mirror openingHoursSpecification in [locale]/layout.js
// (the only source until they move into lib/site.js). Café hours are not
// confirmed (Jury question 10) – only the showroom hours are stated.
const ROWS = [
  { day: "tueFri", time: "tueFri" },
  { day: "sat", time: "sat" },
  { day: "sunMon", time: "closed" },
];

export default async function HouseCafe({ locale }) {
  const t = await getHomeT(locale);
  const c = f1Copy(locale);
  return (
    <Section tone="inverse" id="haus" labelledBy="home-house-title" spacing="none" className={SECTION_Y}>
      <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-12 lg:items-start lg:gap-grid">
        <div className="lg:col-span-5">
          <SectionIntro id="home-house-title" eyebrow={t("house.eyebrow")} title={t("house.title")} inverse stacked />
          <p className="mt-stack-m max-w-measure text-body text-text-inverse-soft">{t("house.text")}</p>

          <div className="mt-6 sm:mt-10">
            <p className="text-overline uppercase text-accent-on-dark">{t("house.addressTitle")}</p>
            <address className="mt-3 text-body not-italic text-text-inverse">
              Platzhirsch Home Living
              <br />
              {ADDRESS.street}
              <br />
              {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.region}
            </address>
          </div>

          {/* QM shell-home r4 (200 % text, desktop): "Route planen" wrapped inside the
              button – the two actions wrap as a whole instead of shrinking. */}
          <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href={DIRECTIONS_URL} target="_blank" variant="secondary" onDark arrow>
              {t("house.route")}
            </Button>
            <Button href={PHONE_HREF} variant="ghost" onDark>
              <span className="tabular">
                {t("house.call")}: <span className="whitespace-nowrap">{PHONE_DISPLAY}</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Right half (Runde 2, Fix-Team P2, ux P2-2): no empty picture
            frame any more. Until the owner's own photos of café and house
            arrive (Marktresearch/recht/bildrechte.csv), a typographic card
            carries the facts large: "Café · Ausstellung", the opening hours
            and the address line. It is as tall as its content (no 4:5 box),
            real text for every viewport (not aria-hidden). */}
        {/* QM shell-home r3: @container – the place line keeps its parts together
            while the card is ≥ 16rem wide in rem (wraps again with 200 % text);
            the title may hyphenate instead of running out of the frame. */}
        <div className={`${h.house} @container text-text-inverse lg:col-span-6 lg:col-start-7`} data-home-house-art="">
          {/* QM shell-home r4 (200 % text): hyphens:auto broke "Ausst|ellun|g" /
              "Show|room" without a hyphen in WebKit and left the "·" alone.
              Now the title never hyphenates: the "·" is bound to the first word
              by a no-break space (a line may end on "·", never start with it), the title drops below the pictogram
              when it cannot stand beside it (flex-wrap), and the token sizes
              are capped by the viewport (globals.css), so a word fits a line. */}
          <p className="flex flex-wrap items-center gap-x-4 gap-y-3 font-display text-title leading-[1.1] text-text-inverse sm:text-display-m" aria-hidden="true">
            <Picto name="s1" className="size-10 shrink-0 text-accent-on-dark sm:size-12" />
            <span className="min-w-0 max-w-full [overflow-wrap:break-word]">
              <span className="font-display-italic">{c.house.a}</span>{"\u00a0· "}{c.house.b}
            </span>
          </p>
          {/* QM shell-home r5 (200 % text): narrower tracking in a narrow card, so "ÖFFNUNGSZEITEN" fits. */}
          <h3 className="mt-6 text-overline uppercase text-accent-on-dark @max-[16rem]:tracking-[0.04em] sm:mt-8">{t("house.hoursTitle")}</h3>
          <ul className="tabular mt-3 text-lead text-text-inverse">
            {ROWS.map((row) => (
              // QM shell-home r4 (iPhone SE, 200 % text): flex-wrap put the time
              // of "Dienstag bis Freitag" under the day but kept "Samstag" on
              // one line – uneven. Now a two-track grid while the card is
              // ≥ 16rem wide (in rem, so 100 % on every phone): the day wraps
              // inside its own track, the time always stands right on the
              // first line. Narrower (enlarged text) day and time stack.
              <li key={row.day} className="grid grid-cols-1 items-baseline gap-x-4 border-b border-line-inverse py-2 @min-[16rem]:grid-cols-[minmax(0,1fr)_auto] sm:py-3">
                <span className="text-text-inverse-soft">{t(`house.days.${row.day}`)}</span>
                <span className="@min-[16rem]:text-right">{t(`house.times.${row.time}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-small text-text-inverse-soft">{t("house.note")}</p>
          <p className="mt-6 text-overline uppercase text-text-inverse-soft sm:mt-8">
            {/* QM shell-home r4 (iPhone SE): a wrapped line began with a lone "·".
                The separator now ends the part before it (same unbreakable
                unit), so a line can end on "·" but never start with one. */}
            {String(c.house.line)
              .split(" · ")
              .map((part, i, all) => (
                <span key={i}>
                  {i > 0 ? " " : null}
                  <span className="@min-[16rem]:whitespace-nowrap">
                    {part}
                    {i < all.length - 1 ? "\u00a0·" : null}
                  </span>
                </span>
              ))}
          </p>
        </div>
      </div>
    </Section>
  );
}
