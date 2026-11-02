import { Card, Section } from "@/components/ui";
import { productsPath } from "@/utils/routing";
import SectionIntro from "./SectionIntro";
import ScrollRow from "./ScrollRow";
import { getHomeT } from "./copy";
import { ROW_ITEM, ROW_MOBILE, ROW_REVEAL, SECTION_Y, scrollLabels } from "./row";

// The four rooms (Bibel §10.1: Wohnen, Küche, Schlafen, Outdoor – "Raum
// zuerst"). Light, not the dark chapters of the Bühne prototype (Jury §3.3).
// Targets are real, indexable pages: the catalogue categories in every
// locale; Küche goes to the German kitchen-planning page on /de.
// Images: manufacturer campaign photos already used on the site (Poliform,
// Minotti). To be replaced by own photos from the shoot (§7), see
// redesign/startseite.md.
// R5-fix P2 (gesamtwerk P1-4): all four cards in ONE ratio (4:5 from sm, 3:2
// on phones – Card/Media set the box, the image only fills it) and on one
// line (the xl stagger made the headings jump). The sharpest existing photos
// in the same cool daylight mood were picked by Laplace variance of the 4:5
// crop at 2× card width (measured 29.10.2026; higher = sharper). Unchanged
// files, no upscaling: the rights scope "Bearbeitung" is still open for all
// of them (Marktresearch/recht/bildrechte.csv), Minotti allows no changes.
// Origin per image (bildrechte.csv: "eigene Aufnahme oder Herstellerbild –
// unbekannt", Freigabe offen):
//  - living:   /Images/Wohnen/bannerImage10.jpg, 2560×1621, score 2290 – was
//              bannerImage4.jpg (1006, soft). Campaign photo (Minotti look),
//              same file as /Images/Home/grey-and-brown-combo-style-room.jpg.
//  - kitchen:  /Images/Home/slider/poliform-kueche-kochinsel.webp, 1920×1406,
//              score 590 – Poliform campaign photo, kept (only kitchen photo
//              in the same mood with enough pixels for 4:5).
//  - sleeping: /Images/Home/slider/poliform-schlafzimmer-bett.webp, 1200×765,
//              score 430 – Poliform campaign photo, kept: 612 px 4:5 crop ≈ 2×
//              the xl card (317 css px); the sharper Tréca bed (1920×1350) is
//              a warm, bright interior that breaks the row’s light mood.
//  - outdoor:  /Images/Outdoor/bannerImage1.jpg, 2048×1247, score 1628 –
//              campaign photo (Minotti outdoor look), kept; bannerImage3
//              (1778) is a sunny landscape in another light.
// Replace all four with own photos from the shoot as soon as they exist.
const ROOMS = [
  { key: "living", category: "sofas-couches", image: "/Images/Wohnen/bannerImage10.jpg" },
  { key: "kitchen", category: "kitchen", dePage: "/kuechen-vorarlberg", image: "/Images/Home/slider/poliform-kueche-kochinsel.webp" },
  { key: "sleeping", category: "beds", image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp" },
  { key: "outdoor", category: "lounge-furniture-daybeds", image: "/Images/Outdoor/bannerImage1.jpg" },
];

// Alt text of the new living photo (the message HomePage.rooms.living.alt
// still describes bannerImage4.jpg; src/messages belongs to the i18n team –
// move this into the messages at the next merge).
const LIVING_ALT = {
  de: "Wohnraum mit grauem Sofa, rundem Couchtisch aus Marmor und Pflanzen vor einer Glasfront",
  en: "Living room with a grey sofa, a round marble coffee table and plants in front of a glass wall",
  fr: "Séjour avec canapé gris, table basse ronde en marbre et plantes devant une baie vitrée",
  it: "Soggiorno con divano grigio, tavolino rotondo in marmo e piante davanti a una vetrata",
};

// Phones: 72 vw cards, the card image (Media's .bg-linen box) in 3:2.
const ROOM_ITEM = "w-[72vw] max-w-80 max-sm:[&_.bg-linen]:aspect-3/2";

// QM shell-home r2 (tiles 1.6–1.9× upscaled): from sm the landscape photos
// (≈ 1.58:1) are cropped to a 4:5 box with object-cover, so the RENDERED
// image is box height × 1.58 ≈ 2× the card width, not the card width.
// sizes therefore names that rendered width: card width × 1.25 × 1.6.
// Phones (3:2 box ≈ photo ratio) keep the card width.
// QM shell-home r3 (iPad quer): in two columns a 537 × 671 px card needed a
// 2 100 px wide file at DPR 2 – the bed photo exists only at 1 200 px (3.1×
// upscaled, blocky). From 1024 px the four cards stand in ONE row (as from
// 1280 px before), so the rendered photo is ≈ 490 CSS px and every source
// is sharp; the sizes follow (lg = xl = 44vw).
const ROOM_SIZES = "(min-width: 1024px) 44vw, (min-width: 640px) 90vw, 72vw";

export default async function Rooms({ locale }) {
  const t = await getHomeT(locale);
  return (
    <Section tone="band" labelledBy="home-rooms-title" spacing="none" className={SECTION_Y}>
      <SectionIntro id="home-rooms-title" eyebrow={t("rooms.eyebrow")} title={t("rooms.title")} lead={t("rooms.lead")} />
      {/* Mobile (R3, page length): one scroll-snap row of 72 vw cards in 3:2
          (the room photos are landscape campaign shots; 4:5 from sm) with
          visible back/forward buttons (ScrollRow) instead of four stacked
          images (Jury §3.2: CSS scroll-snap, no carousel library). Keyboard:
          every card is a link, focusing it scrolls it into view. From sm the
          usual grid, one line from xl (R5-fix P2: no stagger). */}
      {/* QM shell-home r5 (200 % text, desktop): four columns from 56rem of
          the container (in rem) instead of from lg – with enlarged text two
          columns, so "Kleiderschränke" no longer fills a quarter column. */}
      <div className="@container mt-6 sm:mt-12 lg:mt-12">
        <ScrollRow
          id="home-rooms-list"
          label={t("rooms.eyebrow")}
          labels={scrollLabels(t)}
          className={`${ROW_MOBILE} ${ROW_REVEAL} sm:grid-cols-2 sm:gap-x-grid sm:gap-y-12 sm:@min-[56rem]:grid-cols-4`}
        >
          {ROOMS.map((room) => (
            <li key={room.key} className={`${ROW_ITEM} ${ROOM_ITEM}`} data-room={room.key}>
              <Card
                as="div"
                href={locale === "de" && room.dePage ? room.dePage : productsPath(locale, room.category)}
                title={t(`rooms.${room.key}.title`)}
                text={t(`rooms.${room.key}.text`)}
                image={{ src: room.image, alt: room.key === "living" ? LIVING_ALT[locale] || LIVING_ALT.de : t(`rooms.${room.key}.alt`) }}
                ratio="4/5"
                sizes={ROOM_SIZES}
              />
            </li>
          ))}
        </ScrollRow>
      </div>
    </Section>
  );
}
