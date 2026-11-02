// ShowroomPage – Seite /[locale]/showroom „Das Haus, jederzeit offen“ (N1).
// Server-Komponente. Aufbau (mobil zuerst):
//   1. Kopf: Eyebrow, H1; Bühne (ShowroomStage, Client): Poster = LCP, 3D erst
//   2. nach Klick; Lead und Stand der Ausstellung (mobil unter, Desktop über der Bühne)
//   3. Alle Stationen und Stücke als Liste (<details>, server-gerendert)
//   4. Was Sie hier sehen (Herkunft der Aufnahme, keine KI)
//   5. Wie bei uns eine Einrichtung entsteht (Kern-USP Nr. 8, nur Text,
//      kein Bild ohne echtes Material)
//   6. Besuch: Termin, Route, Öffnungszeiten (das dunkle Kapitel ist die Bühne)
//   7. Technik und Datenschutz
import { ArrowUpRight } from "lucide-react";
import { Button, Container, Eyebrow, Heading, Lead, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import JsonLd from "@/components/Reusable/JsonLd";
import { ADDRESS, DIRECTIONS_URL, PHONE_DISPLAY, PHONE_HREF, openingHoursLine } from "@/lib/site";
import { monthYear } from "@/lib/showroom/copy";
import { pageCopy } from "./honestCopy";
import { showroomSchema } from "@/lib/showroom/schema";
import { localizeShowroomHref } from "@/lib/showroom/paths";
import ShowroomStage from "./ShowroomStage";
import StationList from "./StationList";
import s from "./showroom.module.css";

export default function ShowroomPage({ locale, tour, mode, aufnahmeDatum }) {
  // R8 (gesamtwerk P1-6): Testszene → ehrlicher Kopf ohne „Rundgang“ (honestCopy.js)
  const t = pageCopy(locale, tour.test);
  const beratungPath = localizeShowroomHref("/beratung", locale).href;
  const arbeitsweise = localizeShowroomHref("/arbeitsweise", locale);
  const standLabel = tour.stand ? t.stand(monthYear(tour.stand, locale)) : null;
  const clientTour = { ...tour, standLabel };
  return (
    <>
      <JsonLd data={showroomSchema({ locale, title: t.meta.title, description: t.meta.description, tour, aufnahmeDatum })} />

      {mode !== "public" && (
        <p className={s.previewBand} role="note">
          {t.vorschau}
        </p>
      )}

      {/* Mobil: Poster direkt unter der H1 (LCP = Poster, Akzeptanz 2), Lead danach;
          ab 768 px: Lead neben dem Stand, Bühne darunter (CSS order). */}
      <section aria-labelledby="showroom-h1" className={s.intro}>
        <Container className={s.introHead}>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Heading level={1} size="display-l" id="showroom-h1" className="mt-4">
            {t.h1}
          </Heading>
        </Container>
        <Container className={s.introLead}>
          <Lead>{t.lead}</Lead>
          {standLabel && (
            <p className={s.stand}>
              <span aria-hidden="true" className={s.standMark} />
              {standLabel}
            </p>
          )}
        </Container>
        <Container size="full" className={s.stageContainer}>
          <ShowroomStage tour={clientTour} locale={locale} beratungPath={beratungPath} />
        </Container>
      </section>

      <Container className={s.listContainer}>
        <StationList tour={tour} t={t} beratungPath={beratungPath} />
      </Container>

      {/* QM r3: with the test scene in preview the paragraph only repeated the band
          above word for word – it is left out then. */}
      {/* Optik QA: one short paragraph – compact rhythm instead of 2 × 176 px air. */}
      {!(tour.test && mode !== "public") && (
        <Section spacing="compact" labelledBy="showroom-sehen">
          <div className={s.twoCol}>
            <Heading level={2} size="display-m" id="showroom-sehen">
              {t.abschnitte.sehenTitel}
            </Heading>
            <div className={s.prose}>
              <p>{tour.test ? t.vorschau : t.abschnitte.sehenText}</p>
            </div>
          </div>
        </Section>
      )}

      <Section tone="band" spacing="default" labelledBy="showroom-harald">
        <div className={s.twoCol}>
          <Heading level={2} size="display-m" id="showroom-harald">
            {t.abschnitte.harald}
          </Heading>
          <div className={s.prose}>
            <p>{t.abschnitte.haraldText}</p>
            <p className="mt-6">
              <Link href={arbeitsweise.href} locale={arbeitsweise.locale} className={s.textLink}>
                {t.abschnitte.haraldLink}
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section tone="raised" spacing="default" labelledBy="showroom-besuch">
        <div className={s.twoCol}>
          <div>
            <Heading level={2} size="display-m" id="showroom-besuch">
              {t.abschnitte.besuch}
            </Heading>
            <p className={s.besuchText}>{t.abschnitte.besuchText}</p>
            <div className={s.ctaRow}>
              <Button href={beratungPath} arrow>
                {t.abschnitte.termin}
              </Button>
              <Button href={DIRECTIONS_URL} variant="secondary" target="_blank" rel="noopener noreferrer">
                {t.abschnitte.route}
              </Button>
            </div>
          </div>
          <address className={s.address}>
            <span>Platzhirsch Home Living</span>
            <span>{ADDRESS.street}</span>
            <span>
              {ADDRESS.postalCode} {ADDRESS.city}
            </span>
            <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
            <span className={s.addressLabel}>{t.abschnitte.zeiten}</span>
            <span>{openingHoursLine(locale)}</span>
          </address>
        </div>
      </Section>

      <Section spacing="compact" labelledBy="showroom-technik">
        <div className={s.twoCol}>
          <Heading level={2} size="title" id="showroom-technik">
            {t.abschnitte.technik}
          </Heading>
          <p className={s.small}>{t.abschnitte.technikText}</p>
        </div>
      </Section>
    </>
  );
}
