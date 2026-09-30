"use client";
import React from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";

// Lightweight page header for routes that don't need the full hero banner: a muted
// breadcrumb trail (home → ... → current page) with the page title underneath it,
// both inside one cohesive band instead of stacked separately.
const BreadcrumbBar = ({ links, title, subtitle }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  return (
    // Top padding clears the fixed navbar (a single ~80px row on mobile, but three
    // stacked rows — utility bar + main bar + mega-menu row — ≈190px tall on
    // desktop before the user scrolls). Padded generously above that measured
    // height since this short, top-aligned band has no margin for error (unlike
    // the big hero banners, which hide any shortfall by centering content in a
    // 450-800px box).
    <div className="w-full bg-[#f7f6f4] border-b border-[#30373e]/10 pt-32 lg:pt-60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <nav aria-label="breadcrumb" className="mb-3">
          <div className="flex flex-wrap items-center gap-1 text-[11px] sm:text-xs font-medium uppercase tracking-[0.08em]">
            {Array.isArray(links) &&
              links.map((link, index) => {
                // The last crumb is the current page — shown darker than the links before it.
                const isCurrent = index === links.length - 1;
                const tone = isCurrent ? "text-[#30373e]" : "text-[#30373e]/70";
                return (
                <React.Fragment key={index}>
                  {link.link ? (
                    <Link
                      href={link.link}
                      locale={locale}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`${tone} hover:text-[#d1b250] transition-colors whitespace-nowrap`}
                    >
                      {link.linkName}
                    </Link>
                  ) : (
                    <span className={`${tone} whitespace-nowrap`}>{link.linkName}</span>
                  )}
                  {index < links.length - 1 && <span className="mx-1 text-[#30373e]/40">/</span>}
                </React.Fragment>
                );
              })}
          </div>
        </nav>

        {title && (
          <h1 className="text-3xl md:text-4xl font-light text-[#30373e] tracking-tight">{title}</h1>
        )}
        {subtitle && <p className="mt-2 text-sm text-[#30373e]/60">{subtitle}</p>}
      </div>
    </div>
  );
};

export default BreadcrumbBar;
