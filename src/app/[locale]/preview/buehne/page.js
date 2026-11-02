import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Phone } from "lucide-react";
import s from "@/components/Preview/buehne/buehne.module.css";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";
import {
  BASE,
  BRANDS,
  CONTACT,
  COUNTRIES,
  FEATURED_BRANDS,
  HOURS,
  NOINDEX,
  ROOMS,
} from "@/components/Preview/buehne/content";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Bühne – Startseite | Prototyp Platzhirsch",
  description: "Design-Prototyp „Bühne“ für den Neuauftritt von Platzhirsch Home Living. Nicht öffentlich.",
  robots: NOINDEX,
});

function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={`${s.heroMedia} ${s.heroParallax}`}>
        {/* LCP element: preloaded, full opacity from the first paint; only a
            single ≤ 5 s scale-down runs on it (none under reduced motion).
            A <video> (poster = this image) can be layered on top once a
            showroom film exists – see prototyp-buehne.md. */}
        <Image
          src="/Images/Home/grey-and-brown-combo-style-room-1.jpg"
          alt="Abendstimmung in einem Wohnraum mit hellem Sofa, Steintisch und raumhoher Verglasung zum Garten"
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          quality={75}
          className={s.kenBurns}
        />
      </div>
      <div className={s.heroShade} aria-hidden="true" />
      <div className={`${s.container} ${s.heroContent} ${s.heroFade}`}>
        <p className={`${s.overline} ${s.rise}`}>Einrichtungsstudio &amp; Café · Lochau am Bodensee</p>
        <h1 id="hero-title" className={`${s.display} ${s.mega} ${s.rise2} mt-6`}>
          Bühne frei
          <br />
          <span className={s.italic}>für Ihr Zuhause.</span>
        </h1>
        <div className={`${s.heroMeta} ${s.rise3}`}>
          <p className={s.lead}>
            Wohnen, Küche, Schlafen und Outdoor – in einer Ausstellung im Dreiländereck zwischen Bregenz und Lindau.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href={`${BASE}#termin`} className={s.btn}>
              Termin vereinbaren <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href="#intro" className={s.scrollCue}>
              Weiter
              <span aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section id="intro" className={s.section} aria-labelledby="intro-title">
      <div className={s.container}>
        <h2 id="intro-title" className={s.overline}>
          Das Haus
        </h2>
        <p className={`${s.display} ${s.statement} ${s.reveal} mt-8`}>
          Wir zeigen Möbel nicht im Regal, sondern im Raum. Mit Licht, Stoffen und einem Kaffee –
          <em> damit Sie spüren, wie es sich bei Ihnen anfühlen wird.</em>
        </p>
      </div>
    </section>
  );
}

function Brands() {
  return (
    <section className={`${s.section} ${s.flushTop}`} aria-labelledby="marken-title">
      <div className={s.container}>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={s.overline}>Markenwelt</p>
            <h2 id="marken-title" className={`${s.display} ${s.h2} mt-5`}>
              Italienisches Design,
              <br />
              <span className={s.italic}>in Lochau zu Hause.</span>
            </h2>
          </div>
          <p className={`${s.lead} max-w-md`}>
            Diese Marken führen wir in der Ausstellung. Viele Stücke stehen bei uns zum Probesitzen.
          </p>
        </div>

        <div className={s.brandCards}>
          {FEATURED_BRANDS.map((b) => (
            <Link key={b.name} href={b.href} className={s.brandCard}>
              <div className={`${s.frame} ${s.mask}`}>
                <Image src={b.image} alt={b.alt} fill sizes="(min-width: 48rem) 40vw, 100vw" />
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h3 className={`${s.display} ${s.h3}`}>{b.name}</h3>
                <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-[#d1b250]" />
              </div>
              <p className={`${s.muted} mt-1`}>{b.line}</p>
            </Link>
          ))}
        </div>

        <hr className={`${s.hairline} my-16`} />
        <h3 className="sr-only">Alle Marken in der Ausstellung</h3>
        <ul className={s.brandWall}>
          {BRANDS.map((name) =>
            name === "Minotti" ? (
              <li key={name} className={s.brandActive}>
                <Link href={`${BASE}/marken/minotti`}>{name}</Link>
              </li>
            ) : (
              <li key={name}>{name}</li>
            )
          )}
        </ul>
      </div>
    </section>
  );
}

function RoomStory() {
  return (
    <section id="raeume" className={s.story} aria-labelledby="raeume-title">
      <h2 id="raeume-title" className="sr-only">
        Räume: Wohnen, Küche, Schlafen, Outdoor
      </h2>
      {ROOMS.map((room) => (
        <article key={room.id} id={room.id} className={s.chapter} aria-labelledby={`${room.id}-title`}>
          <div className={s.chapterMedia}>
            <Image src={room.image} alt={room.alt} fill sizes="100vw" quality={75} />
          </div>
          <div className={s.chapterShade} aria-hidden="true" />
          <ol className={s.chapterIndex} aria-hidden="true">
            {ROOMS.map((r) => (
              <li key={r.id} aria-current={r.id === room.id ? "true" : undefined}>
                {r.num} {r.title}
              </li>
            ))}
          </ol>
          <div className={`${s.container} ${s.chapterBody}`}>
            <div>
              <p className={s.chapterNum}>
                {room.num} — {room.kicker}
              </p>
              <h3 id={`${room.id}-title`} className={`${s.display} ${s.mega} mt-4`}>
                {room.title}
              </h3>
            </div>
            <div>
              <p className={s.lead} style={{ color: "#e2dace" }}>
                {room.text}
              </p>
              <Link href={room.link.href} className={`${s.link} mt-6`}>
                {room.link.label} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function Showroom() {
  return (
    <section id="showroom" className={`${s.section} bg-[#171513]`} aria-labelledby="showroom-title">
      <div className={`${s.container} ${s.split}`}>
        <div className="grid grid-cols-6 gap-4">
          <div className={`${s.frame} ${s.parallax} col-span-6 aspect-4/3 sm:col-span-5`}>
            <Image
              src="/Images/Home/aboutHome.jpg"
              alt="Showroom in Lochau: Sofas und Sessel unter einer langen Fensterfront mit Vorhängen"
              fill
              sizes="(min-width: 64rem) 50vw, 100vw"
            />
          </div>
          <div className={`${s.frame} ${s.mask} col-span-4 col-start-3 -mt-24 aspect-4/3 sm:col-span-3 sm:col-start-4`}>
            <Image
              src="/Images/Home/secondAboutHome.jpg"
              alt="Blick in die Ausstellung mit Ecksofa, Leuchten und Kunst an der Wand"
              fill
              sizes="(min-width: 64rem) 25vw, 60vw"
            />
          </div>
        </div>
        <div>
          <p className={s.overline}>Showroom &amp; Café</p>
          <h2 id="showroom-title" className={`${s.display} ${s.h2} mt-5`}>
            Erst ein Kaffee.
            <br />
            <span className={s.italic}>Dann das Sofa.</span>
          </h2>
          <p className={`${s.lead} mt-8`}>
            Rund 800 m² Ausstellung und ein Café unter einem Dach. Setzen Sie sich, fühlen Sie Stoffe und Leder und
            lassen Sie sich Zeit.
          </p>
          <dl className={s.facts}>
            <div>
              <dt>Adresse</dt>
              <dd>
                {CONTACT.street}
                <br />
                6911 Lochau
              </dd>
            </div>
            {HOURS.map((h) => (
              <div key={h.days}>
                <dt>{h.days}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
            <div>
              <dt>Lage</dt>
              <dd>zwischen Bregenz und Lindau</dd>
            </div>
          </dl>
          <a href={CONTACT.maps} target="_blank" rel="noopener noreferrer" className={`${s.link} mt-10`}>
            Route planen <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">(Google Maps, neuer Tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Service() {
  return (
    <section id="service" className={s.section} aria-labelledby="service-title">
      <div className={s.container}>
        <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={s.overline}>Dreiländer-Service</p>
            <h2 id="service-title" className={`${s.display} ${s.h2} mt-5`}>
              Ein Ansprechpartner.
              <br />
              <span className={s.italic}>Vier Länder.</span>
            </h2>
          </div>
          <div>
            <p className={s.lead}>
              Lochau liegt im Dreiländereck. Wir planen, liefern und montieren für Kundinnen und Kunden in Österreich,
              Deutschland, der Schweiz und Liechtenstein.
            </p>
            <p className={`${s.note} mt-6`}>
              Prototyp: Leistungsumfang je Land (Festpreis, Verzollung, Montage) vor Livegang bestätigen.
            </p>
          </div>
        </div>
        <ul className={s.countries}>
          {COUNTRIES.map((c) => (
            <li key={c.code} className={`${s.country} ${s.reveal}`}>
              <p className={s.countryCode} aria-hidden="true">
                {c.code}
              </p>
              <h3 className="mt-4 text-lg font-medium">{c.name}</h3>
              <p className={`${s.muted} mt-2 text-[0.95rem]`}>{c.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Termin() {
  return (
    <section id="termin" className={`${s.section} ${s.cta}`} aria-labelledby="termin-title">
      <div className={`${s.ctaMedia} ${s.parallax}`}>
        <Image src="/Images/Partner/dinner-area.jpg" alt="" fill sizes="100vw" quality={60} />
      </div>
      <div className={s.container}>
        <p className={s.overline}>Ihr Termin in Lochau</p>
        <h2 id="termin-title" className={`${s.display} ${s.h1} mx-auto mt-6 max-w-5xl`}>
          Nehmen Sie Platz.
          <br />
          <span className={s.italic}>Wir nehmen uns Zeit.</span>
        </h2>
        <p className={`${s.lead} mx-auto mt-8`}>
          Bringen Sie Grundriss, Fotos oder einfach eine Idee mit. Wir beraten Sie im Showroom oder bei Ihnen zu Hause.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/de/beratung" className={s.btn}>
            Beratung anfragen <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <a href={CONTACT.telHref} className={s.btnGhost}>
            <Phone aria-hidden="true" className="h-4 w-4" /> {CONTACT.tel}
          </a>
        </div>
      </div>
    </section>
  );
}

export default async function BuehneHome({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  return (
    <>
      <Hero />
      <Intro />
      <Brands />
      <RoomStory />
      <Showroom />
      <Service />
      <Termin />
    </>
  );
}
