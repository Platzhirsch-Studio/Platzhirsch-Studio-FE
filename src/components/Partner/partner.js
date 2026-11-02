import { houseCrumb } from "@/components/UberUns/houseCrumb";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { CTABand, Grid, Heading, Leitsatz, Section } from "@/components/ui";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import { ROUTES } from "@/utils/routing";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { softHyphens } from "@/components/UberUns/softHyphens";

// Partner companies. Roles come from the existing `partners.<index>.role`
// messages, the café gets its own line.
// `own: true` = unit of the Platzhirsch house: shown with the new wordmark
// (ink, currentColor – Bibel §3) instead of the old gold stag-head logo.
//
// OPEN (Recht, QA Runde 1 P2-6): this page said "SM Immobilienverwaltung
// GmbH", the imprint names "MW Immobilienverwaltungs GmbH". Until the client
// confirms the company name, no Platzhirsch phone/e-mail is shown under it
// (the old entry carried +43 5574 46255 and info@platzhirsch.studio).
const partners = [
  {
    name: "SM Immobilienverwaltung GmbH",
    own: true,
    address: ["Grünegger 10", "6911 Lochau"],
  },
  {
    name: "Wertz Immobilien GmbH",
    address: ["Am Schönbühl 1", "88131 Lindau (Bodensee)"],
    phone: "+49 8382 911 211 3",
    website: "https://wertz-immobilien.de",
  },
  {
    name: "FB Future Bauart Immobilien",
    address: ["Rosamichlweg 10", "6800 Feldkirch"],
    phone: "+43 5574 581 58",
    website: "https://www.bauart.at/",
  },
  {
    name: "Ökovolt Solartechnik GmbH",
    address: ["Gewerbegebiet 10", "5121 Ostermiething"],
    phone: "+43 6278 71030",
    website: "https://www.oekovolt.com/",
  },
  {
    name: "Rusch Abdichter, Spengler + Dachdecker GmbH",
    address: ["Funkenstraße 8", "6923 Lauterach"],
    phone: "+43 5574 716 70",
    website: "https://rusch.at/de-de",
  },
  {
    name: "Stecher Elektrotechnik",
    address: ["Alberlochstraße 7", "6911 Lochau"],
    phone: "+43 5574 53565",
    website: "https://elektro-stecher.at",
  },
  {
    name: "Platzhirsch Café Lounge",
    own: true,
    address: ["Landstraße 11", "6911 Lochau"],
    phone: "+43 5574 46257",
    website: "https://platzhirsch.cafe",
    cafe: true,
  },
  {
    name: "Gasthaus Moosegg",
    address: ["Moosegg 1", "6911 Lochau"],
    phone: "+43 5574 58696",
    website: "https://www.moosegg.at",
  },
];

// Rat 9,5 B5 (QA Recht −0,4): no partner logos and no hero photo until the
// rights are documented (Marktresearch/recht/bildrechte.csv: partner2–8.png
// and dinner-area.jpg "offen"). Partners appear with their name; the tile
// shows their initials in type, the house units keep the own wordmark.
/** Initials of a company name for the type tile ("Wertz Immobilien GmbH" → "WI"). */
export function partnerInitials(name) {
  const words = String(name || "")
    .replace(/\b(GmbH|AG|KG|OG|e\.U\.)\b/g, "")
    .split(/[\s,+&-]+/)
    .filter((w) => /^\p{Lu}/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

const LINK =
  "inline-flex min-h-11 items-center gap-2 text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

const PartnerSection = () => {
  const roles = useTranslations("partners");
  const { t, locale } = useInhalt("partner");
  const common = useInhalt("common");

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: common.t("home"), href: "/" }, houseCrumb(common.locale || "de"), { label: t("title") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead")}
      />

      <Section tone="band" labelledBy="partner-list">
        <Heading id="partner-list" level={2} className="sr-only">
          {t("listTitle")}
        </Heading>
        <Grid as="ul" cols={3} className="gap-y-14">
          {partners.map((partner, idx) => {
            const role = partner.cafe ? t("cafeRole") : roles.has(`${idx}.role`) ? roles(`${idx}.role`) : "";
            return (
              // QM wm-r4: no initials tiles any more (WI, ÖS, RA … read as missing
              // logos; real logos wait for documented rights) – quiet text cards
              // on a hairline, like the team list. The house units no longer carry
              // the Platzhirsch mark (it stood on "SM Immobilienverwaltung").
              <li key={partner.name} className="reveal flex flex-col border-t border-line-strong pt-5" style={staggerStyle(idx)}>
                <h3 className="text-title text-text break-words hyphens-manual">{softHyphens(partner.name)}</h3>
                {role && <p className="mt-1 text-body text-text-soft">{role}</p>}
                <address className="mt-3 text-body not-italic text-text">
                  {partner.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <ul className="mt-2 text-ui">
                  {partner.phone && (
                    <li>
                      <a href={`tel:${partner.phone.replace(/\s+/g, "")}`} className={LINK}>
                        <span className="text-text-soft">{common.t("phone")}</span>
                        <span className="tabular">{partner.phone}</span>
                      </a>
                    </li>
                  )}
                  {partner.email && (
                    <li>
                      <a href={`mailto:${partner.email}`} className={`${LINK} break-all`}>
                        <span className="text-text-soft">{common.t("email")}</span>
                        <span>{partner.email}</span>
                      </a>
                    </li>
                  )}
                  {partner.website && (
                    <li>
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className={LINK}>
                        <span>
                          {t("website")}
                          <span className="sr-only">
                            {" "}
                            {partner.name} {common.t("newTab")}
                          </span>
                        </span>
                        <ExternalLink aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
                      </a>
                    </li>
                  )}
                </ul>
              </li>
            );
          })}
        </Grid>
      </Section>

      {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
          H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
          übereinander, QA P3-5). */}
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
      />
    </>
  );
};

export default PartnerSection;
