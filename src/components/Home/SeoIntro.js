import { getTranslations } from "next-intl/server";
import { homeSeo } from "@/lib/content/homeSeo";

// Editorial text block + FAQ for the homepage (content in src/lib/content/
// homeSeo.js, per language). Native <details> for the FAQ: works without
// JavaScript and is read by crawlers; the same items are emitted as FAQPage
// JSON-LD by the page.
export default async function SeoIntro({ locale }) {
  const content = homeSeo(locale);
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <section className="w-full bg-bone" aria-labelledby="home-seo-title">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="reveal lg:col-span-7">
          <h2 id="home-seo-title" className="font-display text-3xl leading-tight text-ink md:text-4xl">
            {content.title}
          </h2>
          <div className="mt-6 max-w-[62ch] space-y-5 text-[17px] leading-[1.7] text-ink/80">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="reveal lg:col-span-5">
          <h3 className="font-display text-2xl text-ink">{t("faqTitle")}</h3>
          <div className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
            {content.faq.map((item, index) => (
              <details key={item.q} name="home-faq" className="group py-4" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    className="font-display mt-[-2px] shrink-0 text-2xl leading-none text-gold-text transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
