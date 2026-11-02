import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BASE, BRANDS, COUNTRIES, IMAGES, ROOMS, SITE, STUDIO } from "@/components/Preview/galerie/content";
import s from "@/components/Preview/galerie/galerie.module.css";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Galerie – Prototyp Startseite | Platzhirsch Home Living",
  description: "Design-Prototyp „Galerie“ für den Neuauftritt von Platzhirsch Home Living in Lochau. Nicht indexiert.",
  robots: { index: false, follow: false },
});

const Arrow = () => (
  <span className={s.arrow} aria-hidden="true">
    →
  </span>
);

export default async function GalerieHome({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  return (
    <>
      {/* 1 – Hero: one image, one sentence, one action. */}
      <section className={s.hero} aria-labelledby="hero-title">
        <Image
          src={IMAGES.hero.src}
          alt={IMAGES.hero.alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          quality={75}
          className={s.heroImg}
        />
        <div className={s.heroShade} />
        <div className={s.heroText}>
          <div className={`${s.container} ${s.heroGrid}`}>
            <div style={{ display: "grid", gap: 24 }}>
              <p className={`${s.overline} ${s.heroFade}`}>Lochau · Bodensee</p>
              <h1 id="hero-title" className={s.display}>
                <span className={s.line}>Wohnen,</span>
                <span className={`${s.line} ${s.italic}`}>in Ruhe</span>
                <span className={s.line}>ausgewählt.</span>
              </h1>
            </div>
            <div className={`${s.heroAside} ${s.heroFade}`}>
              <p className={`${s.lead} ${s.heroLead}`}>
                Italienisches Design, ein Café und Zeit für Ihr Projekt – in unserem Haus an der Landstraße in Lochau.
              </p>
              <div className={s.heroLinks}>
                <a href={SITE.termin} className={`${s.button} ${s.heroButton}`}>
                  Termin im Showroom <Arrow />
                </a>
                <a href="#haus" className={s.link}>
                  Das Haus entdecken
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 – Breathing space: the attitude in one statement. */}
      <section className={s.section} aria-labelledby="intro-title">
        <div className={`${s.container} ${s.statement}`}>
          <p className={s.overline}>Das Haus</p>
          <div className={s.statementBody}>
            <h2 id="intro-title" className={`${s.quote} ${s.reveal}`}>
              Wir verstehen uns als Gastgeber, nicht als Möbelmarkt. Bei uns sitzen Sie im Café, blättern in Stoffmustern und
              <em> sehen die Stücke im Raum</em>, bevor Sie entscheiden.
            </h2>
            <a href="#haus" className={s.link} style={{ justifySelf: "start" }}>
              Showroom &amp; Café <Arrow />
            </a>
          </div>
        </div>
      </section>

      {/* 3 – Brand world: typographic, no logos as seals. */}
      <section id="marken" className={`${s.section} ${s.stone}`} aria-labelledby="marken-title">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div style={{ display: "grid", gap: 20 }}>
              <p className={s.overline}>Markenwelt</p>
              <h2 id="marken-title" className={`${s.h2} ${s.reveal}`}>
                Häuser mit Haltung.
              </h2>
            </div>
            <p className={`${s.body} ${s.muted}`}>
              Wir zeigen Möbel, Leuchten und Küchen von Manufakturen, deren Arbeit wir kennen. Viele davon führen wir in der Ausstellung in
              Lochau, den Rest planen wir mit Ihnen nach Katalog und Muster.
            </p>
          </div>
          <div className={s.brands}>
            <div className={s.brandsList}>
              <ul className={s.brandList}>
                {BRANDS.map((b, i) => (
                  <li key={b.name} className={`${s.brandItem} ${i === 0 ? s.brandFeatured : ""}`}>
                    <Link href={b.href} className={s.brandLink}>
                      <span className={s.brandName}>{b.name}</span>
                      <span className={s.brandMeta}>{i === 0 ? "Markenwelt ansehen →" : b.origin}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 32 }}>
                <a href={SITE.marken} className={s.link}>
                  Alle Marken <Arrow />
                </a>
              </p>
            </div>
            <figure className={s.brandsMedia} style={{ margin: 0 }}>
              <div className={`${s.frame} ${s.ratio45} ${s.mask}`}>
                <Image src={IMAGES.marken.src} alt={IMAGES.marken.alt} fill sizes="(min-width: 1024px) 30vw, 100vw" className={s.cover} />
              </div>
              <figcaption className={`${s.caption} ${s.small} ${s.muted}`}>Minotti in der Ausstellung in Lochau erleben.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 4 – Rooms first: Wohnen, Küche, Outdoor. */}
      <section id="raeume" className={s.section} aria-labelledby="raeume-title">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div style={{ display: "grid", gap: 20 }}>
              <p className={s.overline}>Räume</p>
              <h2 id="raeume-title" className={`${s.h2} ${s.reveal}`}>
                Ein Haus, <em>drei Räume.</em>
              </h2>
            </div>
            <p className={`${s.body} ${s.muted}`}>
              Wohnen, Küche und Outdoor planen wir als ein Projekt – mit einer Ansprechperson von der ersten Idee bis zur Montage.
            </p>
          </div>
          <ul className={s.rooms} style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {ROOMS.map((room) => (
              <li key={room.key} className={s.room}>
                <Link href={room.href} className={s.roomLink}>
                  <div className={`${s.frame} ${s.ratio34} ${s.mask}`}>
                    <Image src={room.image.src} alt={room.image.alt} fill sizes="(min-width: 768px) 32vw, 82vw" className={s.cover} />
                  </div>
                  <h3 className={s.h3}>
                    {room.title} <Arrow />
                  </h3>
                </Link>
                <p className={`${s.small} ${s.muted}`} style={{ margin: 0, maxWidth: "28em" }}>
                  {room.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 – Showroom & Café: the one dark surface of the page. */}
      <section id="haus" className={`${s.section} ${s.dark}`} aria-labelledby="haus-title">
        <div className={`${s.container} ${s.showroom}`}>
          <div className={s.showroomMedia}>
            <div className={`${s.frame} ${s.ratio32} ${s.mask}`}>
              <Image src={IMAGES.showroom.src} alt={IMAGES.showroom.alt} fill sizes="(min-width: 1024px) 58vw, 100vw" className={s.cover} />
            </div>
          </div>
          <div className={s.showroomText}>
            <p className={s.overline}>Showroom &amp; Café</p>
            <h2 id="haus-title" className={`${s.h2} ${s.reveal}`}>
              Rund 800&nbsp;m², <em>ein Café</em> und Zeit.
            </h2>
            <p className={s.body}>
              Unsere Ausstellung zeigt Wohnsituationen statt Regalreihen. Nehmen Sie Platz, trinken Sie einen Kaffee und lassen Sie sich
              Bezüge, Hölzer und Maße erklären – ohne Eile.
            </p>
            <dl className={s.hours}>
              {STUDIO.hours.map(([d, h]) => (
                <div key={d}>
                  <dt>{d}</dt>
                  <dd className={s.num}>{h}</dd>
                </div>
              ))}
            </dl>
            <p className={s.small} style={{ margin: 0 }}>
              {STUDIO.street}, {STUDIO.city} ·{" "}
              <a href={STUDIO.maps} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
                Route planen
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* 6 – Dreiländer-Service. */}
      <section id="service" className={s.section} aria-labelledby="service-title">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div style={{ display: "grid", gap: 20 }}>
              <p className={s.overline}>Dreiländereck</p>
              <h2 id="service-title" className={`${s.h2} ${s.reveal}`}>
                Am Bodensee zu Hause, <em>über Grenzen</em> tätig.
              </h2>
            </div>
            <p className={`${s.body} ${s.muted}`}>
              Lochau liegt zwischen Bregenz und Lindau, wenige Minuten von Deutschland und der Schweiz entfernt. Wir beraten Kundinnen und
              Kunden aus der gesamten Bodenseeregion.
            </p>
          </div>
          <ul className={s.countries} style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {COUNTRIES.map((c) => (
              <li key={c.code} className={`${s.country} ${s.reveal}`}>
                <span className={s.countryCode} aria-hidden="true">
                  {c.code}
                </span>
                <h3 className={s.overline} style={{ color: "var(--ink)" }}>
                  {c.name}
                </h3>
                <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>
                  {c.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7 – Appointment. */}
      <section id="termin" className={`${s.section} ${s.stone}`} aria-labelledby="termin-title">
        <div className={`${s.container} ${s.cta}`}>
          <div className={s.ctaMedia}>
            <div className={`${s.frame} ${s.ratio45} ${s.mask}`}>
              <Image src={IMAGES.termin.src} alt={IMAGES.termin.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className={s.cover} />
            </div>
          </div>
          <div className={s.ctaText}>
            <p className={s.overline}>Persönliche Beratung</p>
            <h2 id="termin-title" className={`${s.h2} ${s.reveal}`}>
              Ein Termin, <em>eine Tasse Kaffee,</em> Ihr Projekt.
            </h2>
            <p className={s.body}>
              Bringen Sie Grundriss, Fotos oder einfach eine Idee mit. Wir nehmen uns Zeit, zeigen Ihnen passende Stücke in der Ausstellung und
              besprechen die nächsten Schritte.
            </p>
            <div className={s.ctaActions}>
              <a href={SITE.termin} className={s.button}>
                Termin vereinbaren <Arrow />
              </a>
              <a href={STUDIO.phoneHref} className={s.link}>
                {STUDIO.phone}
              </a>
            </div>
            <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>
              Oder schreiben Sie uns: <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>
            </p>
          </div>
        </div>
      </section>

      <div className={s.container} style={{ paddingBlock: 48 }}>
        <p className={s.note}>
          Prototyp-Hinweis: Diese Seite ist ein Gestaltungsentwurf. Bilder stammen aus dem bestehenden Bildbestand der Website und werden vor
          einem Livegang durch eigene Fotografie ersetzt bzw. auf Nutzungsrechte geprüft. Weiter zur{" "}
          <Link href={`${BASE}/marken/minotti`} style={{ textDecoration: "underline" }}>
            Markenseite Minotti
          </Link>
          .
        </p>
      </div>
    </>
  );
}
