// src/components/Beratung/TrustBlock.js
// Rat 9,5 B6 (UX3, GW9): trust where the decision is made – next to the
// Beratung form, on /termin and (embedded by T6) on product pages.
//   · who you talk to: team members with an OWN portrait (the same photos the
//     team page shows, Team/portraits.js) and a released role
//     (inhalt.team.roles, Inhaber-Entscheidung Nr. 4) or note; Harald Menghin
//     with his released note. No invented role, no photo frame without photo.
//   · three next steps (step 2/3 = the confirmation texts forms.confirmation.*)
//   · opening hours and address (src/lib/site.js, one NAP source)
//   · one privacy sentence (FormPrivacyNote, neutral wording)
// No reply deadline, no "kostenlos", no price (UX3: not released by the owner).
// Server Component (async): the team comes from the backoffice (read only,
// cached 1 h); without data the people row is left out.
//
// Interface for other teams (product page, T6):
//   import TrustBlock from "@/components/Beratung/TrustBlock";
//   <TrustBlock locale={locale} variant="band" headingLevel={2} />
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import cx from "@/components/ui/cx";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import { fetchTeamData } from "@/lib/api/fetchTeam";
import { withPortraits } from "@/components/Team/portraits";
import { HARALD, haraldNote } from "@/components/Team/teamCopy";
// Server only: soft hyphens at syllable points (QM r3, „Geschäftsführu/ng“ at 200 %).
import { hyphenateDe } from "@/lib/text/hyphenateDe";
// QM r3: the footer's house time format („10–18 Uhr“) – one format per page.
import { houseTimeRange } from "@/components/Navbar/menuHours";
import { ADDRESS, OPENING_HOURS, PHONE_DISPLAY, PHONE_HREF, openingDaysLabel } from "@/lib/site";

/**
 * People for the block: own portrait + released role or note, Harald always
 * (with his note) when he is in the team data. At most `max`. Pure.
 * @returns {Array<{name: string, role: string, portrait: string|null}>}
 */
export function trustPeople(team, { roles = {}, notes = {}, max = 3 } = {}) {
  const list = withPortraits(team);
  const role = (m) => String(m?.role || roles[m?.title] || "").trim();
  const withFace = list.filter((m) => m.portrait && (role(m) || notes[m.title]));
  const harald = list.find((m) => m.title === HARALD);
  const out = withFace.map((m) => ({ name: m.title, role: role(m) || notes[m.title] || "", portrait: m.portrait }));
  if (harald && !out.some((p) => p.name === HARALD)) out.push({ name: HARALD, role: notes[HARALD] || role(harald), portrait: harald.portrait });
  return out.filter((p) => p.name && p.role).slice(0, max);
}

/** "Harald Menghin" → "HM" (monogram tile instead of a missing portrait). Pure. */
export function initials(name) {
  return String(name || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * @param {string} locale
 * @param {"aside"|"band"} [variant] aside = narrow column next to a form; band = full width
 * @param {2|3} [headingLevel]
 * @param {Array} [team] pre-fetched team (else fetched here)
 * @param {string} [nextStep1] first step text (default: generic "we arrange the appointment")
 */
export default async function TrustBlock({ locale, variant = "aside", headingLevel = 2, team, nextStep1, className }) {
  const [tTeam, tConf, tAll] = await Promise.all([
    getTranslations({ locale, namespace: "inhalt.team" }),
    getTranslations({ locale, namespace: "forms.confirmation" }),
    getTranslations({ locale }),
  ]);
  const members = team || (await fetchTeamData());
  const roles = tTeam.has("roles") ? tTeam.raw("roles") || {} : {};
  // The short released note (inhalt.team.notes), the long USP sentence only as fallback.
  const released = tTeam.has("notes") ? tTeam.raw("notes") || {} : {};
  const notes = { ...released, [HARALD]: released[HARALD] || haraldNote(locale) };
  const people = trustPeople(members, { roles, notes });
  const anyPortrait = people.some((p) => p.portrait);
  const H = headingLevel === 3 ? "h3" : "h2";
  const H2 = headingLevel === 3 ? "h4" : "h3";
  const steps = [
    nextStep1 || tAll("forms.trust.step1"),
    tConf.has("step2") ? tConf("step2") : "",
    tConf.has("step3") ? tConf("step3") : "",
  ].filter(Boolean);
  const band = variant === "band";

  return (
    <aside
      aria-labelledby="ph-trust-title"
      data-trust-block=""
      // QM r2 (200 % text): one minmax(0,1fr) column on phones – the implicit auto
      // column grew to the longest word and cut "Geschäftsführung" off at the edge.
      className={cx("min-w-0 border-t border-line-strong pt-6 text-text [overflow-wrap:break-word]", band && "grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-grid", className)}
    >
      <div className={cx(band && "md:col-span-5")}>
        <H id="ph-trust-title" className="text-overline uppercase text-text-accent">
          {tAll("forms.trust.title")}
        </H>
        {people.length > 0 && (
          <ul className="mt-4 space-y-4" aria-label={tAll("forms.trust.people")}>
            {people.map((p) => (
              // No empty photo frame without a photo (Harald's portrait follows with his
              // material). QM content-legal: when someone else in the list has a
              // portrait, the others' names start in the text column (still no
              // placeholder portrait), so the names line up instead of jumping left.
              // QM r2: the picture column is 64 px, not 4rem – with 200 % text the 96 px
              // original was blown up 1.7× and the names lost their room. Someone without
              // an own portrait gets a monogram tile of the same size (no stand-in photo),
              // so the row no longer looks unfinished next to a portrait.
              <li key={p.name} className={cx("items-center gap-4", anyPortrait ? "grid grid-cols-[64px_minmax(0,1fr)]" : "block")}>
                {p.portrait ? (
                  <span className="relative block aspect-[4/5] w-[64px] self-start overflow-hidden bg-linen">
                    {/* QM: the square portrait covers a 64 × 80 box (scaled by height) – 96px avoids the 1.25× upscale. */}
                    <Image src={p.portrait} alt="" fill sizes="96px" quality={75} className="object-cover object-top" />
                  </span>
                ) : anyPortrait ? (
                  <span aria-hidden="true" data-trust-monogram="" className="flex aspect-[4/5] w-[64px] self-start items-center justify-center border border-line bg-surface-band font-display text-[26px] leading-none text-text-soft">
                    {initials(p.name)}
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block text-ui text-text">{p.name}</span>
                  <span className="block text-small text-text-soft">{locale === "de" ? hyphenateDe(p.role) : p.role}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cx(band ? "md:col-span-7" : "mt-6")}>
        <H2 className="text-overline uppercase text-text-accent">{tAll("forms.trust.nextTitle")}</H2>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            // QM r2: wrap normally (pretty left short lines), the text column may shrink.
            <li key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] text-body text-text [text-wrap:wrap]">
              <span aria-hidden="true" className="font-display text-text-accent tabular">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <H2 className="mt-6 text-overline uppercase text-text-accent">{tAll("forms.trust.hoursTitle")}</H2>
        {/* QM r2: days and hours side by side from 18rem (container query), stacked with 200 % text. */}
        <div className="@container mt-2">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-ui @min-[18rem]:grid-cols-[auto_1fr]">
          {OPENING_HOURS.map((row) => (
            <div key={row.days.join("-")} className="contents">
              <dt>{openingDaysLabel(locale, row)}</dt>
              <dd className={cx("tabular", row.closed && "text-text-soft")}>
                {row.closed ? tAll("forms.trust.closed") : houseTimeRange(locale, row.from, row.to)}
              </dd>
            </div>
          ))}
          </dl>
        </div>
        <p className="mt-2 text-small text-text-soft">{tAll("forms.trust.byAppointment")}</p>
        <p className="mt-3 text-ui">
          {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city} ·{" "}
          <a href={PHONE_HREF} className="tabular whitespace-nowrap underline decoration-line-strong underline-offset-4 hover:decoration-current">
            {PHONE_DISPLAY}
          </a>
        </p>
        <FormPrivacyNote className="mt-4" />
      </div>
    </aside>
  );
}

