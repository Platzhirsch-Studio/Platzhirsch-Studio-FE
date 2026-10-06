"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";
import { ROUTES, localizeProductsHref } from "@/utils/routing";

// The CMS only stores a German link (link_before_footer_de, e.g. "/kontakt").
// Map it to the page language's path via ROUTES ("/kontakt" → "/contact",
// "/contatto", …); unknown paths are used as-is, empty → the contact page.
function localizeCmsPath(path, locale) {
  if (!path) return ROUTES.kontakt[locale] || ROUTES.kontakt.de;
  const clean = path.replace(/^\/(de|en|fr|it)(?=\/|$)/, "") || "/";
  for (const paths of Object.values(ROUTES)) {
    if (paths.de === clean) return paths[locale] || clean;
  }
  return localizeProductsHref(clean, locale);
}

export default function Choice({ data }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const ctaText = data?.[`link_text_${locale}`] || data?.link_text_de || "";
  const ctaHref = localizeCmsPath(data?.link_before_footer_de, locale);
  return (
    <div className="relative w-full ">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Images/Home/bannerImage-3.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[#30373e]/80 bg-opacity-50 z-1"></div>

      {/* Content with animations */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 py-20 lg:py-40">
        <FadeInView
          as="h2"
          direction="bottom"
          duration={600}
          distance={20}
          className="text-lg mb-4 text-[#d1b250] text-center uppercase"
        >
          {data?.[`title_before_footer_${locale}`]}
        </FadeInView>

        <FadeInView
          as="p"
          direction="bottom"
          duration={600}
          distance={20}
          delay={200}
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#ffffff] text-center mb-8 max-w-2xl uppercase"
        >
          {data?.[`subtitle_before_footer_${locale}`]}
        </FadeInView>

        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={20}
          delay={400}
        >
          <div className="button-custom9">
            <Link href={ctaHref} locale={locale} className="block">
              <span className="cta">
                <span className="lines"></span>
                <span className="sr-only">{ctaText}</span>
                <p aria-hidden="true" data-title={ctaText} data-text={ctaText}></p>
              </span>
            </Link>
          </div>
          <style jsx> {`
          .button-custom9{
           display: flex;
  justify-content: center;

  .cta {
    width: 250px;
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
      width: 260px;
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

    .lines {
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

    &:hover .lines::before,
    &:hover .lines::after {
      height: 100%;
    }

    &:hover p::before {
      top: -50%;
      // transform: rotate(5deg);
    }

    &:hover p::after {
      top: 50%;
      transform: translateY(-50%);
    }
  }
          }`} </style>
        </FadeInView>
      </div>
    </div>
  );
}