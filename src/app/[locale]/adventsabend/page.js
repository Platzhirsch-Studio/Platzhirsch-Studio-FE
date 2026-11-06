// /de/adventsabend — Einladung und Anmeldung zum Adventsabend im Showroom
// (nur Deutsch, andere Sprachen 404). Das Formular (AdventsabendForm.js)
// schickt die Anmeldung über die bestehende Route /api/kontakt.
//
// Eckdaten stehen in ./event.js. Sobald EVENT.startTime gesetzt ist, wird die
// Seite indexiert, gibt ein schema.org-Event aus und zeigt "In den Kalender" —
// vorher bewusst nicht, damit Google keine falsche Uhrzeit anzeigt.
//
// Gestaltung nach Design-Bibel: Gastgeber-Ton, "Nehmen Sie Platz.", Paper/Stone,
// keine Radien und Schatten, höchstens ein Primärknopf pro Ansicht. Kein Foto im
// Kopf: Es gibt noch kein eigenes Bild von Showroom oder Café im Bildregister
// (§7: Herstellerbilder nur mit Freigabe), daher typografischer Auftakt.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import JsonLd from "@/components/Reusable/JsonLd";
import EventCard from "@/components/Event/EventCard";
import { Breadcrumbs } from "@/components/ui";
import { breadcrumbList, graph, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import {
  ADDRESS,
  DIRECTIONS_URL,
  EMAIL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { Link } from "@/i18n/navigation";
import AdventsabendForm from "./AdventsabendForm";
// alt: /api/kontakt wie bisher; ph (formulare + ADVENTSABEND_EVENT_ID): register_event mit Absage-Link.
import { adventSubmitUrl } from "@/lib/backend/adventsabend";
import { ogLocale } from "@/lib/seo/pageMetadata";
import {
  CALENDAR_FILE,
  CALENDAR_PATH,
  DESCRIPTION,
  EVENT,
  PAGE_URL,
  PROGRAMM,
  TITLE,
  capacityLabel,
  eventPublic,
  hasStartTime,
  isoDateTime,
  timeLabel,
} from "./event";

function pageSchema() {
  const webPage = {
    "@type": "WebPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "de-AT",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    breadcrumb: breadcrumbList(
      [{ name: "Startseite", url: `${SITE_URL}/de` }, { name: "Adventsabend" }],
      `${PAGE_URL}#breadcrumb`
    ),
  };

  const startDate = isoDateTime(EVENT.startTime);
  const event = startDate
    ? {
        "@type": "Event",
        "@id": `${PAGE_URL}#event`,
        name: `Adventsabend bei ${SITE_NAME}`,
        description: DESCRIPTION,
        url: PAGE_URL,
        startDate,
        ...(EVENT.endTime ? { endDate: isoDateTime(EVENT.endTime) } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        isAccessibleForFree: EVENT.free,
        // Nur ein eigenes Foto aus dem Bildregister (Design-Bibel §7), kein Herstellerbild.
        ...(EVENT.image ? { image: [EVENT.image] } : {}),
        location: {
          "@type": "Place",
          name: SITE_NAME,
          address: {
            "@type": "PostalAddress",
            streetAddress: ADDRESS.street,
            postalCode: ADDRESS.postalCode,
            addressLocality: ADDRESS.city,
            addressRegion: ADDRESS.region,
            addressCountry: ADDRESS.countryCode,
          },
        },
        organizer: { "@id": ORGANIZATION_ID },
      }
    : null; // Event-Schema erscheint automatisch, sobald EVENT.startTime gesetzt ist.

  return graph(webPage, event);
}

// Runde 4 (r4-technik P2-2, Fix-Team P6): a real 404 while the event is not public (production without EVENT.startTime).
// notFound() during the BUILD (static prerender) made Next 16 store the empty
// shell <html id="__next_error__"> (no lang, no h1) with s-maxage=3600 –
// checked in the production copy (build r4-fix6). The same notFound() at
// REQUEST time renders the 404 page (src/app/not-found.js: lang, h1,
// noindex, status 404, Cache-Control no-store). So the switched-off branch
// first calls connection(): prerendering stops there, the path is rendered
// per request, and nothing is cached. While the page is on, connection() is
// never called and the page stays static (ISR, revalidate below).
// (A page-level generateStaticParams/dynamicParams does not work here: the
// page has no own dynamic segment, Next ignores both – build r4-fix6.)

export async function generateMetadata({ params }) {
  const { locale } = await params;
  // Aus: 404 schon im Metadaten-Schritt, bevor etwas gestreamt wird – ein
  // notFound() nur im Seitenkörper lieferte die leere __next_error__-Hülle
  // (Build r4-fix6b). connection(): pro Anfrage gerendert, nie gecacht.
  if (locale !== "de" || !eventPublic()) {
    await connection();
    notFound();
  }
  return {
    title: `${TITLE} am 26. November | ${SITE_NAME}`,
    description: DESCRIPTION,
    // Ohne Uhrzeit nicht indexieren lassen, bis der Inhaber sie bestätigt.
    robots: { index: hasStartTime(), follow: true },
    alternates: { canonical: PAGE_URL },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title: `${TITLE} – 26. November 2026`,
      description: DESCRIPTION,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      // Kein images-Feld: Das OG-Bild kommt aus ./opengraph-image.js (typografisch,
      // ohne fremde Bildrechte). Mit EVENT.image wird stattdessen das eigene Foto genutzt.
      ...(EVENT.image ? { images: [{ url: EVENT.image, alt: `${TITLE} bei ${SITE_NAME}` }] } : {}),
    },
  };
}

const overline = "text-overline uppercase text-text-accent";

export default async function AdventsabendPage({ params }) {
  const { locale } = await params;
  // Produktion ohne Uhrzeit: 404 (Runde 2, recht P2-6) – pro Anfrage
  // gerendert, siehe Hinweis oben (sonst leere Hülle mit 1 h Cache).
  if (locale !== "de" || !eventPublic()) {
    await connection();
    notFound();
  }

  const withTime = hasStartTime();

  return (
    <div className="bg-surface text-text">
      <JsonLd data={pageSchema()} />

      {/* Auftakt: ein Gedanke, ein Primärknopf (§2 P2) */}
      <section aria-labelledby="aa-titel" className="px-gutter pt-10 pb-16 md:pt-14 md:pb-24 lg:pt-16">
        <div className="mx-auto grid max-w-page gap-y-10 gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:col-start-2">
            {/* Brotkrumen wie auf den übrigen Inhaltsseiten (QA R3 P3-2); JSON-LD steht oben im Graph. */}
            <Breadcrumbs className="mb-stack-m" items={[{ label: "Startseite", href: "/" }, { label: "Adventsabend" }]} />
            <p className={overline}>Einladung · {EVENT.shortDateLabel} in Lochau</p>
            <h1 id="aa-titel" className="font-display text-display-l mt-stack-s">
              {TITLE}
            </h1>
            <p className="font-display-italic text-display-m mt-stack-m text-text">Nehmen Sie Platz.</p>
            <p className="mt-stack-m max-w-measure text-lead text-text">
              Am {EVENT.dateLabel} öffnen wir Showroom und Café für einen Abend im Advent. Wir decken den Tisch, Sie
              bringen gern Familie und Freunde mit.
            </p>
            <div className="mt-stack-m">
              <a
                href="#anmeldung"
                className="ph-press inline-flex h-12 w-full items-center justify-center bg-action px-8 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover sm:w-auto lg:h-13"
              >
                Platz reservieren
              </a>
              <p className="mt-2 text-small text-text-soft">Anmeldung mit Name, E-Mail und Personenzahl.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontlinie: einmal pro Seite (§6, §8.3) */}
      <div className="ph-horizon px-gutter" aria-hidden="true">
        <div className="ph-horizon__line mx-auto h-px max-w-page bg-line-strong" />
      </div>

      {/* Der Abend + Termin-Karte */}
      <section aria-labelledby="aa-abend" className="px-gutter py-section">
        <div className="mx-auto grid max-w-page gap-y-12 gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-2">
            <p className={overline}>Der Abend</p>
            <h2 id="aa-abend" className="font-display text-display-m mt-stack-s">
              Ein Abend bei uns in Lochau
            </h2>
            <div className="mt-stack-m max-w-measure space-y-5 text-body">
              <p>
                Wenn die Tage kürzer werden, wird es bei uns drinnen ruhig und warm. Wir laden Sie zu einem Abend in den
                Showroom von {SITE_NAME} ein: Möbel, Leuchten und Stoffe in Ruhe ansehen, Platz nehmen, ins Gespräch
                kommen.
              </p>
              <p>
                Treffpunkt ist unser Café. Damit genug Plätze und Tassen bereitstehen, bitten wir um eine kurze
                Anmeldung mit der Zahl der Personen.
              </p>
            </div>

            <div className="mt-16">
              <h3 className="text-title">Programm</h3>
              {PROGRAMM.length > 0 ? (
                <ol className="reveal-group mt-6 divide-y divide-line border-y border-line [--reveal-y:12px]">
                  {PROGRAMM.map((punkt, i) => (
                    <li key={punkt.titel} className="flex gap-5 py-5">
                      <span aria-hidden="true" className="w-8 flex-none text-ui text-text-accent tabular">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-ui">{punkt.titel}</p>
                        <p className="mt-1 text-body text-text-soft">{punkt.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 max-w-measure text-body text-text-soft">
                  Uhrzeit und Ablauf stellen wir gerade zusammen. Sie finden beides hier, sobald es feststeht.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-8">
            <EventCard
              id="aa-termin"
              dateLabel={EVENT.dateLabel}
              timeLabel={timeLabel()}
              capacityLabel={capacityLabel()}
              place={{
                name: SITE_NAME,
                street: ADDRESS.street,
                postalCode: ADDRESS.postalCode,
                city: ADDRESS.city,
                country: ADDRESS.country,
              }}
              directionsUrl={DIRECTIONS_URL}
              contact={{ phoneHref: PHONE_HREF, phoneDisplay: PHONE_DISPLAY, emailHref: EMAIL_HREF, email: EMAIL }}
              calendarHref={withTime ? CALENDAR_PATH : undefined}
              calendarFileName={CALENDAR_FILE}
            />
          </div>
        </div>
      </section>

      {/* Anmeldung */}
      <section id="anmeldung" aria-labelledby="aa-anmeldung" className="scroll-mt-24 bg-surface-band px-gutter py-section">
        <div className="mx-auto grid max-w-page gap-y-10 gap-x-grid lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          <div className="lg:col-span-4 lg:col-start-2">
            <p className={overline}>Anmeldung</p>
            <h2 id="aa-anmeldung" className="font-display text-display-m mt-stack-s">
              Wir halten Ihnen einen Platz frei
            </h2>
            <p className="mt-stack-m max-w-measure text-body">
              Sagen Sie uns, mit wie vielen Personen Sie kommen. Fragen beantworten wir gern auch am Telefon unter{" "}
              <a href={PHONE_HREF} className="underline underline-offset-4 tabular">
                {PHONE_DISPLAY}
              </a>
              .
            </p>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 lg:row-span-2">
            <AdventsabendForm dateLabel={EVENT.shortDateLabel} calendarHref={withTime ? CALENDAR_PATH : null} submitUrl={adventSubmitUrl()} />
          </div>

          {/* Pflichtinfos zum kostenlosen Abend (recht/06 §2.1): Foto-Hinweis,
              Hausordnung, Datenschutz mit Löschfrist. Mobil nach dem Formular. */}
          <aside aria-labelledby="aa-hinweise" className="border-t border-line-strong pt-8 lg:col-span-4 lg:col-start-2 lg:row-start-2">
            <h3 id="aa-hinweise" className="text-title">
              Gut zu wissen
            </h3>
            <dl className="mt-6 max-w-measure space-y-5 text-body">
              <div>
                <dt className="text-ui">Fotos</dt>
                <dd className="mt-1 text-text-soft">
                  Wenn wir an dem Abend fotografieren, dann Übersichtsbilder von Raum und Stimmung für unsere Website und
                  unsere Social-Media-Kanäle. Möchten Sie nicht abgebildet werden, sagen Sie es bitte unserem Team.
                  Porträts machen wir nur mit Ihrer Einwilligung, Kinder zeigen wir nicht erkennbar.
                </dd>
              </div>
              <div>
                <dt className="text-ui">Im Showroom</dt>
                <dd className="mt-1 text-text-soft">
                  Manche Ausstellungsstücke sind empfindlich, etwa Leder, Stein und Glas. Bitte stellen Sie Getränke nur
                  auf den dafür vorgesehenen Flächen ab und behalten Sie Kinder im Blick.
                </dd>
              </div>
              <div>
                <dt className="text-ui">Ihre Daten</dt>
                <dd className="mt-1 text-text-soft">
                  Informationen zur Verarbeitung Ihrer Daten finden Sie in unserer{" "}
                  <Link href="/datenschutz" className="underline underline-offset-4 text-text">
                    Datenschutzerklärung
                  </Link>
                  .
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}

export const revalidate = 3600;
