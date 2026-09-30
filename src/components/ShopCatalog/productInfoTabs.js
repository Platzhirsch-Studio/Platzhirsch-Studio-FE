"use client";
import { useState } from "react";
import {
  Layers, Feather, Shirt, PanelBottom, PanelTop, Sparkles, Box,
  Lightbulb, SlidersHorizontal, Frame, Umbrella, Settings, Ruler,
  Zap, Gauge, Flame, ShieldCheck, Grid2x2, Wrench, Droplet, Flower2,
  Layers3, ArrowUpToLine, Puzzle,
} from "lucide-react";
import DimensionDiagram from "@/components/ShopCatalog/dimensionDiagram";

// One icon per detail-field key (see CATEGORY_DETAIL_FIELDS in
// staticShopProducts.js) — Layers as a generic fallback for anything unmapped.
const FIELD_ICONS = {
  structure: Layers,
  padding: Feather,
  covers: Shirt,
  base: PanelBottom,
  top: PanelTop,
  finish: Sparkles,
  material: Box,
  lightSource: Lightbulb,
  dimmable: SlidersHorizontal,
  frame: Frame,
  canopy: Umbrella,
  mechanism: Settings,
  dimensions: Ruler,
  powerOutput: Zap,
  coverage: Gauge,
  technology: Flame,
  rating: ShieldCheck,
  fronts: Grid2x2,
  carcass: Box,
  countertop: PanelTop,
  hardware: Wrench,
  panel: PanelBottom,
  wax: Droplet,
  scent: Flower2,
  burnTime: Flame,
  size: Ruler,
  seatPreparation: Layers3,
  headrest: ArrowUpToLine,
  cushions: Feather,
};

// Description / Dimensions / Materials & Care / Configurations as tabs below
// the hero — reference: a furniture e-commerce product page's tab panel.
// Underlined tab row, one panel visible at a time, no cards or dark
// backgrounds — just clean text on the page's own background.
//
// Configurations is category-native, not generic boilerplate: it's "the
// different ways you can get this piece" — seat arrangements for a modular
// sofa, sizes for a bed, extension options for a table, and so on. Only
// products that actually define it (see e.g. "Yang" in staticShopProducts.js)
// get the tab; everything else just doesn't show it, same as Dimensions/
// Materials & Care already do.
const ProductInfoTabs = ({ labels, descriptionParagraphs, dims, materialsFields, configurations }) => {
  const tabs = [
    descriptionParagraphs?.length ? "description" : null,
    dims ? "dimensions" : null,
    materialsFields?.length ? "materials" : null,
    configurations?.length ? "configurations" : null,
  ].filter(Boolean);

  const [active, setActive] = useState(tabs[0]);
  if (!tabs.length) return null;

  return (
    <div>
      {/* border-y (not just border-b) so the line above and below the tab
          labels are the exact same rule, with matching py-4 keeping the text
          vertically centered between them instead of hugging one side. */}
      <div role="tablist" className="flex gap-8  border-y border-[#30373e]/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1b250] ${
              active === tab
                ? "border-[#d1b250] text-[#30373e]"
                : "border-transparent text-[#30373e]/55 hover:text-[#30373e]/80"
            }`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      <div className="pt-8">
        {active === "description" && (
          <div className="columns-1 gap-10 text-sm leading-relaxed text-[#30373e]/80 lg:columns-2">
            {descriptionParagraphs.map((p, i) => (
  <p
    key={i}
    className="mb-4 break-inside-avoid"
    dangerouslySetInnerHTML={{ __html: p }}
  />
))}

          </div>
        )}

        {active === "dimensions" && dims && (
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:gap-16">
            <DimensionDiagram dims={dims} size="lg" />
            <dl className="grid flex-1 grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
              {Object.entries(dims).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#d1b250]">{key}</dt>
                  <dd className="mt-1 text-sm text-[#30373e]">{value} cm</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {active === "materials" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {materialsFields.map((f) => {
              const Icon = FIELD_ICONS[f.key] || Layers;
              return (
                <div
                  key={f.key}
                  className="flex gap-4 rounded-md border-l-[3px] border-[#d1b250] bg-[#f7f6f4] p-5"
                >
                  <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#d1b250]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#30373e]">{f.label}</p>
                    <div className="mt-2 space-y-2">
                      {f.value.map((paragraph, pi) => (
                        <p key={pi} className="text-sm leading-relaxed text-[#30373e]/80">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {active === "configurations" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {configurations.map((c) => (
              <div
                key={c.name}
                className="flex gap-4 rounded-md border-l-[3px] border-[#d1b250] bg-[#f7f6f4] p-5"
              >
                <Puzzle size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#d1b250]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#30373e]">{c.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#30373e]/80">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfoTabs;
