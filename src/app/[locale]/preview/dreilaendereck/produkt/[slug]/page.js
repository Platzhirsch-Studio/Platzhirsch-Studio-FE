// Prototyp "Dreiländereck" – Produktseite "Atelier" (Beispiel: Minotti
// Lawrence, /de/preview/dreilaendereck/produkt/sofas-lawrence). Daten live aus
// dem Backoffice über fetchProduktNewByPathField; nur Minotti-Produkte.
// Preis, Ausstellungsstatus und Lieferzeit sind (noch) keine Backoffice-
// Felder – der Prototyp zeigt dafür ehrliche Anfrage-Hinweise.
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { designPreviewEnabled } from "@/components/Preview/gate";
import { ArrowRight, Heart, MessageCircle, Phone } from "lucide-react";
import s from "@/components/Preview/dreilaendereck/dl.module.css";
import Gallery from "@/components/Preview/dreilaendereck/Gallery";
import { loadMinottiProduct } from "@/components/Preview/dreilaendereck/data";
import { BASE, COUNTRIES, HOUSE, LINKS } from "@/components/Preview/dreilaendereck/content";

export async function generateMetadata({ params }) {
  if (!designPreviewEnabled()) return { robots: { index: false, follow: false } }; // F5
  const { slug } = await params;
  const product = await loadMinottiProduct(slug);
  return {
    title: product ? `Minotti ${product.name} – Prototyp Dreiländereck` : "Produkt – Prototyp Dreiländereck",
    description: product?.metaDescription || "Produktseite im Design-Prototyp Dreiländereck. Nicht öffentlich.",
    robots: { index: false, follow: false },
  };
}

export default async function PreviewProductPage({ params }) {
  const { locale, slug } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404
  const product = await loadMinottiProduct(slug);
  if (!product) notFound();

  const images = product.images.slice(0, 12);
  const [intro, ...more] = product.descriptionParagraphs;

  return (
    <>
      <nav aria-label="Brotkrumen" className={`${s.container} ${s.crumbs}`}>
        <ol>
          <li>
            <Link href={BASE}>Start</Link>
          </li>
          <li>
            <Link href={`${BASE}/marken/minotti`}>Minotti</Link>
          </li>
          <li>{product.categoryLabel}</li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <section className={s.container} aria-labelledby="dl-product-title">
        <div className={s.pdp}>
          <Gallery images={images} name={`Minotti ${product.name}`} />

          <aside className={s.pdpAside} aria-label="Produktinformationen">
            <p className={s.overline} style={{ marginBottom: 0 }}>
              <Link href={`${BASE}/marken/minotti`} className={s.textLink}>
                {product.brand}
              </Link>{" "}
              · {product.categoryLabel}
            </p>
            <h1 id="dl-product-title" className={s.h1}>
              {product.name}
            </h1>
            {product.designer && <p className={s.small}>Design {product.designer}</p>}

            <dl className={s.pdpRows}>
              <div>
                <dt>Preis</dt>
                <dd>auf Anfrage, je nach Elementen und Bezug</dd>
              </div>
              <div>
                <dt>In Lochau</dt>
                <dd>Ausstellung bitte vorab anfragen</dd>
              </div>
              <div>
                <dt>Lieferung</dt>
                <dd>AT · DE · CH · FL nach Absprache</dd>
              </div>
              {product.dimensionsRaw && (
                <div>
                  <dt>Maße</dt>
                  <dd className={s.num}>{product.dimensionsRaw}</dd>
                </div>
              )}
            </dl>

            <div className={s.pdpActions}>
              <Link href={LINKS.termin} className={s.btn}>
                Beratung zu {product.name} <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
              </Link>
              <Link href={product.liveHref} className={s.btnGhost}>
                <Heart size={18} aria-hidden="true" /> Auf die Merkliste (heutige Website)
              </Link>
            </div>

            <div className={s.advisor}>
              <span className={s.advisorIcon} aria-hidden="true">
                <MessageCircle size={24} />
              </span>
              <div>
                <p>
                  <strong>Fragen zu Bezügen und Maßen?</strong>
                </p>
                <p className={s.small}>
                  Wir zeigen Ihnen Leder- und Stoffmuster und planen die Elemente für Ihren Raum. Foto und Name der
                  Ansprechperson folgen.
                </p>
                <a href={HOUSE.phoneHref} className={s.textLink}>
                  <Phone size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> {HOUSE.phone}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={s.section} aria-label="Details">
        <div className={`${s.container} ${s.pdpSections}`}>
          {intro && (
            <section aria-labelledby="dl-p-desc">
              <h2 id="dl-p-desc" className={s.h3}>
                Beschreibung
              </h2>
              <div className={s.prose} dangerouslySetInnerHTML={{ __html: intro }} />
            </section>
          )}
          {more.length > 0 && (
            <section aria-labelledby="dl-p-more">
              <h2 id="dl-p-more" className={s.h3}>
                Ausführungen &amp; Details
              </h2>
              <div className={s.prose}>
                {more.map((html, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="dl-p-delivery">
            <h2 id="dl-p-delivery" className={s.h3}>
              Lieferung in vier Länder
            </h2>
            <ul className={s.factList} style={{ marginTop: 0 }}>
              {COUNTRIES.map((c) => (
                <li key={c.code} style={{ display: "grid", gridTemplateColumns: "48px 1fr" }}>
                  <span className={s.countryCode}>{c.code}</span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="dl-p-source">
            <h2 id="dl-p-source" className={s.h3}>
              Hinweis
            </h2>
            <p className={s.small} style={{ margin: 0 }}>
              Produktdaten und Bilder aus unserem Katalog (Herstellerangaben). Ausführungen und Maße können sich ändern –
              wir prüfen sie für Ihr Angebot. Platzhirsch Home Living zeigt und plant mit Möbeln von Minotti.
            </p>
          </section>
        </div>
      </section>

      {product.related.length > 0 && (
        <section className={`${s.section} ${s.bgLinen}`} aria-labelledby="dl-related">
          <div className={s.container}>
            <h2 id="dl-related" className={s.h2} style={{ marginBottom: 40 }}>
              Mehr von Minotti
            </h2>
            <div className={s.productGrid}>
              {product.related.map((p) => (
                <Link key={p.url_slug} href={`${BASE}/produkt/${p.url_slug}`} className={`${s.productCard} ${s.reveal}`}>
                  <div className={`${s.media} ${s.r43}`}>
                    <Image src={p.image} alt={`Minotti ${p.name}`} fill sizes="(min-width: 900px) 23vw, 50vw" loading="lazy" />
                  </div>
                  <h3>{p.name}</h3>
                  <p>Preis auf Anfrage</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
