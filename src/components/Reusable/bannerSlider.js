"use client";
import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";
import { ChevronLeft, ChevronRight } from "lucide-react";
const NextArrow = ({ onClick }) => (
  <div
    className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer bg-black/30 hover:bg-black/50 p-4 transition-all" // Increased z-index
    onClick={onClick}
  >
    <ChevronRight className="text-white text-2xl" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer bg-black/30 hover:bg-black/50 p-4 transition-all" // Increased z-index
    onClick={onClick}
  >
    <ChevronLeft className="text-white text-2xl" />
  </div>
);




const BannerSlider = ({ images, title, links }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    appendDots: (dots) => (

      // ... inside BannerSlider's return ...
      <div
        style={{ position: "absolute", bottom: "40px", zIndex: 20 }} // Increased z-index
        className="absolute inset-0 flex items-center justify-center z-10 w-full"
      >
        <ul className="m-0 p-0 flex items-center justify-center pointer-events-auto">{dots}</ul>
      </div>

    ),
    customPaging: (i) => (
      <div
        className={`transition-all duration-300 mx-1.5 rounded-full ${i === currentSlide
          ? "w-4 h-4 border-2 border-white bg-transparent"
          : "w-3 h-3 bg-white opacity-50"
          }`}
      />
    ),
    beforeChange: (current, next) => setCurrentSlide(next),
  };

  return (
    <div className="relative w-full lg:h-200 h-150">
      {/* Overlay content (title + breadcrumb) */}
      <div className="pt-23 absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
        {title && (
          <FadeInView
            as="h1"
            direction="bottom"
            duration={600}
            distance={20}
            className="text-white text-3xl md:text-5xl font-bold drop-shadow-lg mb-4"
          >
            {title}
          </FadeInView>
        )}

        {links?.length > 0 && (
          <FadeInView
            as="div"
            direction="bottom"
            duration={600}
            distance={10}
            delay={300}
            className="flex items-center justify-center text-white gap-2 text-sm uppercase tracking-wide"
          >
            {links.map((link, index) => (
              <span key={index} className="flex items-center gap-2">
                {link.link ? <Link href={link.link} locale={locale}>
                  <p className="hover:underline cursor-pointer">{link.linkName}</p>
                </Link> : <p className="hover:underline cursor-pointer">{link.linkName}</p>
                }

                {index < links.length - 1 && <span>/</span>}
              </span>
            ))}
          </FadeInView>
        )}
      </div>

      {/* Slider Images */}
      <Slider {...settings}>
        {images.map((image, index) => (
          <div key={index} className="lg:h-200 h-150 w-full relative">
            <div
              className="w-full lg:h-200 h-150 bg-cover bg-center"
              style={{ backgroundImage: `url('${image}')` }}
            >
              <div className="absolute inset-0 bg-black opacity-30" />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default BannerSlider;
