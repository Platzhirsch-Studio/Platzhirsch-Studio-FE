"use client";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ROUTES } from "@/utils/routing";
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
        <Link href={`${ROUTES.marken[locale]}/${generateSlug(title)}`} locale={locale}>
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

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  // Compressed WebP versions (max 1920 px wide) in /Images/Home/slider/.
  // `alt` describes what the photo shows, per locale (German fallback).
  const SliderData = [
    {
      img: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
      title: "Minotti",
      descriptionKey: "minotti",
      alt: {
        de: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        en: "White Minotti sectional sofa in a living room with a dark wood wall",
        fr: "Canapé d'angle Minotti blanc dans un salon avec un mur en bois sombre",
        it: "Divano angolare Minotti bianco in un soggiorno con parete in legno scuro",
      },
    },
    {
      img: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
      title: "Poliform",
      descriptionKey: "poliform",
      alt: {
        de: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        en: "Poliform upholstered bed with a tall headboard in a bedroom with a wood wall",
        fr: "Lit rembourré Poliform à haute tête de lit dans une chambre avec mur en bois",
        it: "Letto imbottito Poliform con testiera alta in una camera con parete in legno",
      },
    },
    {
      img: "/Images/Home/slider/classicon-bell-beistelltische.webp",
      title: "ClassiCon",
      descriptionKey: "classicon",
      alt: {
        de: "ClassiCon Bell Beistelltische aus farbigem Glas mit Messing- und Kupferplatten",
        en: "ClassiCon Bell side tables in coloured glass with brass and copper tops",
        fr: "Tables d'appoint ClassiCon Bell en verre coloré avec plateaux en laiton et cuivre",
        it: "Tavolini ClassiCon Bell in vetro colorato con piani in ottone e rame",
      },
    },
    {
      img: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
      title: "Rimadesio",
      descriptionKey: "rimadesio",
      alt: {
        de: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        en: "Rimadesio wall system with wood panels, shelves and sideboard in a living space",
        fr: "Système mural Rimadesio avec panneaux en bois, étagères et buffet",
        it: "Sistema a parete Rimadesio con pannelli in legno, mensole e madia",
      },
    },
    {
      img: "/Images/Home/slider/treca-paris-bett-schlafzimmer.webp",
      title: "Treca",
      descriptionKey: "treca_paris",
      alt: {
        de: "Treca Paris Bett mit gemustertem Kopfteil in einem hellen Schlafzimmer",
        en: "Treca Paris bed with a patterned headboard in a bright bedroom",
        fr: "Lit Treca Paris avec tête de lit à motifs dans une chambre lumineuse",
        it: "Letto Treca Paris con testiera fantasia in una camera luminosa",
      },
    },
    {
      img: "/Images/Home/slider/flos-stehleuchte-v3.webp",
      title: "Flos",
      descriptionKey: "flos",
      alt: {
        de: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        en: "Flos floor lamp with a round light disc on a chrome tripod",
        fr: "Lampadaire Flos avec disque lumineux rond sur trépied chromé",
        it: "Lampada da terra Flos con disco luminoso rotondo su treppiede cromato",
      },
    },
    {
      img: "/Images/Home/slider/poliform-kueche-kochinsel.webp",
      title: "Poliform",
      descriptionKey: "poliform_cucine",
      alt: {
        de: "Poliform Küche mit Kochinsel aus Nussholz und Esstisch",
        en: "Poliform kitchen with a walnut island and dining table",
        fr: "Cuisine Poliform avec îlot en noyer et table à manger",
        it: "Cucina Poliform con isola in noce e tavolo da pranzo",
      },
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
                alt={item.alt[locale] || item.alt.de}
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
