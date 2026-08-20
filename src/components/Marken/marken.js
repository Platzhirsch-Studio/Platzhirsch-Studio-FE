'use client'
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

const Marken = ({ marken }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  return (
    <section className=" mt-10 lg:mt-16 mb-10 lg:mb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeInView
        as="h2"
        direction="bottom"
        duration={500}
        distance={30}
        className="text-lg mb-4 text-[#d1b250] text-left uppercase"
      >
        Marken
      </FadeInView>

      <FadeInView
        as="h4"
        direction="bottom"
        duration={500}
        distance={30}
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      >
        Starke Marken
      </FadeInView>

      {[
        "Unser Portfolio umfasst eine exklusive Auswahl an renommierten Marken, die für zeitlose Eleganz, höchste Handwerkskunst und wegweisendes Design stehen.",
        "Jede Marke, die wir führen, erzählt ihre eigene Geschichte und bringt ihre einzigartige Handschrift in die Welt des Designs ein.",
        "Entdecken Sie bei uns die Vielfalt und Exklusivität von Marken, die international für ihren herausragenden Ruf bekannt sind.",
        "Wir sind stolz darauf, unseren Kunden Marken zu präsentieren, die höchsten Ansprüchen gerecht werden und die Essenz von Luxus und Innovation verkörpern.",
      ].map((paragraph, index) => (
        <FadeInView
          key={index}
          as="p"
          direction="bottom"
          duration={500}
          distance={20}
          delay={200 + (index * 100)}
          className="space-y-6 text-md text-[#30373e]/80"
        >
          {paragraph}
        </FadeInView>
      ))}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-14 lg:mt-20">
        {marken
          .filter((item) => item.status === "Aktiv")
          .map((item, index) => (
            <FadeInView
              key={index}
              as="div"
              direction="bottom"
              duration={500}
              distance={30}
              delay={index * 70}
            >
              <Link
                href={`/ueber-uns/marken/${generateSlug(item.title)}`}
                prefetch={true}
                locale={locale}
                className="group flex items-center w-auto h-[130px] justify-center border border-gray-800 bg-white p-6 transition duration-300 hover:shadow-lg slider1-hover-wrapper"
              >
                <div className="relative w-full h-full flex justify-center items-center aspect-square">
                  <Image
                    src={`/cms${item?.images}`}
                    alt={item.title || "Brand logo"}
                    width={100}
                    height={100}
                    className="object-contain filter-none h-auto duration-[20s] group-hover:[filter:brightness(0)_saturate(100%)_invert(83%)_sepia(65%)_saturate(707%)_hue-rotate(355deg)_brightness(85%)_contrast(90%)]"
                  />
                </div>
              </Link>
              <style jsx>
                {`
                  .slider1-hover-wrapper {
  cursor: pointer;
}

.slider1-hover-wrapper img {
  width: 100px;
  /* Remove filter transition to prevent flicker */
  transition: none;
}

/* Gold filter applied instantly on hover */
.slider1-hover-wrapper:hover img {
  filter: brightness(0) saturate(100%) invert(83%) sepia(65%) saturate(707%) hue-rotate(355deg) brightness(85%) contrast(90%);
}`}
              </style>
            </FadeInView>
          ))}
      </div>
    </section>
  );
};

export default Marken;