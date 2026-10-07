"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

// Photo header for the content pages (Beratung, Kontakt, Team, News, landing
// pages …): full-bleed photo, the title in the display face, a semantic
// breadcrumb. Text sits bottom-left over a gradient (not centred over a flat
// 30 % overlay), the same stage as the homepage hero. No entrance animation
// here: the page should be readable the instant it paints.
const SinglePageBanner = ({ info }) => {
  const locale = useLocale();
  const links = Array.isArray(info.links) ? info.links : [];

  return (
    <div className="relative isolate w-full h-150 lg:h-200 text-white">
      <Image
        src={info.image}
        // Pages can pass their own `info.alt`; otherwise describe it by the page title.
        alt={info.alt || `${info.title} – Platzhirsch Home Living`}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center -z-20"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-night/85 via-night/35 to-night/20" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 pt-28 sm:px-6 lg:pb-16 lg:pt-56">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70">
            {links.map((link, index) => {
              const isCurrent = index === links.length - 1;
              return (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true" className="text-white/40">/</span>}
                  {link?.link && !isCurrent ? (
                    <Link href={link.link} locale={locale} className="transition-colors hover:text-gold">
                      {link.linkName}
                    </Link>
                  ) : (
                    <span aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "text-white" : undefined}>
                      {link.linkName}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="font-display mt-4 max-w-4xl text-4xl leading-[1.05] md:text-5xl lg:text-6xl">{info.title}</h1>
        {info.subtitle && <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">{info.subtitle}</p>}
      </div>
    </div>
  );
};

export default SinglePageBanner;
