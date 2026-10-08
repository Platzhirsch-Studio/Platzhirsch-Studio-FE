import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF } from "@/lib/site";
// Shared layout for the local landing pages (/de/kuechen-vorarlberg,
// /de/wohnzimmer-einrichten-vorarlberg, …). Each page only supplies its
// `content` (texts, photos, brands, FAQ); the design lives here once.
// German only for now; static copy until it moves into a CMS doctype.
import Image from "next/image";
import { ArrowRight, Check, Clock, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import JsonLd from "@/components/Reusable/JsonLd";
import { ROUTES } from "@/utils/routing";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { breadcrumbList, graph, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";

const eyebrowClass = "text-sm font-semibold uppercase tracking-[0.12em] text-gold-text";
const headingClass = "mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[#30373e]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[3px] bg-[#d1b250] px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#bfa047]";
const outlineButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[3px] border-2 border-[#d1b250] px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#d1b250]";

// Metadata for a landing page. German-only pages (no hreflang: the other
// locales 404 on purpose). Indexable by default — these pages target the
// local queries the site needs most (Küchen Vorarlberg, Designermöbel Bregenz,
// Möbel Bodensee, …); pass `index: false` to pull one out again.
export function landingMetadata({ path, title, description, index = true }) {
  const url = `${SITE_URL}/de${path}`;
  return {
    title: `${title} | Platzhirsch Home Living`,
    description,
    robots: { index, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "Platzhirsch Home Living", locale: "de_AT" },
  };
}

// WebPage + BreadcrumbList + FAQPage for one landing page. German; de-AT unless
// the page targets German or Swiss visitors (`content.inLanguage`).
function landingSchema(content, path) {
  const url = `${SITE_URL}/de${path}`;
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: content.banner.title,
      inLanguage: content.inLanguage || "de-AT",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: `${SITE_URL}${content.banner.image}`,
      breadcrumb: breadcrumbList([{ name: "Home", url: `${SITE_URL}/de` }, { name: content.banner.crumb }], `${url}#breadcrumb`),
    },
    content.faq?.items?.length
      ? {
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: content.faq.items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null
  );
}

export default function LandingPage({ content, path }) {
  const { banner, intro, brands, steps, gallery, showroom, cta, faq } = content;
  const beratungHref = ROUTES.beratung.de;
  const kontaktHref = ROUTES.kontakt.de;

  const bannerInfo = {
    image: banner.image,
    title: banner.title,
    alt: banner.alt,
    links: [
      { linkName: "Home", link: "/" },
      { linkName: banner.crumb, link: null },
    ],
  };

  return (
    <div>
      {path && <JsonLd data={landingSchema(content, path)} />}
      <SinglePageBanner info={bannerInfo} />

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className={eyebrowClass}>{intro.eyebrow}</p>
            <h2 className={headingClass}>{intro.heading}</h2>
            <div className="mt-6 space-y-4 text-[#30373e]/75 leading-relaxed">
              {intro.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="mt-8 space-y-3">
              {intro.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[#30373e]">
                  <Check size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#d1b250]" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href={beratungHref} locale="de" className={primaryButtonClass}>
                Beratungstermin vereinbaren
                <ArrowRight size={16} />
              </Link>
              <a href={PHONE_HREF} className={outlineButtonClass}>
                <Phone size={16} />{PHONE_DISPLAY}</a>
            </div>
          </div>

          <div className="relative h-[380px] sm:h-[480px] lg:h-[620px] w-full overflow-hidden rounded-lg">
            <Image
              src={intro.image}
              alt={intro.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Brands — solid light background (not a fade to white) so this section
          ends with a clear edge before the white process section below. */}
      <section className="w-full bg-[#f5f5f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-14 md:pb-16">
          <div className="max-w-2xl">
            <p className={eyebrowClass}>{brands.eyebrow}</p>
            <h2 className={headingClass}>{brands.heading}</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {brands.items.map((brand) => (
              <div
                key={brand.slug}
                className="group overflow-hidden rounded-lg border border-[#30373e]/10 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
              >
                <div className="relative h-[340px] md:h-[460px] w-full overflow-hidden bg-gray-100">
                  <Image
                    src={brand.image}
                    alt={brand.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#30373e]">{brand.name}</h3>
                  <p className="mt-3 text-[#30373e]/70 leading-relaxed">{brand.text}</p>
                  <Link
                    href={`${ROUTES.marken.de}/${brand.slug}`}
                    locale="de"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gold-text hover:underline"
                  >
                    Mehr über {brand.name}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href={brands.cta.href} locale="de" className={outlineButtonClass}>
              {brands.cta.label}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Process — white, like the intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-2xl">
          <p className={eyebrowClass}>{steps.eyebrow}</p>
          <h2 className={headingClass}>{steps.heading}</h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.items.map((step, index) => (
            <li key={step.title} className="relative border-t-2 border-[#d1b250] pt-6">
              <span className="text-4xl font-light text-[#d1b250]/70 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-[#30373e]">{step.title}</h3>
              <p className="mt-2 text-[#30373e]/70 leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Gallery — one large photo + two stacked */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:h-[640px]">
          <div className="relative md:col-span-2 h-[380px] md:h-full overflow-hidden rounded-lg">
            <Image
              src={gallery[0].src}
              alt={gallery[0].alt}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 md:grid-rows-2 gap-4 md:gap-6 md:h-full">
            {gallery.slice(1, 3).map((image) => (
              <div key={image.src} className="relative h-[260px] md:h-full overflow-hidden rounded-lg">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom */}
      <section className="w-full bg-[#30373e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className={eyebrowClass}>Showroom Lochau</p>
            <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold">{showroom.heading}</h2>
            <p className="mt-6 text-white/75 leading-relaxed">{showroom.text}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <MapPin size={22} className="text-[#d1b250]" />
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide">Adresse</p>
              <p className="mt-2 text-white/75 text-sm leading-relaxed">
                Landstraße 9
                <br />
                6911 Lochau
              </p>
            </div>
            <div>
              <Clock size={22} className="text-[#d1b250]" />
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide">Öffnungszeiten</p>
              <p className="mt-2 text-white/75 text-sm leading-relaxed">
                Di–Fr 10:00–18:00
                <br />
                Sa 10:00–14:00
              </p>
            </div>
            <div>
              <Phone size={22} className="text-[#d1b250]" />
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide">Kontakt</p>
              <p className="mt-2 text-white/75 text-sm leading-relaxed">
                <a href={PHONE_HREF} className="hover:text-[#d1b250]">{PHONE_DISPLAY}</a>
                <br />
                <a href={EMAIL_HREF} className="break-all hover:text-[#d1b250]">{EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24">
        <div className="relative overflow-hidden rounded-lg">
          <Image src={cta.image} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#30373e]/80" />
          <div className="relative px-6 py-20 md:py-32 text-center text-white">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{cta.heading}</h2>
            <p className="mt-4 max-w-xl mx-auto text-white/80">{cta.text}</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link href={beratungHref} locale="de" className={primaryButtonClass}>
                Beratungstermin vereinbaren
                <ArrowRight size={16} />
              </Link>
              <Link
                href={kontaktHref}
                locale="de"
                className="inline-flex items-center justify-center gap-2 rounded-[3px] border-2 border-white px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-colors duration-300 hover:bg-white hover:text-[#30373e]"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — last section; native <details>, works without JavaScript */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center">
          <p className={eyebrowClass}>Häufige Fragen</p>
          <h2 className={headingClass}>{faq.heading}</h2>
          <p className="mt-4 text-[#30373e]/70">
            Ihre Frage ist nicht dabei? Rufen Sie uns an unter{" "}
            <a href={PHONE_HREF} className="font-medium text-[#30373e] hover:text-[#d1b250]">{PHONE_DISPLAY}</a>
            .
          </p>
        </div>
        <div className="mt-10 divide-y divide-[#30373e]/10 border-y border-[#30373e]/10">
          {faq.items.map((item, index) => (
            // Shared `name` = exclusive accordion: opening one closes the others
            // (native browser behaviour, no JavaScript needed).
            <details key={item.q} name={faq.name} className="group py-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-[#30373e] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="shrink-0 text-2xl font-light text-[#d1b250] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[#30373e]/70 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
