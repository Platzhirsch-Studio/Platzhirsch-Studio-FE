"use client";
import Image from "next/image";
import image1 from "../../../public/Images/Home/aboutHome.jpg";
import image2 from "../../../public/Images/Home/secondAboutHome.jpg";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ROUTES } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";


const About = ({ data }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const secondSettings = {
    dots: false,
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
      { breakpoint: 460, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="py-0 mt-7 lg:mt-16 mb-16 max-w-7xl mx-auto">
      <div className="flex flex-col-reverse md:flex-row gap-0  sm:flex-col-reverse">
        <FadeInView
          direction="bottom"
          duration={500}
          distance={20}
          className="md:flex-col sm:flex-col-reverse w-full md:w-1/2 p-4 rounded-lg flex flex-col-reverse justify-center items-center"
        >
          <div className="relative h-100 lg:h-150 w-full">
            <Image
              src={image1}
              alt={data?.[`alt_text_left_${locale}`] || "About section image"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="w-full mb-10 md:mt-10">
            <div className="w-full max-w-4xl mx-auto text-center">
              <FadeInView
                as="h1"
                direction="bottom"
                duration={600}
                distance={30}
                delay={200}
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-5 text-[#30373e]"
              >
                {data?.[`subtitle_${locale}`]}
              </FadeInView>
              <FadeInView
                as="p"
                direction="bottom"
                duration={600}
                distance={30}
                delay={300}
                className="text-center text-ms text-[#30373e]/80"
              >
                {data?.[`description_${locale}`]}
              </FadeInView>
            </div>
          </div>
        </FadeInView>

        <FadeInView
          as="div"
          direction="right"
          duration={800}
          distance={50}
          className="w-full md:w-1/2 p-4 flex flex-col justify-center items-center"
        >
          <FadeInView
            as="h2"
            direction="bottom"
            duration={600}
            distance={30}
            delay={100}
            className="text-lg lg:mt-12 sm:mt-0 text-[#30373e] text-center uppercase"
          >
            {data?.[`title_${locale}`]}
          </FadeInView>
          <FadeInView
            as="h3"
            direction="bottom"
            duration={600}
            distance={30}
            delay={200}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#30373e] text-center mt-4 mb-4"
          >
            {data?.[`subtitle_right_${locale}`]}
          </FadeInView>
          <FadeInView
            as="p"
            direction="bottom"
            duration={600}
            distance={30}
            delay={300}
            className="text-center text-ms text-[#30373e]/80 mb-12"
          >
            {data?.[`description_right_${locale}`]}
          </FadeInView>

          <div className="relative h-100 lg:h-150 w-full">
            <Image
              src={image2}
              alt={data?.[`alt_text_right_${locale}`] || "About section image"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </FadeInView>
      </div>

      <div className=" max-w-full mx-auto overflow-hidden mt-12">
        <Slider {...secondSettings}>
          {data?.slider?.map((item) => (
            <div key={item.title} className="px-2">
              <Link
                href={`${ROUTES.marken[locale]}/${generateSlug(item.partners)}`}
                prefetch={true}
                locale={locale}
              >
                <div className="slider1-hover-wrapper relative h-10 w-full">
                  <Image
                    src={`/cms${item?.partners_image}`}
                    alt={item?.title ? `Marken - ${item.title}` : "Partner brand"}
                    fill
                    // Below-the-fold brand marquee — must NOT be priority, or every logo
                    // preloads and competes with the hero LCP image. Lazy-load instead.
                    loading="lazy"
                    className="object-contain transition-all duration-500"
                    sizes="300px"
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
      </div>
    </div>
  );
};

export default About;
