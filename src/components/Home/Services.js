import { LinkArrow } from "@/components/ui";
import SubIntro, { SUB_BLOCK } from "./SubIntro";
import ScrollRow from "./ScrollRow";
import Picto from "./Pictos";
import { getHomeT, r7Copy } from "./copy";
import { ROW_ITEM, ROW_MOBILE, ROW_REVEAL, scrollLabels } from "./row";
import HomeShowcase from "@/components/Labs/Hub/HomeShowcase";
import { navFeatures } from "@/components/Navbar/shellNav";
import { SERVICES, TOOLS_ABROAD, serviceHref } from "./homeLinks";

// Services (Jury P1.15: Küchenplanung, Interior Design, Outdoor-Planung,
// Yacht-Interior as entries from the homepage). The pages exist in German
// only (see landingTarget below for the other locales).
// Teasers repeat only what the target pages say (outdoor: construction and
// garden work by licensed contractors, we coordinate).
// R3 (page length): on phones the four entries form a scroll-snap row
// (78 vw) with visible back/forward buttons; from sm the two-column list.
// Runde 2, Fix-Team P2 (ux P1-2, seo P1-6): five cards incl. "Hotel,
// Gastronomie & Objekt", language-correct links with ?thema= – the targets
// live in homeLinks.js (pure, unit-tested).
// Fix-Runde 1 (F1, gesamtwerk P2-4 "Mehr als Möbel ohne Bild"): each service
// gets its own line pictogram (Pictos.js) – no manufacturer or yacht photo
// (rights open, Minotti/Custom Line only after written sign-off).
// P2 "Leistungen / Planen & Erleben / Vorab ausprobieren" read as one doubled
// chapter: the online tools (HomeShowcase, "Planen & Erleben") no longer
// follow right after this section; page.js places <ToolsShowcase> after the
// house chapter, where "online starten – Harald zeichnet von Hand" continues
// the USP chapter.

// R5-USP (gesamtwerk P1): five cards without a hole in the grid – 2 + 2 + 1
// (the fifth spans both columns) from sm, 3 + 2 on a six-column grid from lg.
// Optik shell-home: the second lg row keeps the first row's column lines –
// Yacht under Küchenplanung (2 tracks), Hotel & Objekt over the other two
// (4 tracks) instead of two half rows that cut through the grid.
// QM shell-home r5 (iPad, 200 % text): the six-track grid followed lg and
// "Küchenplanung" ran 30 px out of its card – the tracks now follow the
// container in rem (56rem ≈ the lg width at 100 %).
const SPAN = "sm:max-w-none sm:last:col-span-2 sm:@min-[56rem]:col-span-2 sm:@min-[56rem]:last:col-span-4";

// B12 (31.10.2026, Startseite ≤ 9 Kapitel): "Mehr als Möbel" and the online
// tools are no longer chapters of their own. Both are blocks of the chapter
// "Gastgeber" (WhyChooseUsSectionHome.js): H3 head (SubIntro), cards with H4,
// no own surface. Same cards, same links, same order of the five services.
export default async function Services({ locale }) {
  const t = await getHomeT(locale);
  const r7 = r7Copy(locale);
  const german = locale === "de";
  const text = (key, field) => (key === "objekt" ? r7.objekt[field] : t(`services.${key}.${field}`));
  return (
    <div className={SUB_BLOCK} data-home-services="">
      <SubIntro id="home-services-title" title={t("services.title")} lead={t("services.lead")} />
      <div className="@container mt-4 sm:mt-8">
      <ScrollRow
        id="home-services-list"
        label={t("services.eyebrow")}
        labels={scrollLabels(t)}
        className={`${ROW_MOBILE} ${ROW_REVEAL} sm:grid-cols-2 sm:gap-x-grid sm:border-t sm:border-line sm:@min-[56rem]:grid-cols-6`}
      >
        {SERVICES.map((s) => {
          const title = text(s.key, "title");
          const link = serviceHref(s, locale);
          // Own page in this locale (Sprach-Integration 01.11.2026) → the page's link text.
          const label = german || s.key === "objekt" || link.own ? text(s.key, "link") : r7.serviceLink[s.key];
          return (
            <li key={s.key} className={`${ROW_ITEM} ${SPAN} flex w-[70vw] max-w-72 flex-col border-t border-line pt-4 sm:border-t-0 sm:border-b sm:py-8`} data-home-service={s.key}>
              <Picto name={s.key} className="size-8 text-text-accent sm:size-12" />
              <h4 className="mt-2 text-ui font-medium text-text sm:mt-3 sm:text-title sm:font-normal">{title}</h4>
              <p className="mt-1 max-w-measure text-small text-text-soft sm:mt-2 sm:text-body">{text(s.key, "text")}</p>
              <div className="mt-auto pt-4">
                <LinkArrow
                  href={link.href}
                  locale={link.locale}
                  hrefLang={link.germanOnly ? "de" : undefined}
                  aria-label={german ? undefined : `${title} – ${label}`}
                >
                  {label}
                </LinkArrow>
              </div>
            </li>
          );
        })}
      </ScrollRow>
      </div>
    </div>
  );
}

/**
 * "Planen & Erleben" – the online tools (src/lib/features.js, switches on by
 * default; German only). B12: a block of the chapter "Gastgeber"
 * (WhyChooseUsSectionHome.js), after "Mehr als Möbel".
 */
const SHOWCASE_HOME = ["de", "en"];

export async function ToolsShowcase({ locale }) {
  const t = await getHomeT(locale);
  // Rat 9,5 (B11): the showcase (Team T2) serves EN too (Sofaplaner, Yacht,
  // Ezarri with English texts); FR/IT keep the text list ToolsAbroad.
  if (SHOWCASE_HOME.includes(locale)) return <HomeShowcase locale={locale} labels={scrollLabels(t)} embedded />;
  return <ToolsAbroad locale={locale} />;
}

// Runde 2, Fix-Team P2 (gesamtwerk P1-5): EN/FR/IT get the tools chapter too,
// instead of nothing. The planners exist in German only (the other locales
// redirect to /de/… ?lang=…), so every link is marked "(in German)" with
// hreflang="de". Only switched-on features (navFeatures), text only – no
// photo, so the hero photo never repeats here (gesamtwerk P2-2).
function ToolsAbroad({ locale }) {
  const c = r7Copy(locale).tools;
  const byId = new Map(navFeatures().map((f) => [f.id, f]));
  const tools = TOOLS_ABROAD.map((id) => byId.get(id)).filter(Boolean);
  if (!tools.length) return null;
  // B12: block of the chapter "Gastgeber" (H3 head, items H4), no own band.
  return (
    <div className={SUB_BLOCK} data-home-tools-abroad="">
      <SubIntro id="home-tools-title" title={c.title} lead={c.lead} />
      <ul className="mt-4 grid grid-cols-1 border-t border-line sm:mt-8 sm:grid-cols-2 sm:gap-x-grid xl:grid-cols-4">
        {tools.map((f) => {
          const item = c.items[f.id];
          // Sprach-Integration 01.11.2026: Küchenplaner, Sofaplaner und Stil-Finder
          // gibt es in EN/FR/IT (features.js locales) – Link in der Seitensprache;
          // nur die übrigen (3D-Ansicht) führen mit Hinweis auf Deutsch.
          const own = Boolean(f.locales?.includes(locale));
          return (
            <li key={f.id} className="flex flex-col border-b border-line py-4 sm:py-6">
              <h4 className="text-title text-text">{item.title}</h4>
              <p className="mt-1 max-w-measure text-body text-text-soft">{item.text}</p>
              <div className="mt-auto pt-3">
                <LinkArrow href={f.href} {...(own ? {} : { locale: "de", hrefLang: "de", "aria-label": `${item.title} (${c.german})` })}>
                  {item.title}
                  {own ? "" : ` (${c.german})`}
                </LinkArrow>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
