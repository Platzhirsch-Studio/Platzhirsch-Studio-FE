"use client";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

const SlideContent = ({ title, descriptionKey, index }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations();

  return (
    <div className="absolute pt-25 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full text-center flex flex-col items-center">
      <FadeInView
        as="h2"
        direction="bottom"
        duration={200}
        distance={10}
        className="text-white text-2xl sm:text-3xl md:text-5xl font-semibold px-4"
      >
        {title}
      </FadeInView>
      <FadeInView
        as="p"
        direction="bottom"
        duration={200}
        distance={10}
        delay={50}
        className="text-white text-sm sm:text-base md:text-xl mt-3 sm:mt-4 w-full max-w-screen-md px-4"
      >
        {t(`Slider.${descriptionKey}`)}
      </FadeInView>
      <FadeInView
        as="div"
        direction="bottom"
        duration={200}
        distance={10}
        delay={100}
      >
        <Link href={`/ueber-uns/marken/${generateSlug(title)}`} locale={locale}>
          <div className="button-custom8">
            <div
              aria-label={t("Buttons.discover")}
              data-text={t("Buttons.discover")}
            >
              <span></span>
              <p
                data-title={t("Buttons.discover")}
                data-text={t("Buttons.discover")}
              ></p>
            </div>
          </div>
        </Link>
        <style jsx>{`
          .button-custom8 {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            div {
              width: 200px;
              height: 45px;
              background-color: transparent;
              margin: 10px;
              color: white;
              position: relative;
              overflow: hidden;
              font-size: 13px;
              letter-spacing: 1px;
              font-weight: 500;
              text-transform: uppercase;
              transition: all 0.5s ease;
              cursor: pointer;
              border: 1px solid #d1b250;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 3px;
              @media (max-width: 640px) {
                width: 160px;
                height: 40px;
                font-size: 12px;
                margin: 8px;
              }
              &::before,
              &::after {
                content: "";
                position: absolute;
                width: 0;
                height: 2px;
                background-color: white;
                transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
              }
              &::before {
                right: 0;
                top: 0;
              }
              &::after {
                left: 0;
                bottom: 0;
              }
              span {
                width: 100%;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                z-index: 1;
                &::before,
                &::after {
                  content: "";
                  position: absolute;
                  width: 2px;
                  height: 0;
                  background-color: white;
                  transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
                }
                &::before {
                  right: 0;
                  top: 0;
                }
                &::after {
                  left: 0;
                  bottom: 0;
                }
              }
              p {
                padding: 0;
                margin: 0;
                position: absolute;
                width: 100%;
                height: 100%;
                transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
                &::before {
                  content: attr(data-title);
                  position: absolute;
                  top: 50%;
                  left: 0;
                  transform: translateY(-50%);
                  width: 100%;
                  text-align: center;
                }
                &::after {
                  content: attr(data-text);
                  position: absolute;
                  top: 150%;
                  left: 0;
                  width: 100%;
                  text-align: center;
                  color: #d1b250;
                }
              }
              &:hover::before,
              &:hover::after {
                width: 100%;
              }
              &:hover span::before,
              &:hover span::after {
                height: 100%;
              }
              &:hover p::before {
                top: -50%;
                transform: rotate(5deg);
              }
              &:hover p::after {
                top: 50%;
                transform: translateY(-50%);
              }
            }
          }
        `}</style>
      </FadeInView>
    </div>
  );
};

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = {
    dots: true,
    infinite: true,
    speed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    beforeChange: (_, next) => setCurrentSlide(next),
    appendDots: (dots) => (
      <div style={{ position: "absolute", bottom: "20px" }}>
        <ul className="m-0 p-0 flex items-center justify-center">{dots}</ul>
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
  };

  useEffect(() => {
    const fix = () => {
      document
        .querySelectorAll(
          '.slick-slide[aria-hidden="true"] a, .slick-slide[aria-hidden="true"] button',
        )
        .forEach((el) => {
          el.setAttribute("tabindex", "-1");
        });

      document
        .querySelectorAll(
          '.slick-slide[aria-hidden="false"] a, .slick-slide[aria-hidden="false"] button',
        )
        .forEach((el) => {
          el.setAttribute("tabindex", "0");
        });
    };

    fix();

    const interval = setInterval(fix, 300);

    return () => clearInterval(interval);
  }, []);

  const SliderData = [
    {
      img: "/Images/Home/orionMinoti.jpg",
      title: "Minotti",
      descriptionKey: "minotti",
    },
    {
      img: "/Images/Home/bannerImage-1.jpg",
      title: "Poliform",
      descriptionKey: "poliform",
    },
    {
      img: "/Images/Home/classicon.jpg",
      title: "ClassiCon",
      descriptionKey: "classicon",
    },
    {
      img: "/Images/Home/Rimadesio-Modulor-1.jpg",
      title: "Rimadesio",
      descriptionKey: "rimadesio",
    },
    {
      img: "/Images/Home/trecaparis.webp",
      title: "Treca",
      descriptionKey: "treca_paris",
    },
    {
      img: "/Images/Home/bannerImage-1.jpg",
      title: "Flos",
      descriptionKey: "flos",
    },
    {
      img: "/Images/Home/Poliform-Kitchen.jpg",
      title: "Poliform",
      descriptionKey: "poliform_cucine",
    },
  ];

  return (
    <div className="slider-container w-full h-150 lg:h-200">
      <Slider {...settings}>
        {SliderData.map((item, index) => (
          <div key={index} className="relative w-full h-150 lg:h-200">
            <div className="absolute inset-0 -z-10">
              <Image
                src={item.img}
                alt={item.title}
                fill
                // Only the first slide is the LCP element: give it priority (eager +
                // fetchpriority=high + a <link rel=preload>). The other 6 slides stay
                // lazy so all 7 hero images don't compete for bandwidth on load — the
                // previous fetchPriority="high" on every slide is what slowed mobile LCP.
                priority={index === 0}
                sizes="100vw"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-black opacity-10 -z-10" />
            <SlideContent
              title={item.title}
              descriptionKey={item.descriptionKey}
              index={index}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlider;
