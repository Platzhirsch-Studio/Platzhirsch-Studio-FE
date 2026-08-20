"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import Slider from "react-slick";
import light from "../../../public/Images/Licht/light.png";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

// Slider images
const images = [
  { src: "/Images/Home/tuuci.png", title: "tuuci" },
  { src: "/Images/Home/heritage.png", title: "heritage" },
  { src: "/Images/Home/umbrosa.png", title: "umbrosa" },
  { src: "/Images/Home/coppenhagen.png", title: "101-copenhagen" },
  { src: "/Images/Home/treca.png", title: "treca" },
  { src: "/Images/Home/trapa.png", title: "trapa" },
];

const OutdoorLivingSection = ({ second }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("Outdoor");
  if (!second) return null; // Protection against hydration mismatch

  const secondSettings = {
    dots: true,
    infinite: true,
    speed: 1200,
    cssEase: "ease-in-out",
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 400, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="relative mt-10 lg:mt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeInView
        as="div"
        direction="left"
        duration={600}
        distance={30}
        className="absolute -left-70 top-0 z-0 hidden lg:block"
      >
        <Image
          src={light}
          fill
          sizes="200px"
          alt="Lamp"
        />
      </FadeInView>

      {/* Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <FadeInView
          as="div"
          direction="none"
          duration={900}
          className="order-1 lg:order-2 relative h-80 sm:h-96 md:h-[500px] lg:h-[650px] overflow-hidden rounded-lg"
        >
          <Image
            src={second.image}
            alt="Luxury outdoor living space"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </FadeInView>

        {/* Text & Slider */}
        <FadeInView
          as="div"
          direction="bottom"
          duration={500}
          distance={20}
          className="order-2 lg:order-1"
        >
          <FadeInView
            as="h2"
            direction="bottom"
            duration={700}
            distance={30}
            delay={200}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#30373e] mb-4"
          >
            {t("title")}
            <span className="text-[#d1b250]"> {t("secondTitle")}</span>
          </FadeInView>

          <FadeInView
            as="div"
            direction="bottom"
            duration={700}
            distance={30}
            delay={350}
            className="space-y-6 text-md text-[#30373e]/80"
          >
            {[t("desc1"), t("desc2"), t("desc3")].map((line, index) => (
              <p key={index} className="mb-4">{line}</p>
            ))}
          </FadeInView>

          {/* Slider */}
          <FadeInView
            as="div"
            direction="bottom"
            duration={500}
            distance={20}
            delay={500}
            className="max-w-full mx-auto overflow-hidden mt-8"
          >
            <Slider {...secondSettings}>
              {images.map((item) => (
                <div key={item.title} className="px-2">
                  <Link href={`/ueber-uns/marken/${generateSlug(item?.title)}`} locale={locale}>
                    <div className="slider1-hover-wrapper relative h-[40px] w-full">
                      <Image
                        src={item.src}
                        alt={item.title || "Outdoor brand"}
                        fill
                        className="object-contain transition-all duration-500"
                        sizes="100px"
                      />
                    </div>
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
                  </Link>
                </div>
              ))}
            </Slider>
          </FadeInView>
        </FadeInView>
      </div>
    </section>
  );
};

export default OutdoorLivingSection;
