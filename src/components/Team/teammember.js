import { Mail } from "lucide-react";
import { CTABand, Eyebrow, Grid, Heading, Leitsatz, LinkArrow, Media, Section } from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { initialsOf, withPortraits } from "./portraits";
import { HARALD, cardFormat, portraitCols } from "./teamCopy";
import { PROFILE_LOCALES, profilePath } from "./haraldProfil";
import { staggerStyle } from "@/components/ShopCatalog/motion";

// No own portrait yet (shared placeholder photo in the backoffice, see
// ./portraits.js): a quiet stone tile with the initials in Bodoni (≥ 32 px).
// Decorative. Runde 4 (Fix-Team P6, Auftrag 7): the team grid no longer uses
// it – an initials tile next to real portraits read as a missing photo. Kept
// for other callers.
export function PortraitTile({ name, className }) {
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-[4/5] w-full items-center justify-center bg-surface-band ${className || ""}`}
    >
      <span className="font-display text-display-l text-text-soft">{initialsOf(name)}</span>
    </div>
  );
}

// Runde 4 (Fix-Team P6, Auftrag 7): no gaps on the team page. Members with an
// own portrait get a card (portrait, name, role); members without one are
// listed as text below (name, role if released, note, mail) – no empty photo
// frame, no empty role line, nothing invented. Once a portrait or role is in
// the backoffice/messages, the person moves into the cards automatically.
// Rat 9,5 (A5, bewusst geändert): ONE card format for all – photo cards only
// when every active member has an own portrait (cardFormat), otherwise all
// as text cards. Before, two photo cards stood above three text cards.
export function splitTeam(team) {
  const active = withPortraits(team);
  return cardFormat(active) === "photo" ? { withPhoto: active, withoutPhoto: [] } : { withPhoto: [], withoutPhoto: active };
}

// Faces of the house (Bibel §10.2 "Team mit Gesichtern"): portrait 4:5 on
// bone, name as H3, role, a mail link with a visible label (44 px target).
// Server component – names and roles are in the HTML.
// Welle 2 (Inhaber 29.10.2026): link to the architects' page (DE/EN only; FR/IT 404).
const ARCHITECTS_LINK = {
  de: "Für Architekten und Bauträger: Planungsdaten, Muster und Projektanfrage",
  en: "For architects and developers: planning data, samples and project enquiries",
};

const TeamClient = ({ team }) => {
  const { t, raw, locale } = useInhalt("team");
  const common = useInhalt("common");
  const activeTeam = withPortraits(team);
  const { withPhoto, withoutPhoto } = splitTeam(team);
  const side = withPhoto.length > 0 && withPhoto.length <= 2;
  // The backoffice role field is empty for everyone; until it is filled, the
  // released roles from the messages (inhalt.team.roles, keyed by name) apply.
  const roleFallback = raw("roles") || {};
  const roleOf = (member) => member?.role || roleFallback[member?.title] || "";
  // Fix-Runde 1 (F3): one released sentence per person, keyed by name
  // (inhalt.team.notes) – Harald Menghin: hand drawing and room models
  // (Inhaber-Entscheidung Nr. 8) with a link to /arbeitsweise (German page).
  // No invented role: his title follows once confirmed (inhaber-offen A4).
  // R5-fix P2 (gesamtwerk P1-3): Harald with the USP sentence (teamCopy.js),
  // the link to /arbeitsweise in the visitor’s language (the page is
  // multilingual now). No photo frame, no role until confirmed.
  // Rat 9,5 (A5): Harald's sentence and links moved into his chapter above
  // the grid (HaraldKapitel) – the grid keeps name and mail, no repeat.
  const notes = { ...(raw("notes") || {}) };
  delete notes[HARALD];

  const details = (member) => (
    <>
      {roleOf(member) && <p className="mt-1 text-body text-text-soft">{roleOf(member)}</p>}
      {/* QM wm-r4: Harald's card had no line under the name (his note stands in
          the chapter above), so his e-mail sat higher than the neighbours'.
          The released profile link fills that line. */}
      {member?.title === HARALD && !roleOf(member) && PROFILE_LOCALES.includes(locale) && (
        <LinkArrow href={profilePath(locale)} locale={locale} className="mt-1 self-start">
          {t("harald.profile")}
        </LinkArrow>
      )}
      {notes[member?.title] && (
        <>
          <p className="mt-1 max-w-measure text-body text-text-soft">{notes[member.title]}</p>
        </>
      )}
      {member?.email && (
        <a
          href={`mailto:${member.email}`}
          className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-2 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
        >
          <Mail aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          <span>{t("mail", { name: member?.title || "" })}</span>
        </a>
      )}
    </>
  );

  return (
    <>
      <Section labelledBy="team-members">
        {/* R5-fix P2 (gesamtwerk P1-3): with one or two portraits the heading
            stands left of them (desktop) – the row is filled, no empty column. */}
        <div className={side ? "lg:grid lg:grid-cols-12 lg:gap-x-grid" : undefined}>
        <div className={side ? "max-w-text lg:col-span-4 lg:pt-2" : "max-w-text"}>
          <Eyebrow className="mb-stack-s">{t("membersEyebrow")}</Eyebrow>
          <Heading id="team-members" level={2}>
            {t("membersTitle")}
          </Heading>
        </div>

        {activeTeam.length === 0 ? (
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("empty")}</p>
        ) : (
          <>
            {withPhoto.length > 0 && (
              // R5-fix P2 (gesamtwerk P1-3): columns follow the number of portraits – no empty column.
              <Grid as="ul" cols={portraitCols(withPhoto.length)} className={`mt-12 gap-y-14 ${side ? "lg:col-span-8 lg:mt-0" : "lg:mt-16"}`} data-team-cards="" data-cols={portraitCols(withPhoto.length)}>
                {withPhoto.map((member, index) => (
                  <li key={`${member?.title || "member"}-${index}`} className="reveal flex flex-col" style={staggerStyle(index, portraitCols(withPhoto.length))}>
                    <Media
                      src={member.portrait}
                      alt={member?.title ? `${member.title}${roleOf(member) ? `, ${roleOf(member)}` : ""}` : ""}
                      ratio="4/5"
                      className="bg-surface-raised"
                      imgClassName="object-top"
                      sizes="(min-width: 1440px) 430px, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                    />
                    <h3 className="mt-4 text-title text-text">{member?.title}</h3>
                    {details(member)}
                  </li>
                ))}
              </Grid>
            )}
          </>
        )}
        </div>
        {activeTeam.length > 0 && (
          <>
            {withoutPhoto.length > 0 && (
              <Grid as="ul" cols={withoutPhoto.length <= 2 ? 2 : 3} className="mt-12 gap-y-0 border-t border-line lg:mt-16" data-team-list="">
                {withoutPhoto.map((member, index) => (
                  <li key={`${member?.title || "member"}-${index}`} className="flex flex-col border-b border-line py-6">
                    <h3 className="text-title text-text">{member?.title}</h3>
                    {details(member)}
                  </li>
                ))}
              </Grid>
            )}
          </>
        )}
        {/* Welle 2: Team ↔ Architekten & Bauträger (page in DE and EN). */}
        {ARCHITECTS_LINK[locale] && (
          <p className="mt-12 lg:mt-16">
            <LinkArrow href="/architekten" locale={locale}>
              {ARCHITECTS_LINK[locale]}
            </LinkArrow>
          </p>
        )}
      </Section>

      {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
          H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
          übereinander, QA P3-5); „raised“ trennt das Band vom Footer. */}
      <CTABand
        tone="raised"
        title={<Leitsatz as="span" size="m" className="block pb-2" />}
        text={
          <>
            <p className="text-lead text-text">{t("ctaTitle")}</p>
            <p className="mt-2">{t("ctaText")}</p>
          </>
        }
        primary={{ href: ROUTES.beratung[locale] || ROUTES.beratung.de, label: common.t("termin") }}
        secondary={{ href: ROUTES.karriere[locale] || ROUTES.karriere.de, label: t("ctaSecondary") }}
      />
    </>
  );
};

export default TeamClient;
