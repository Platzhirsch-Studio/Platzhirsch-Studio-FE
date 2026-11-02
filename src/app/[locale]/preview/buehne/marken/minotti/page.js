import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import s from "@/components/Preview/buehne/buehne.module.css";
import ProductCard from "@/components/Preview/buehne/ProductCard";
import { BASE, CONTACT, NOINDEX } from "@/components/Preview/buehne/content";
import { categoryLabel, toCard } from "@/components/Preview/buehne/catalog";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Minotti – Markenseite | Prototyp Platzhirsch",
  description: "Design-Prototyp „Bühne“: Markenwelt Minotti in der Ausstellung Lochau. Nicht öffentlich.",
  robots: NOINDEX,
});

// Chapters of the product edit: the categories that tell the Minotti story
// best (living first), each with a handful of real catalogue items.
const EDIT = [
  { key: "sofas-couches", title: "Sofas", count: 8 },
  { key: "armchairs-stools", title: "Sessel", count: 4 },
  { key: "coffee-tables", title: "Couchtische", count: 4 },
  { key: "dining-tables", title: "Essen", count: 4 },
];

// Shown first in the sofa chapter (the prototype's product example).
const FEATURED = ["sofas-lawrence", "sofas-andersen"];
const rank = (row) => {
  const i = FEATURED.indexOf(row.path_field);
  return i < 0 ? 0 : FEATURED.length - i;
};

export default async function MinottiPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  const rows = await fetchProdukteNewByMarke("Minotti");
  const total = rows.length;

  const counts = {};
  for (const r of rows) counts[r.kategories] = (counts[r.kategories] || 0) + 1;
  const categories = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // Prefer products with a full gallery (richer pages) in the edit.
  // Variants of one model ("Coupé (Tables)", "Coupé (Tables 2)") show once.
  const byCategory = (key, n) => {
    const seen = new Set();
    return rows
      .filter((r) => r.kategories === key && Array.isArray(r.bild_anhangen) && r.bild_anhangen.length)
      .sort((a, b) => rank(b) - rank(a) || (b.bild_anhangen?.length || 0) - (a.bild_anhangen?.length || 0))
      .map(toCard)
      .filter((c) => (seen.has(c.name) ? false : seen.add(c.name)))
      .slice(0, n);
  };

  const edit = EDIT.map((c) => ({ ...c, items: byCategory(c.key, c.count) })).filter((c) => c.items.length);

  return (
    <>
      <section className={s.hero} aria-labelledby="minotti-title">
        <div className={`${s.heroMedia} ${s.heroParallax}`}>
          <Image
            src="/Images/Home/orionMinoti.jpg"
            alt="Minotti-Wohnlandschaft mit niedrigem Sofa vor Holzlamellen in warmem Abendlicht"
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className={s.kenBurns}
          />
        </div>
        <div className={s.heroShade} aria-hidden="true" />
        <div className={`${s.container} ${s.heroContent} ${s.heroFade}`}>
          <nav aria-label="Brotkrumen" className={`${s.breadcrumb} ${s.rise}`}>
            <Link href={BASE}>Start</Link>
            <span aria-hidden="true">/</span>
            <Link href={`${BASE}#marken-title`}>Marken</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Minotti</span>
          </nav>
          <h1 id="minotti-title" className={`${s.display} ${s.mega} ${s.rise2} mt-6`}>
            Minotti
          </h1>
          <div className={`${s.heroMeta} ${s.rise3}`}>
            <p className={s.lead}>Minotti-Ausstellung in Lochau – Sofas, Sessel und Tische zum Probesitzen am Bodensee.</p>
            <Link href={`${BASE}#termin`} className={s.btn}>
              Minotti bei uns erleben <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="minotti-intro">
        <div className={`${s.container} ${s.split}`}>
          <div>
            <p className={s.overline}>Die Marke</p>
            <h2 id="minotti-intro" className={`${s.display} ${s.h2} mt-5`}>
              Seit 1948 aus der Brianza.
              <br />
              <span className={s.italic}>Gemacht zum Bleiben.</span>
            </h2>
            <p className={`${s.lead} mt-8`}>
              Minotti ist ein Familienunternehmen aus Meda bei Mailand. Die Sofas und Sessel sind niedrig, großzügig
              und ruhig gezeichnet – eine Wohnarchitektur, die mit dem Raum arbeitet, nicht gegen ihn.
            </p>
            <p className={`${s.lead} mt-5`}>
              In unserer Ausstellung führen wir eine Auswahl der Kollektion. Stoff- und Lederauswahl besprechen wir mit
              Ihnen vor Ort; welche Modelle gerade ausgestellt sind, sagen wir Ihnen gern vorab.
            </p>
            {total > 0 ? (
              <dl className={s.facts}>
                <div>
                  <dt>Im Online-Katalog</dt>
                  <dd>{total} Produkte</dd>
                </div>
                <div>
                  <dt>Kategorien</dt>
                  <dd>{categories.length}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <div className={`${s.frame} ${s.mask} mx-auto aspect-469/595 w-full max-w-md`}>
            <Image
              src="/Images/Vernissage/minotti-wohnwelt.jpg"
              alt="Helles Minotti-Sofa mit rundem Polsterhocker und Stehleuchte"
              fill
              sizes="(min-width: 64rem) 28rem, 90vw"
            />
          </div>
        </div>
      </section>

      {categories.length ? (
        <section className={`${s.container} pb-8`} aria-label="Minotti-Kategorien im Katalog">
          <ul className={s.chips}>
            {categories.map(([key, n]) => (
              <li key={key} className={s.chip}>
                {categoryLabel(key)} <span className={s.gold}>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {edit.length ? (
        edit.map((chapter, i) => (
          <section key={chapter.key} className={`${s.section} ${i ? s.flushTop : ""}`} aria-labelledby={`edit-${chapter.key}`}>
            <div className={s.container}>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <h2 id={`edit-${chapter.key}`} className={`${s.display} ${s.h2}`}>
                  <span className={`${s.chapterNum} mr-4 align-middle`}>0{i + 1}</span>
                  {chapter.title}
                </h2>
                <Link href={`/de/produkte/${chapter.key}`} className={s.link}>
                  Alle {categoryLabel(chapter.key)} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <div className={s.productGrid}>
                {chapter.items.map((p) => (
                  <ProductCard key={p.slug} product={p} label={categoryLabel(p.category)} />
                ))}
              </div>
            </div>
          </section>
        ))
      ) : (
        <section className={s.section}>
          <div className={s.container}>
            <p className={s.lead}>Der Produktkatalog ist gerade nicht erreichbar. Bitte später erneut versuchen.</p>
          </div>
        </section>
      )}

      <section className={`${s.section} ${s.cta}`} aria-labelledby="minotti-cta">
        <div className={`${s.ctaMedia} ${s.parallax}`}>
          <Image src="/Images/Home/secondAboutHome.jpg" alt="" fill sizes="100vw" quality={60} />
        </div>
        <div className={s.container}>
          <p className={s.overline}>Probesitzen in Lochau</p>
          <h2 id="minotti-cta" className={`${s.display} ${s.h1} mx-auto mt-6 max-w-4xl`}>
            Ein Sofa wählt man <span className={s.italic}>im Sitzen.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/de/beratung" className={s.btn}>
              Termin anfragen <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href={CONTACT.telHref} className={s.btnGhost}>
              {CONTACT.tel}
            </a>
          </div>
          <Link href="/de/ueber-uns/marken/minotti" className={`${s.link} mt-10`}>
            Aktuelle Minotti-Seite <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
