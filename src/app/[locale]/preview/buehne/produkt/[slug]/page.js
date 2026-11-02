import Link from "next/link";
import { notFound } from "next/navigation";
import { designPreviewEnabled } from "@/components/Preview/gate";
import { ArrowRight, ArrowUpRight, MapPin, Phone } from "lucide-react";
import s from "@/components/Preview/buehne/buehne.module.css";
import ProductCard from "@/components/Preview/buehne/ProductCard";
import Gallery from "@/components/Preview/buehne/Gallery";
import { BASE, CONTACT, NOINDEX } from "@/components/Preview/buehne/content";
import { categoryLabel, toPlainParagraphs } from "@/components/Preview/buehne/catalog";
import { fetchProduktNewByPathField, fetchRelatedProdukteNew } from "@/lib/api/fetchAllProdukte";
import { toShopProductDetail } from "@/lib/shop/shopProducts";
import { generateSlug } from "@/lib/slugify";

// The prototype shows Minotti products only (example: /produkt/sofas-lawrence).
async function loadMinotti(slug) {
  const detail = await fetchProduktNewByPathField(slug, "de");
  if (!detail || String(detail.marken || "").toLowerCase() !== "minotti") return null;
  return { detail, product: toShopProductDetail(detail, "de") };
}

const plain = (v) =>
  v
    ? String(v)
        .replace(/<br\s*\/?>/gi, ", ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
    : null;

export async function generateMetadata({ params }) {
  if (!designPreviewEnabled()) return { robots: { index: false, follow: false } }; // F5
  const { slug } = await params;
  const data = await loadMinotti(slug);
  return {
    title: data ? `${data.product.name} – Minotti | Prototyp Platzhirsch` : "Produkt | Prototyp Platzhirsch",
    robots: NOINDEX,
  };
}

export default async function ProduktPage({ params }) {
  const { locale, slug } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  const data = await loadMinotti(slug);
  if (!data) notFound();
  const { detail, product } = data;

  const related = await fetchRelatedProdukteNew({
    marken: detail.marken,
    kategories: detail.kategories,
    path_field: slug,
    limit: 4,
  });

  const paragraphs = toPlainParagraphs(product.descriptionParagraphs).slice(0, 4);
  const images = product.images.slice(0, 10);
  const specs = [
    ["Kategorie", categoryLabel(product.categoryKey)],
    ["Design", plain(product.designer)],
    ["Maße", plain(product.dimensionsRaw)],
    ["Material", plain(product.materialRaw)],
    ["Farbe", plain(product.colorRaw)],
  ].filter(([, v]) => v);

  const catalogUrl = `/de/produkte/${generateSlug(product.categoryKey)}/${slug}`;

  return (
    <>
      <div className={s.container}>
        <div className={s.pdp}>
          <div>
            <nav aria-label="Brotkrumen" className={`${s.breadcrumb} mb-6`}>
              <Link href={BASE}>Start</Link>
              <span aria-hidden="true">/</span>
              <Link href={`${BASE}/marken/minotti`}>Minotti</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{product.name}</span>
            </nav>
            <Gallery images={images} name={`Minotti ${product.name}`} />
          </div>

          <div className={s.pdpInfo}>
            <p className={s.overline}>
              Minotti · {categoryLabel(product.categoryKey)}
            </p>
            <h1 className={`${s.display} ${s.h1} mt-4`}>{product.name}</h1>
            {product.designer ? <p className={`${s.muted} mt-3`}>Design: {plain(product.designer)}</p> : null}

            {paragraphs.length ? (
              <div className={`${s.prose} mt-8`}>
                <p>{paragraphs[0]}</p>
                {paragraphs.length > 1 ? (
                  <details className={s.more}>
                    <summary>Mehr lesen</summary>
                    {paragraphs.slice(1).map((p, i) => (
                      <p key={i} className="mt-4">
                        {p}
                      </p>
                    ))}
                  </details>
                ) : null}
              </div>
            ) : null}

            {specs.length ? (
              <dl className={`${s.specs} mt-10`}>
                {specs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-10 grid gap-3">
              <Link href="/de/beratung" className={`${s.btn} justify-center`}>
                In Lochau ansehen – Termin anfragen <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a href={CONTACT.telHref} className={`${s.btnGhost} justify-center`}>
                <Phone aria-hidden="true" className="h-4 w-4" /> {CONTACT.tel}
              </a>
            </div>
            <p className={`${s.muted} mt-6 flex items-start gap-2 text-sm`}>
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#d1b250]" />
              Preis, Bezüge und Lieferzeit besprechen wir persönlich. Ob das Modell gerade ausgestellt ist, sagen wir
              Ihnen gern vorab.
            </p>
            <Link href={catalogUrl} className={`${s.link} mt-6`}>
              Zur aktuellen Katalogseite <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className={s.section} aria-labelledby="related-title">
          <div className={s.container}>
            <hr className={`${s.hairline} mb-16`} />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-title" className={`${s.display} ${s.h2}`}>
                Mehr von <span className={s.italic}>Minotti</span>
              </h2>
              <Link href={`${BASE}/marken/minotti`} className={s.link}>
                Zur Markenwelt <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className={s.productGrid}>
              {related.map((r) => (
                <ProductCard key={r.url_slug} product={{ slug: r.url_slug, name: r.name, image: r.image }} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="h-24" />
      )}
    </>
  );
}
