"use client";
import Image from "next/image";
import image1 from "../../../public/Images/Home/aboutHome.jpg";
import image2 from "../../../public/Images/Home/secondAboutHome.jpg";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";


const About = ({ data }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  // The autoplaying brand-logo marquee (react-slick) that used to close this
  // section is replaced by the static BrandWall on the homepage.

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
              {/* The page H1 lives in the hero (banner.js); this CMS headline is
                  the first section heading. */}
              <FadeInView
                as="h2"
                direction="bottom"
                duration={600}
                distance={30}
                delay={200}
                className="font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mb-5 text-[#30373e]"
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
          direction="bottom"
          duration={800}
          distance={24}
          className="w-full md:w-1/2 p-4 flex flex-col justify-center items-center"
        >
          {/* Eyebrow label (styling only) + the real section heading. */}
          <FadeInView
            as="p"
            direction="bottom"
            duration={600}
            distance={30}
            delay={100}
            className="text-lg lg:mt-12 sm:mt-0 text-[#30373e] text-center uppercase"
          >
            {data?.[`title_${locale}`]}
          </FadeInView>
          <FadeInView
            as="h2"
            direction="bottom"
            duration={600}
            distance={30}
            delay={200}
            className="font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-tight text-[#30373e] text-center mt-4 mb-4"
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

    </div>
  );
};

export default About;
