import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Server-renderable category directory for the /produkte hub page, grouped
// into sections (see produkte/page.js). Every category is an image tile
// linking to its /produkte/[category] catalog page.
const ShopCategoryGrid = ({ sections, locale, basePath }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      {/* Jump links to each section — scrolls sideways on narrow screens. */}
      {sections.length > 1 && (
        <nav className="-mx-4 mb-12 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-2 sm:flex-wrap">
            {sections.map((section) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="block whitespace-nowrap rounded-full border border-[#30373e]/15 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-[#30373e] transition-colors hover:border-[#d1b250] hover:text-[#d1b250]"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="space-y-16 lg:space-y-20">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-60">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[#30373e]/10 pb-4">
              <div>
                <h2 className="font-display text-3xl text-ink md:text-4xl">{section.title}</h2>
                <div className="mt-3 h-[2px] w-12 bg-[#d1b250]" />
              </div>
              <p className="shrink-0 text-sm text-[#30373e]/70">{section.countLabel}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {section.tiles.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`${basePath}/${cat.slug}`}
                  locale={locale}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 shadow-[0_1px_3px_rgba(48,55,62,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1b250]"
                >
                  <Image
                    src={cat.image || "/Images/fallback-banner.jpg"}
                    alt={cat.alt || cat.label}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 400px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                        {cat.countLabel}
                      </span>
                      <p className="text-xl font-light text-white">{cat.label}</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 group-hover:border-[#d1b250] group-hover:bg-[#d1b250] group-hover:text-[#30373e]">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ShopCategoryGrid;
