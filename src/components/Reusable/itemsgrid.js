import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ROUTES } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";

const AlternatingLayoutGrid = ({ data }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {data.map((item, index) => (
        <div
          key={index}
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center justify-between ${index % 2 === 0 ? "" : "md:grid-flow-dense"
            }`}
        >
          {/* Image - appears first on even indexes, second on odd indexes */}
          <div className={`relative h-[300px] md:h-[500px] flex  ${index % 2 === 0 ? "" : "md:col-start-2 "}`}>
            <Image
              src={`/cms${item.image}`}
              alt={item.title || "Content image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 50vw"
            />

          </div>

          {/* Content - appears second on even indexes, first on odd indexes */}
          <div className={`${index % 2 === 0 ? "" : "md:col-start-1 md:row-start-1"}`}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#30373e]/90">{item?.title}</h2>
            <p className="text-[#30373e]/80 mb-6 text-md">{item?.description}</p>
            <Link
              href={`${ROUTES.marken[locale]}/${generateSlug(item?.title)}`}
              prefetch={true}
              locale={locale}
              className="inline-block px-6 py-3 bg-[#d1b250]/90 text-white rounded-lg hover:bg-[#d1b250] transition-colors font-medium"
            >
              {item?.title}
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlternatingLayoutGrid;
