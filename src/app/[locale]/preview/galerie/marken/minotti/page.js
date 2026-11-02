import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BASE, SITE, STUDIO } from "@/components/Preview/galerie/content";
import { loadMinotti, storyParagraphs, toCard } from "@/components/Preview/galerie/catalog";
import s from "@/components/Preview/galerie/galerie.module.css";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Minotti – Prototyp Markenseite | Platzhirsch Home Living",
  description: "Design-Prototyp „Galerie“: Markenwelt Minotti. Nicht indexiert.",
  robots: { index: false, follow: false },
});

const HERO = { src: "/cmx/files/minotti-connery-01.webp", alt: "Minotti Wohnszene: helles Ecksofa Connery mit Couchtischen vor einer raumhohen Fensterfront" };
const DETAIL = { src: "/cmx/files/minotti-lawrence-04.webp", alt: "Detail eines Minotti-Sofas Lawrence: Armlehne und Kissen in grauem Leder mit sichtbaren Nähten" };

// Rows of the collection, each a calm horizontal rail (CSS scroll-snap, 0 kB JS).
const ROWS = [
  { key: "sofas-couches", title: "Sofas" },
  { key: "armchairs-stools", title: "Sessel" },
  { key: "dining-tables", title: "Esstische" },
  { key: "beds", title: "Betten" },
];

const Arrow = () => (
  <span className={s.arrow} aria-hidden="true">
    →
  </span>
);

function Card({ card, sizes }) {
  return (
    <Link href={card.href} className={s.card}>
      <div className={`${s.frame} ${s.ratio45}`}>
        <Image src={card.image} alt={card.alt} fill sizes={sizes} className={s.cover} />
      </div>
      <p className={s.overline}>{card.category}</p>
      <h3 className={s.cardTitle}>{card.name}</h3>
    </Link>
  );
}

export default async function MinottiPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  const { marke, products } = await loadMinotti();
  const cards = products.map(toCard);
  const byCat = (key) => cards.filter((c) => c.categoryKey === key);

  // Hand-picked opening selection: the pieces the hero and story talk about,
  // then the first of each row, falling back to whatever the catalogue has.
  const preferred = ["sofas-lawrence", "tables-connery", "sofas-dylan", "sofas-torii-sofas", "armchairs-aston-sofa", "sofas-hamilton", "sofas-daniels", "produkt-blazer"];
  const selection = preferred.map((slug) => cards.find((c) => c.slug === slug)).filter(Boolean);
  for (const c of cards) if (selection.length < 8 && !selection.includes(c)) selection.push(c);

  const story = storyParagraphs(marke?.beschreibung);
  const crafts = (Array.isArray(marke?.craft_disciplines) ? marke.craft_disciplines : []).filter((c) => c.title_de && c.text_de);
  const facts = [
    ["Herkunft", marke?.herkunftsland ? `Meda, ${marke.herkunftsland}` : "Italien"],
    ["Gegründet", marke?.grundungsjahr || "1948"],
    ["Gründer", marke?.grunder || "Alberto Minotti"],
    ["Im Katalog", `${cards.length} Stücke`],
  ];

  return (
    <>
      <div className={s.container}>
        <nav aria-label="Brotkrumen">
          <ol className={s.crumbs}>
            <li>
              <Link href={BASE}>Start</Link>
            </li>
            <li>
              <a href={`${BASE}#marken`}>Marken</a>
            </li>
            <li aria-current="page">Minotti</li>
          </ol>
        </nav>
      </div>

      <section className={s.sectionTight} style={{ paddingBottom: 48 }} aria-labelledby="brand-title">
        <div className={s.container} style={{ display: "grid", gap: 24 }}>
          <p className={s.overline}>Italien · seit {marke?.grundungsjahr || "1948"}</p>
          <h1 id="brand-title" className={s.display}>
            <span className={s.line}>Minotti</span>
          </h1>
          <div className={s.heroGrid} style={{ marginTop: 8 }}>
            <p className={s.lead}>
              Großzügige Volumen, strenge Linien, feine Polsterarbeit. Minotti bei uns erleben – in der Ausstellung in Lochau, mit Bezügen und
              Hölzern zum Anfassen.
            </p>
            <div className={s.heroLinks}>
              <a href={SITE.termin} className={s.button}>
                Minotti im Showroom erleben <Arrow />
              </a>
              <a href="#kollektion" className={s.link}>
                Kollektion ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className={s.container}>
        <div className={`${s.frame} ${s.ratio219}`} style={{ minHeight: 320 }}>
          <Image src={HERO.src} alt={HERO.alt} fill preload fetchPriority="high" sizes="(min-width: 1440px) 1280px, 100vw" className={`${s.cover} ${s.heroImg}`} />
        </div>
      </div>

      <section className={s.sectionTight} aria-label="Eckdaten">
        <div className={s.container}>
          <dl className={s.facts}>
            {facts.map(([dt, dd]) => (
              <div key={dt} className={s.fact}>
                <dt>{dt}</dt>
                <dd className={s.num}>{dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={s.section} style={{ paddingTop: 0 }} aria-labelledby="story-title">
        <div className={`${s.container} ${s.split}`}>
          <div className={s.splitText}>
            <p className={s.overline}>Die Marke</p>
            <h2 id="story-title" className={`${s.h2} ${s.reveal}`}>
              Aus einer Werkstatt in Meda <em>zu einer Handschrift.</em>
            </h2>
            {story.map((p) => (
              <p key={p.slice(0, 24)} className={s.body}>
                {p}
              </p>
            ))}
            {marke?.desing_approach_de && marke.desing_approach_de !== "null" && (
              <p className={`${s.quote} ${s.italic}`} style={{ fontSize: "clamp(26px, 2.4vw, 36px)", marginTop: 16 }}>
                „{marke.desing_approach_de}“
              </p>
            )}
          </div>
          <figure className={`${s.splitMedia} ${s.splitMediaOffset}`} style={{ margin: 0 }}>
            <div className={`${s.frame} ${s.ratio34} ${s.mask}`}>
              <Image src={DETAIL.src} alt={DETAIL.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className={s.cover} />
            </div>
            <figcaption className={`${s.caption} ${s.small} ${s.muted}`}>Lawrence – Polsterarbeit im Detail.</figcaption>
          </figure>
        </div>
      </section>

      {crafts.length > 0 && (
        <section className={`${s.section} ${s.stone}`} aria-labelledby="craft-title">
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div style={{ display: "grid", gap: 20 }}>
                <p className={s.overline}>Handwerk</p>
                <h2 id="craft-title" className={`${s.h2} ${s.reveal}`}>
                  Vier Disziplinen.
                </h2>
              </div>
              <p className={`${s.body} ${s.muted}`}>Was ein Minotti-Stück ausmacht, sehen Sie am besten aus der Nähe – und erklären wir gern im Showroom.</p>
            </div>
            <ol className={s.crafts} style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {crafts.map((c, i) => (
                <li key={c.name || i} className={`${s.craft} ${s.reveal}`}>
                  <span className={s.craftIndex}>0{i + 1}</span>
                  <h3 className={s.h3}>
                    {c.title_de}
                    <span className={s.overline} style={{ display: "block", marginTop: 8 }}>
                      {c.eyeline_de}
                    </span>
                  </h3>
                  <p className={`${s.body} ${s.muted}`}>{c.text_de}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section id="kollektion" className={s.section} aria-labelledby="sel-title">
        <div className={s.container}>
          <div className={s.rowHead}>
            <div style={{ display: "grid", gap: 16 }}>
              <p className={s.overline}>Auswahl</p>
              <h2 id="sel-title" className={s.h2}>
                Ausgewählte Stücke
              </h2>
            </div>
            <a href={`${SITE.marken}/minotti`} className={s.link}>
              Alle {cards.length} Stücke im Katalog <Arrow />
            </a>
          </div>
          {selection.length > 0 ? (
            <ul className={s.productGrid} style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {selection.map((card) => (
                <li key={card.slug}>
                  <Card card={card} sizes="(min-width: 1024px) 23vw, 48vw" />
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.muted}>Der Katalog ist gerade nicht erreichbar.</p>
          )}
        </div>
      </section>

      {ROWS.map((row) => {
        const items = byCat(row.key).slice(0, 12);
        if (items.length < 3) return null;
        return (
          <section key={row.key} className={s.sectionTight} style={{ paddingTop: 0 }} aria-labelledby={`row-${row.key}`}>
            <div className={s.container}>
              <hr className={s.hairline} style={{ marginBottom: 40 }} />
              <div className={s.rowHead}>
                <h2 id={`row-${row.key}`} className={s.h3}>
                  {row.title} <span className={`${s.small} ${s.muted} ${s.num}`}>({byCat(row.key).length})</span>
                </h2>
                <span className={`${s.small} ${s.muted}`}>Seitlich wischen oder scrollen</span>
              </div>
              <ul className={s.rail} style={{ listStyle: "none", margin: 0, padding: 0 }} tabIndex={0} aria-label={`${row.title} von Minotti`}>
                {items.map((card) => (
                  <li key={card.slug}>
                    <Card card={card} sizes="(min-width: 1200px) 23vw, (min-width: 768px) 34vw, 70vw" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className={`${s.section} ${s.dark}`} aria-labelledby="visit-title">
        <div className={`${s.container} ${s.cta}`}>
          <div className={s.ctaMedia}>
            <div className={`${s.frame} ${s.ratio45} ${s.mask}`}>
              <Image src="/cmx/files/minotti-lawrence-03.webp" alt="Minotti Lawrence: weißes Sofaelement neben einer Stehleuchte" fill sizes="(min-width: 1024px) 40vw, 100vw" className={s.cover} />
            </div>
          </div>
          <div className={s.ctaText}>
            <p className={s.overline}>Besuch</p>
            <h2 id="visit-title" className={s.h2}>
              Minotti <em>bei uns erleben.</em>
            </h2>
            <p className={s.body}>
              Sitzen Sie Probe, vergleichen Sie Leder und Stoffe und lassen Sie sich Maße und Kombinationen zeigen. Welche Stücke gerade in der
              Ausstellung stehen, sagen wir Ihnen gern vorab.
            </p>
            <div className={s.ctaActions}>
              <a href={SITE.termin} className={`${s.button} ${s.buttonLight}`}>
                Termin vereinbaren <Arrow />
              </a>
              <a href={STUDIO.phoneHref} className={s.link}>
                {STUDIO.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className={s.container} style={{ paddingBlock: 48 }}>
        <p className={s.note}>
          Platzhirsch zeigt und plant mit Möbeln von Minotti. Minotti und alle Produktnamen sind Marken der jeweiligen Inhaber. Bilder:
          Produktbilder aus dem Backoffice (Herstellermaterial) – Nutzungsrechte vor Livegang prüfen.
        </p>
      </div>
    </>
  );
}
