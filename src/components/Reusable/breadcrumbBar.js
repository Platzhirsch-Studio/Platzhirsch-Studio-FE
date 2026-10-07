"use client";
import React from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

// Page header for catalogue routes (hub, category, product): breadcrumb trail,
// the page title in the display face and, when given, an intro sentence —
// the same sentence as the meta description, so what Google shows is what the
// visitor reads. Limestone surface like the homepage's full-width sections.
const BreadcrumbBar = ({ links, title, subtitle }) => {
  const locale = useLocale();

  return (
    // Top padding clears the fixed navbar (~80 px on phones, ~190 px on
    // desktop before the user scrolls).
    <div className="w-full bg-stone pt-28 lg:pt-56">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/75">
            {Array.isArray(links) &&
              links.map((link, index) => {
                const isCurrent = index === links.length - 1;
                return (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true" className="text-ink/30">/</span>}
                    {link.link && !isCurrent ? (
                      <Link href={link.link} locale={locale} className="transition-colors hover:text-gold-text">
                        {link.linkName}
                      </Link>
                    ) : (
                      <span aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "text-ink" : undefined}>
                        {link.linkName}
                      </span>
                    )}
                  </li>
                );
              })}
          </ol>
        </nav>

        {title && (
          <h1 className="font-display mt-5 text-4xl leading-tight text-ink md:text-5xl lg:text-[3.5rem]">{title}</h1>
        )}
        {subtitle && <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-ink/80 md:text-base">{subtitle}</p>}
      </div>
    </div>
  );
};

export default BreadcrumbBar;
