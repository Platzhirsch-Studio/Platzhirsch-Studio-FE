import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { designPreviewEnabled } from "@/components/Preview/gate";
import { fetchProduktNewByPathField } from "@/lib/api/fetchAllProdukte";
import { toShopProductDetail } from "@/lib/shop/shopProducts";
import { productsPath } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import { BASE, SITE, STUDIO } from "@/components/Preview/galerie/content";
import { categoryLabel, loadMinotti, toCard } from "@/components/Preview/galerie/catalog";
import s from "@/components/Preview/galerie/galerie.module.css";

// Prototype product page – any active Minotti product from the backoffice
// (reference example: /de/preview/galerie/produkt/sofas-lawrence).
async function loadProduct(slug) {
  const detail = await fetchProduktNewByPathField(slug, "de");
  if (!detail || detail.status !== "Aktiv" || detail.marken !== "Minotti") return null;
  return { detail, product: toShopProductDetail(detail, "de") };
}

export async function generateMetadata({ params }) {
  if (!designPreviewEnabled()) return { robots: { index: false, follow: false } }; // F5
  const { slug } = await params;
  const data = await loadProduct(slug);
  return {
    title: data ? `${data.product.name} von Minotti – Prototyp Produktseite | Platzhirsch Home Living` : "Prototyp Produktseite",
    description: "Design-Prototyp „Galerie“: Produktseite. Nicht indexiert.",
    robots: { index: false, follow: false },
  };
}

const Arrow = () => (
  <span className={s.arrow} aria-hidden="true">
    →
  </span>
);

const toText = (html) =>
  (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export default async function GalerieProduct({ params }) {
  const { locale, slug } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  const [data, { products }] = await Promise.all([loadProduct(slug), loadMinotti()]);
  if (!data) notFound();
  const { detail, product } = data;

  const images = product.images.slice(0, 7);
  const [lead, ...rest] = images;
  const pairs = [];
  for (let i = 0; i < rest.length; i += 2) pairs.push(rest.slice(i, i + 2));

  const paragraphs = product.descriptionParagraphs.map(toText).filter(Boolean);
  const intro = paragraphs[0];
  const more = paragraphs.slice(1, 6);
  const category = categoryLabel(product.categoryKey);
  const related = products
    .filter((p) => p.kategories === detail.kategories && p.path_field !== detail.path_field)
    .slice(0, 8)
    .map(toCard);
  const liveUrl = `/de${productsPath("de", generateSlug(product.categoryKey), detail.path_field)}`;

  const specs = [
    ["Marke", "Minotti"],
    ["Kategorie", category],
    product.designer && ["Design", product.designer],
    product.dimensionsRaw && ["Maße", product.dimensionsRaw],
    product.materialRaw && ["Material", product.materialRaw],
    product.colorRaw && ["Farbe", product.colorRaw],
    ["Preis", "auf Anfrage – abhängig von Maß, Bezug und Ausführung"],
  ].filter(Boolean);

  const alt = (i) => `Minotti ${product.name}, Ansicht ${i + 1}`;

  return (
    <>
      <div className={s.container}>
        <nav aria-label="Brotkrumen">
          <ol className={s.crumbs}>
            <li>
              <Link href={BASE}>Start</Link>
            </li>
            <li>
              <Link href={`${BASE}/marken/minotti`}>Minotti</Link>
            </li>
            <li>{category}</li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </div>

      <section className={s.container} aria-labelledby="product-title">
        <div className={s.product}>
          <div className={s.gallery}>
            {lead && (
              <div className={`${s.frame} ${s.ratio45}`}>
                <Image src={lead} alt={alt(0)} fill preload fetchPriority="high" sizes="(min-width: 1024px) 56vw, 100vw" className={s.cover} />
              </div>
            )}
            {pairs.map((pair, pi) => (
              <div key={pi} className={pair.length === 2 ? s.galleryPair : undefined}>
                {pair.map((src, i) => (
                  <div key={src} className={`${s.frame} ${pair.length === 2 ? s.ratio34 : s.ratio32} ${s.mask}`}>
                    <Image src={src} alt={alt(1 + pi * 2 + i)} fill sizes={pair.length === 2 ? "(min-width: 1024px) 28vw, 50vw" : "(min-width: 1024px) 56vw, 100vw"} className={s.cover} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className={s.info}>
            <Link href={`${BASE}/marken/minotti`} className={s.overline} style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
              Minotti
            </Link>
            <h1 id="product-title" className={s.h1}>
              {product.name}
            </h1>
            <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>
              {category}
              {product.designer ? ` · Design ${product.designer}` : ""}
            </p>
            {intro && <p className={s.body}>{intro}</p>}

            <div className={s.infoBlock}>
              <p className={s.overline}>Preis</p>
              <p className={s.h3} style={{ margin: 0 }}>
                Auf Anfrage
              </p>
              <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>
                Wir erstellen Ihnen ein Angebot für Ihre Zusammenstellung aus Maß, Bezug und Ausführung.
              </p>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <a href={`${SITE.termin}?produkt=${encodeURIComponent(product.name)}`} className={s.button} style={{ justifyContent: "space-between" }}>
                Beratung zu diesem Stück <Arrow />
              </a>
              <a href={STUDIO.phoneHref} className={`${s.button} ${s.buttonGhost}`} style={{ justifyContent: "space-between" }}>
                Anrufen <span className={s.num}>{STUDIO.phone}</span>
              </a>
            </div>

            <div className={s.advisor}>
              <p className={s.overline}>Im Showroom</p>
              <p className={`${s.small}`} style={{ margin: 0 }}>
                Ob {product.name} gerade in unserer Ausstellung in Lochau steht, sagen wir Ihnen gern vor Ihrem Besuch. Bezüge und Muster liegen
                zum Anfassen bereit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="details-title">
        <div className={`${s.container} ${s.descriptionWrap}`}>
          <div style={{ display: "grid", gap: 16, alignContent: "start", marginBottom: 32 }}>
            <p className={s.overline}>Details</p>
            <h2 id="details-title" className={s.h3}>
              Über {product.name}
            </h2>
          </div>
          <div style={{ display: "grid", gap: 48 }}>
            {more.length > 0 && (
              <div>
                {more.map((p) => (
                  <p key={p.slice(0, 32)} className={s.body}>
                    {p}
                  </p>
                ))}
              </div>
            )}
            <dl className={s.specs}>
              {specs.map(([dt, dd]) => (
                <div key={dt}>
                  <dt>{dt}</dt>
                  <dd>{dd}</dd>
                </div>
              ))}
            </dl>
            <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>
              Diese Seite ist ein Prototyp.{" "}
              <a href={liveUrl} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                {product.name} im aktuellen Katalog
              </a>
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className={`${s.sectionTight} ${s.stone}`} aria-labelledby="related-title">
          <div className={s.container}>
            <div className={s.rowHead}>
              <h2 id="related-title" className={s.h3}>
                Weitere {category} von Minotti
              </h2>
              <Link href={`${BASE}/marken/minotti#kollektion`} className={s.link}>
                Zur Markenwelt <Arrow />
              </Link>
            </div>
            <ul className={s.rail} style={{ listStyle: "none", margin: 0, padding: 0 }} tabIndex={0} aria-label={`Weitere ${category} von Minotti`}>
              {related.map((card) => (
                <li key={card.slug}>
                  <Link href={card.href} className={s.card}>
                    <div className={`${s.frame} ${s.ratio45}`}>
                      <Image src={card.image} alt={card.alt} fill sizes="(min-width: 1200px) 23vw, (min-width: 768px) 34vw, 70vw" className={s.cover} />
                    </div>
                    <h3 className={s.cardTitle}>{card.name}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
