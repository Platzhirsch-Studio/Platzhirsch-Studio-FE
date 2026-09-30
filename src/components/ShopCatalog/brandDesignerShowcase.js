"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Editorial "Designer / Brand" section on the product detail page. Not tabs —
// the active entity gets the full dark panel + large photo treatment, while
// the other one stays visible as a small "peek" card floating on the image
// (its own tiny photo, label and name) that you click to swap which one is
// the main focus. So the inactive entity is never fully hidden, just smaller.
const BrandDesignerShowcase = ({ locale, designerName, designerInfo, brandName, brandInfo, brandPageHref, labels }) => {
  const [activeTab, setActiveTab] = useState(designerInfo ? "designer" : "brand");

  const active = activeTab === "designer"
    ? { name: designerName, info: designerInfo, number: designerInfo ? "01" : "02" }
    : { name: brandName, info: brandInfo, number: designerInfo ? "02" : "01" };

  const inactiveTab = activeTab === "designer" ? "brand" : "designer";
  const inactive = inactiveTab === "designer"
    ? { name: designerName, info: designerInfo, labelKey: "designer" }
    : { name: brandName, info: brandInfo, labelKey: "brand" };
  const hasInactive = Boolean(inactive.info);

  const isBrand = activeTab === "brand";

  return (
    <div>
      {/* Text/image sides mirror each other between focuses — Designer shows
          text-left/image-right, Brand flips to image-left/text-right — so
          switching focus reads as a distinct layout, not just swapped copy. */}
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[1.1fr_1fr]">
        <div
          className={`relative order-2 flex flex-col justify-center overflow-hidden bg-[#30373e] p-8 sm:p-12 lg:p-14 ${
            isBrand ? "lg:order-2" : "lg:order-1"
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 -left-2 select-none text-[9rem] font-bold leading-none text-white/[0.06] sm:text-[11rem]"
          >
            {active.number}
          </span>
          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
              {labels[activeTab]}
            </span>
            <div className="mt-3 h-[2px] w-12 bg-[#d1b250]" />
            <p className="mt-5 text-3xl font-light uppercase tracking-wide text-white sm:text-4xl">
              {active.name}
            </p>
            {isBrand && (active.info?.founded || active.info?.country) && (
              <p className="mt-2 text-xs uppercase tracking-wide text-[#d1b250]">
                {[active.info.founded && `${labels.founded} ${active.info.founded}`, active.info.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">{active.info?.bio}</p>

            {isBrand && brandPageHref && (
              <Link
                href={brandPageHref}
                locale={locale}
                className="mt-6 inline-flex items-center gap-2 border-2 border-[#d1b250] rounded-[3px] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors duration-300 hover:bg-[#d1b250] hover:text-[#30373e]"
              >
                {labels.viewBrandPage}
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div
          className={`relative order-1 min-h-[320px] bg-gray-100 lg:min-h-[520px] ${
            isBrand ? "lg:order-1" : "lg:order-2"
          }`}
        >
          <Image
            key={active.info?.image || "fallback"}
            src={active.info?.image || "/Images/fallback-banner.jpg"}
            alt={active.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />

          {hasInactive && (
            <button
              type="button"
              onClick={() => setActiveTab(inactiveTab)}
              aria-label={`${labels[inactive.labelKey]}: ${inactive.name}`}
              className="group absolute bottom-4 left-4 flex items-center gap-3 rounded-lg bg-white/95 p-2.5 pr-4 shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:bottom-6 sm:left-6"
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                {inactive.info.image && (
                  <Image src={inactive.info.image} alt={inactive.name} fill sizes="44px" className="object-cover" />
                )}
              </span>
              <span className="text-left">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#d1b250]">
                  {labels[inactive.labelKey]}
                </span>
                <span className="block text-sm font-medium text-[#30373e]">{inactive.name}</span>
              </span>
              <ArrowUpRight
                size={16}
                className="ml-1 shrink-0 text-[#30373e]/35 transition-colors group-hover:text-[#d1b250]"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandDesignerShowcase;
