// Prototyp "Dreiländereck" – Startseite.
// Server Component; einzige Interaktion ohne JS (CSS :hover/:focus, <details>).
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Coffee, Phone } from "lucide-react";
import s from "@/components/Preview/dreilaendereck/dl.module.css";
import DreilaenderMap from "@/components/Preview/dreilaendereck/DreilaenderMap";
import { loadBrandWorld } from "@/components/Preview/dreilaendereck/data";
import { BASE, COUNTRIES, HOUSE, LINKS } from "@/components/Preview/dreilaendereck/content";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Prototyp Dreiländereck – Platzhirsch Home Living",
  description: "Design-Prototyp für den Neuauftritt von Platzhirsch Home Living in Lochau. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const ROOMS = [
  {
    title: "Wohnen",
    text: "Sofas, Sessel und Licht für Räume, in denen man gern bleibt.",
    image: "/Images/Home/orionMinoti.jpg",
    alt: "Helles Sofa in einem warm beleuchteten Wohnraum mit Holzwand",
    href: LINKS.wohnen,
  },
  {
    title: "Küche",
    text: "Geplant als Treffpunkt, nicht als Gerätezeile.",
    image: "/Images/Footer/24.jpeg",
    alt: "Küche mit Kochinsel aus Holz, offenen Regalen und einem Baum im Raum",
    href: LINKS.kueche,
  },
  {
    title: "Outdoor",
    text: "Tische, Lounges und Schatten für lange Sommerabende.",
    image: "/Images/Outdoor/bannerImage4.jpg",
    alt: "Weißer Esstisch mit Stühlen auf einer Terrasse über dem Wasser",
    href: LINKS.outdoor,
  },
];

const EVENTS = [
  {
    tag: "Rückblick",
    date: "Fr, 04.09.2026",
    title: "Vernissage mit Kaja El Attar",
    text: "Farbe, Gold und Schrift: Bilder der Künstlerin Kaja El Attar zwischen Sofas und Leuchten.",
    image: "/Images/Vernissage/kaja-el-attar-lebensbaum.jpg",
    alt: "Gemälde von Kaja El Attar – farbenfroher Lebensbaum auf Goldgrund",
    href: LINKS.vernissage,
    linkLabel: "Zum Bericht",
  },
  {
    tag: "Beispielformat · Termin folgt",
    date: null,
    title: "Ein Abend in der Küche",
    text: "Kochen, essen, reden – an einer Küche aus der Ausstellung. Für Bauherren, Planerinnen und Nachbarn.",
    href: LINKS.newsletter,
    linkLabel: "Einladung erhalten",
  },
  {
    tag: "Beispielformat · Termin folgt",
    date: null,
    title: "Langer Donnerstag",
    text: "Ausstellung und Café bleiben länger offen. Zeit für Fragen nach Feierabend.",
    href: LINKS.newsletter,
    linkLabel: "Einladung erhalten",
  },
];

export default async function DreilaendereckHome({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404
  const brands = await loadBrandWorld();

  return (
    <>
      {/* 1 HERO */}
      <section className={s.hero} aria-labelledby="dl-hero-title">
        <div className={s.container}>
          <div className={s.heroGrid}>
            <div className={`${s.heroText} ${s.heroIn}`}>
              <p className={s.overline}>Lochau am Bodensee · AT · DE · CH · FL</p>
              <h1 id="dl-hero-title" className={s.display}>
                Ein Haus zum Wohnen, <span className={s.italic}>mitten im Dreiländereck.</span>
              </h1>
              <p className={s.lead}>
                Ausstellung und Café in Lochau, fünf Minuten von Lindau. Wir planen mit Ihnen Wohnen, Küche und Outdoor –
                in Ruhe, bei einem Kaffee und mit Blick auf das ganze Zuhause.
              </p>
              <div className={s.heroActions}>
                <Link href={LINKS.termin} className={s.btn}>
                  Termin im Showroom <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
                </Link>
                <Link href={`${BASE}#haus`} className={s.btnGhost}>
                  Showroom &amp; Café
                </Link>
              </div>
            </div>
            <div className={s.heroMedia}>
              <Image
                src="/Images/Home/aboutHome.jpg"
                alt="Blick in die Ausstellung: helle Sofas, Sessel und Teppiche in einem großen Raum mit Fensterfront"
                fill
                preload
                sizes="(min-width: 900px) 58vw, 100vw"
                quality={75}
              />
              <span className={s.heroCaption}>Blick in die Ausstellung</span>
            </div>
          </div>

          <div className={s.infoStrip}>
            <div>
              <strong>Heute geöffnet?</strong>
              <span className={s.num}>Di–Fr 10–18 Uhr · Sa 10–14 Uhr · Mo Ruhetag</span>
            </div>
            <div>
              <strong>Adresse</strong>
              {HOUSE.street}, {HOUSE.city}
            </div>
            <div>
              <strong>Telefon</strong>
              <a href={HOUSE.phoneHref} className={s.textLink}>
                {HOUSE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2 WILLKOMMEN */}
      <section className={s.section} aria-labelledby="dl-welcome">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <h2 id="dl-welcome" className={`${s.h2} ${s.reveal}`}>
              Wir sind Gastgeber, bevor wir Einrichter sind.
            </h2>
            <p className={`${s.lead} ${s.reveal}`} style={{ margin: 0 }}>
              Bei uns sitzen Sie zuerst – auf dem Sofa, das Sie interessiert, oder im Café. Dann reden wir über Ihr Haus,
              Ihre Wohnung, Ihr Projekt.
            </p>
          </div>
          <ul className={s.countries} style={{ marginTop: 0 }}>
            {[
              ["01", "Beratung mit Zeit", "Ein Gespräch in der Ausstellung, gern mit Grundriss, Fotos und Maßen."],
              ["02", "Alles aus einer Hand", "Wohnen, Küche, Schlafen, Outdoor und Licht als ein Projekt geplant."],
              ["03", "Bis es fertig ist", "Bestellung, Lieferung und Montage begleiten wir bis zum Schluss."],
              ["04", "Kunst & Abende", "Vernissagen und Abende im Haus – Einladungen per Newsletter."],
            ].map(([n, t, d]) => (
              <li key={n} className={`${s.country} ${s.reveal}`} style={{ listStyle: "none" }}>
                <span className={s.countryCode}>{n}</span>
                <h3 className={s.h3} style={{ marginTop: 8 }}>
                  {t}
                </h3>
                <p>{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 RÄUME */}
      <section id="raeume" className={`${s.section} ${s.bgLinen}`} aria-labelledby="dl-rooms">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Räume</p>
              <h2 id="dl-rooms" className={s.h2}>
                Wohnen, Küche, Outdoor – <span className={s.italic}>ein Zuhause.</span>
              </h2>
            </div>
            <p className={s.lead} style={{ margin: 0 }}>
              Wir denken vom Raum aus, nicht vom Katalog. Deshalb beginnt jede Planung mit der Frage, wie Sie leben wollen.
            </p>
          </div>
          <div className={s.rooms}>
            {ROOMS.map((r) => (
              <Link key={r.title} href={r.href} className={s.roomCard}>
                <div className={`${s.media} ${s.r34} ${s.mask}`}>
                  <Image src={r.image} alt={r.alt} fill sizes="(min-width: 760px) 32vw, 78vw" />
                </div>
                <h3 className={s.h3}>
                  {r.title} <ArrowRight size={18} aria-hidden="true" className={s.arrow} style={{ display: "inline" }} />
                </h3>
                <p>{r.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 KÜCHE ALS TREFFPUNKT */}
      <section id="kueche" className={s.section} aria-labelledby="dl-kitchen">
        <div className={s.container}>
          <div className={`${s.split} ${s.splitWide}`}>
            <div className={`${s.media} ${s.r32} ${s.mask}`}>
              <Image
                src="/Images/Team/dinner-table.jpg"
                alt="Langer Esstisch mit Stühlen vor einer Fensterfront mit Blick ins Grüne und auf das Wasser"
                fill
                sizes="(min-width: 900px) 56vw, 100vw"
              />
            </div>
            <div className={s.reveal}>
              <p className={s.overline}>Küche als Treffpunkt</p>
              <h2 id="dl-kitchen" className={s.h2}>
                Am Ende stehen alle in der Küche.
              </h2>
              <p className={s.text} style={{ margin: "24px 0" }}>
                Deshalb planen wir sie als Mittelpunkt des Hauses: mit Platz für Gäste, einem Tisch, an dem man sitzen
                bleibt, und Licht für lange Abende. Küche, Essplatz und Wohnraum kommen bei uns aus einer Planung.
              </p>
              <Link href={LINKS.kueche} className={s.btnGhost}>
                Küchen ansehen <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 MARKENWELT */}
      <section id="marken" className={`${s.section} ${s.bgLinen}`} aria-labelledby="dl-brands">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Markenwelt</p>
              <h2 id="dl-brands" className={s.h2}>
                Möbel, die man <span className={s.italic}>probesitzen</span> sollte.
              </h2>
            </div>
            <p className={s.lead} style={{ margin: 0 }}>
              Wir zeigen Hersteller, deren Qualität man erst im Raum versteht – vor allem aus Italien. Die
              Minotti-Ausstellung in Lochau ist ein guter Anfang.
            </p>
          </div>
          <div className={s.brandWrap}>
            <ul className={s.brandList}>
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link href={b.slug === "minotti" ? `${BASE}/marken/minotti` : `/de/ueber-uns/marken/${b.slug}`}>
                    <span className={s.brandName}>{b.name}</span>
                    <span className={s.brandMeta}>
                      {[b.origin, b.founded && `seit ${b.founded}`].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className={s.brandStage} aria-hidden="true">
              {brands.map((b) => (
                <div key={b.slug} className={s.brandPreview}>
                  {b.image && <Image src={b.image} alt="" fill sizes="38vw" loading="lazy" />}
                </div>
              ))}
              <div className={s.brandStageDefault}>
                <Image src="/Images/Vernissage/minotti-wohnwelt.jpg" alt="" fill sizes="38vw" loading="lazy" style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>
          <p className={s.legal} style={{ marginTop: 32 }}>
            Wir zeigen und planen mit Möbeln der genannten Hersteller. Markennamen sind Eigentum der jeweiligen Hersteller.{" "}
            <Link href={LINKS.marken} className={s.textLink}>
              Alle Marken
            </Link>
          </p>
        </div>
      </section>

      {/* 6 SHOWROOM & CAFÉ */}
      <section id="haus" className={s.section} aria-labelledby="dl-house">
        <div className={s.container}>
          <div className={s.split}>
            <div className={s.reveal}>
              <p className={s.overline}>Showroom &amp; Café</p>
              <h2 id="dl-house" className={s.h2}>
                Kommen Sie vorbei. <span className={s.italic}>Auf einen Kaffee.</span>
              </h2>
              <p className={s.text} style={{ margin: "24px 0 0" }}>
                Rund 800 m² Ausstellung, innen und außen, und ein Café im selben Haus. Kommen Sie spontan – oder melden
                Sie sich an, dann nehmen wir uns Zeit für Ihr Projekt.
              </p>
              <ul className={s.factList}>
                <li>
                  <span>Adresse</span>
                  <span>
                    {HOUSE.street}, {HOUSE.city}
                  </span>
                </li>
                {HOUSE.hours.map((h) => (
                  <li key={h.days}>
                    <span>{h.days}</span>
                    <span className={s.num}>{h.time}</span>
                  </li>
                ))}
                <li>
                  <span>Außerhalb der Zeiten</span>
                  <span>nach Vereinbarung</span>
                </li>
              </ul>
              <p style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href={HOUSE.mapsHref} className={s.btnGhost} target="_blank" rel="noopener">
                  Route planen <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
                </a>
              </p>
            </div>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
              <div className={`${s.media} ${s.r45} ${s.mask}`} style={{ gridColumn: "1 / -1" }}>
                <Image
                  src="/Images/Home/secondAboutHome.jpg"
                  alt="Ausstellungsfläche mit Sofalandschaft, Sesseln und Kunst an der Wand"
                  fill
                  sizes="(min-width: 900px) 44vw, 100vw"
                />
              </div>
              <div className={`${s.placeholder} ${s.r45}`} role="img" aria-label="Platzhalter für ein Foto aus dem Café">
                <div>
                  <Coffee size={28} aria-hidden="true" />
                  Foto folgt:
                  <br />
                  das Café im Haus
                </div>
              </div>
              <div className={`${s.placeholder} ${s.r45}`} role="img" aria-label="Platzhalter für ein Foto vom Team">
                <div>
                  <Phone size={26} aria-hidden="true" />
                  Foto folgt:
                  <br />
                  Ihre Ansprechpartner
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 ABENDE (einzige dunkle Fläche) */}
      <section id="abende" className={`${s.section} ${s.dark}`} aria-labelledby="dl-evenings">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Einladungen</p>
              <h2 id="dl-evenings" className={s.h2}>
                Abende im Haus.
              </h2>
            </div>
            <p className={s.lead} style={{ margin: 0 }}>
              Ein paar Mal im Jahr wird die Ausstellung zum Wohnzimmer: mit Kunst, Gesprächen und Gästen aus allen vier
              Ländern. Einladungen verschicken wir per Newsletter.
            </p>
          </div>
          <div className={s.events}>
            {EVENTS.map((e) => (
              <article key={e.title} className={s.event}>
                {e.image && (
                  <div className={s.eventImage}>
                    <Image src={e.image} alt={e.alt} fill sizes="(min-width: 900px) 30vw, 100vw" />
                  </div>
                )}
                <span className={s.tag}>{e.tag}</span>
                {e.date && <span className={s.eventDate}>{e.date}</span>}
                <h3 className={s.h3}>{e.title}</h3>
                <p>{e.text}</p>
                <Link href={e.href} className={s.textLink}>
                  {e.linkLabel} <ArrowRight size={16} aria-hidden="true" className={s.arrow} style={{ display: "inline" }} />
                </Link>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 40 }}>
            <Link href={LINKS.newsletter} className={s.btnLight}>
              Einladungen per Newsletter <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
            </Link>
          </p>
        </div>
      </section>

      {/* 8 DREILÄNDER-SERVICE */}
      <section id="dreilaendereck" className={s.section} aria-labelledby="dl-region">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Dreiländer-Service</p>
              <h2 id="dl-region" className={s.h2}>
                Vier Länder, <span className={s.italic}>eine Adresse.</span>
              </h2>
            </div>
            <p className={s.lead} style={{ margin: 0 }}>
              Lochau liegt direkt an der Grenze. Lindau erreichen Sie in fünf Minuten, St. Gallen und Liechtenstein in
              einer knappen Dreiviertelstunde.
            </p>
          </div>
          <DreilaenderMap />
          <ul className={s.countries} style={{ paddingLeft: 0 }}>
            {COUNTRIES.map((c) => (
              <li key={c.code} className={`${s.country} ${s.reveal}`} style={{ listStyle: "none" }}>
                <span className={s.countryCode}>{c.code}</span>
                <h3 className={s.h3} style={{ marginTop: 6 }}>
                  {c.name}
                </h3>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9 TERMIN-CTA */}
      <section className={`${s.section} ${s.bgSand}`} aria-labelledby="dl-cta">
        <div className={`${s.container} ${s.cta}`}>
          <div>
            <p className={s.overline}>Termin</p>
            <h2 id="dl-cta" className={s.h1}>
              Nehmen Sie sich einen Nachmittag. <span className={s.italic}>Wir nehmen uns Zeit.</span>
            </h2>
            <p className={s.lead} style={{ marginTop: 24 }}>
              Bringen Sie Grundriss, Fotos oder einfach Ihre Fragen mit. Wir zeigen Ihnen Materialien und Stücke in der
              Ausstellung und besprechen, wie es weitergeht.
            </p>
            <div className={s.ctaActions}>
              <Link href={LINKS.termin} className={s.btn}>
                Termin vereinbaren <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
              </Link>
              <a href={HOUSE.phoneHref} className={s.btnGhost}>
                <Phone size={18} aria-hidden="true" /> {HOUSE.phone}
              </a>
            </div>
          </div>
          <ol className={s.steps}>
            <li>
              <div>
                <strong>Termin wählen</strong>
                <span>Online oder am Telefon, auch außerhalb der Öffnungszeiten.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Gespräch in der Ausstellung</strong>
                <span>Mit Grundriss, Fotos und Maßen – oder erst einmal nur mit Ideen.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Planung</strong>
                <span>Möbel, Materialien, Farben und Licht für Ihre Räume.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Lieferung &amp; Montage</strong>
                <span>Wir kümmern uns um Bestellung, Lieferung und Aufbau.</span>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
