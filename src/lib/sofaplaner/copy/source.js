// Sofaplaner – texts that depend on the data source (consent.js, SOURCE_COPY)
// in German and English (Welle 2, team EN-Yacht-Sofa, 29.10.2026).
// German: SOURCE_COPY unchanged. English: the same statements for /en/sofaplaner,
// British English, no claim beyond the German text (Minotti data with Minotti's
// consent, no prices, independent tool – not an offer from Minotti).
import { MINOTTI_DATA_CONSENT, SOURCE_COPY } from "../consent.js";
import { planTerminHref } from "../../kuechenplaner/planTermin.js";
import { NET_EN, dictFor } from "./t.js";

// Sprachen-Welle FR/IT (01.11.2026): FR/IT-Texte der Datenquelle stehen in
// ./ui-fr.js / ./ui-it.js (SOURCE.neutral / SOURCE.minotti) und kommen über
// die Registry von ./t.js (vorher loadDict(locale), ./dicts.js). pickerLead
// ist dort ein Text mit {n}; hier wird er zur Funktion wie bei DE/EN.
const intlCache = {};
function intlSource(locale) {
  const d = dictFor(locale);
  if (!d) return null;
  const key = `${locale}:${MINOTTI_DATA_CONSENT ? "m" : "n"}`;
  if (!intlCache[key]) {
    const src = MINOTTI_DATA_CONSENT ? d.SOURCE.minotti : d.SOURCE.neutral;
    intlCache[key] = Object.freeze({ ...src, pickerLead: (n) => String(src.pickerLead).replace(/{n}/g, String(n)) });
  }
  return intlCache[key];
}

const NEUTRAL_EN = Object.freeze({
  brand: null,
  modelWord: "Sofa type",
  overline: "Sofa planner · Plan your sofa",
  lead: "Plan your sofa from modules in grid sizes – corner, seat, chaise longue and footstool – right inside your own floor plan. The plan is the starting point for our conversation in the Lochau showroom.",
  leadShort: "Plan a sofa from grid-sized modules in your own room.",
  showroom: "We show you specific models in the showroom: fabrics, seating comfort and the makers' dimensions we compare there together.",
  pickerLead: (n) => `${n} sofa types in grid sizes, each with corner, seat, chaise longue and footstool. Choose the type closest to the way you like to sit.`,
  dimsNote: "D × H: planning sizes of the seat elements. We confirm the exact dimensions of the chosen model in the showroom.",
  sourceNote:
    "Note: the sofa types are Platzhirsch Home Living's own planning sizes (grid sizes), not a specific maker's model. The 3D preview shows schematic volumes in neutral colours. The planner shows no prices. Share links store only the plan, no personal data, and are valid for 180 days. We give prices on request, in conversation or in the Lochau showroom.",
  rulesNote: "The joining rules are derived from the module types and are confirmed in the showroom on the actual model.",
  terminProdukt: "Sofa (sofa planner)",
  seoName: "Sofa planner",
  h1Satz: "Your sofa, planned module by module.",
  metaTitle: "Sofa planner: plan a modular sofa in your room | Platzhirsch",
  metaDescription:
    "Plan a corner sofa, U-shape or chaise longue from grid-sized modules in your own floor plan – walkways, 3D preview, parts list. We show the models in the showroom.",
  unabhaengig: "The sofa planner is an independent planning tool by Platzhirsch Home Living.",
  terminLink: "Rather talk it through first? Book an appointment in the showroom",
  brandLink: { href: "/about-us/brands", label: "Our brands in the showroom" },
});

const MINOTTI_EN = Object.freeze({
  brand: "Minotti",
  modelWord: "Minotti model",
  overline: "Sofa planner · Minotti",
  lead: "Plan a sofa from the real elements of Minotti's models – with the maker's dimensions, matching joins and your own room. The plan is the starting point for our conversation in the Lochau showroom, with fabric samples and the chance to try every seat.",
  leadShort: "Plan a Minotti sofa from real elements in your own room.",
  showroom: null,
  pickerLead: (n) =>
    `All ${n} Minotti sofa families with their elements and the maker's dimensions, variants of one line on a single card. Choose a model – we plan the rest with you, step by step.`,
  dimsNote:
    "D × H: typical depth and height of the seat elements according to the maker (median), “–” where not published. Missing dimensions are marked in the planner and confirmed in the showroom.",
  sourceNote:
    "Data: Minotti S.p.A. – with Minotti's consent. Dimensions and options come from the maker's documentation (Minotti's product pages and technical sheets); missing dimensions are marked and confirmed in the showroom. Element names are Minotti's own English names; detailed specifications are taken from our German notes on those documents. The 3D preview shows schematic volumes in neutral colours, no manufacturer images. The planner shows no prices. Share links store only the plan, no personal data, and are valid for 180 days. We give prices on request, in conversation or in the Lochau showroom.",
  rulesNote: "Minotti does not publish a complete combination table: the rules are derived from the element types and are confirmed in the showroom.",
  terminProdukt: "Minotti sofa",
  seoName: "Minotti sofa planner",
  h1Satz: "Your sofa, planned module by module.",
  metaTitle: "Minotti sofa planner: compose your sofa | Platzhirsch",
  metaDescription:
    "Plan a Minotti sofa from real elements and the maker's dimensions in your own floor plan – joins, walkways, 3D preview. Prices on request.",
  unabhaengig: "The sofa planner is an independent planning tool by Platzhirsch Home Living and not an offer from Minotti.",
  terminLink: "Rather talk it through first? Book an appointment in the showroom",
  brandLink: { href: "/about-us/brands/minotti", label: "Minotti in Lochau" },
});

/** Data-source texts for a locale ("en" → English, "fr"/"it" from the loaded dictionary, else German). */
export function sourceCopy(locale = "de") {
  if (locale === "fr" || locale === "it") return intlSource(locale) || SOURCE_COPY;
  if (locale !== "en") return SOURCE_COPY;
  return MINOTTI_DATA_CONSENT ? MINOTTI_EN : NEUTRAL_EN;
}

/** Early exit to the appointment form, with planner context (German: copy/index.js TERMIN_HREF). */
export function terminHref(locale = "de") {
  // Rat 9,5 A12: ein Kontext für den Sofaplaner (thema=sofa&planer=sofaplaner), Vertrag in planTermin.js.
  return planTerminHref({ locale: ["en", "fr", "it"].includes(locale) ? locale : "de", planer: "sofaplaner", produkt: sourceCopy(locale).terminProdukt });
}

/** English network messages (src/messages/en.json → Labs.net); defined in ./t.js. */
export { NET_EN };
