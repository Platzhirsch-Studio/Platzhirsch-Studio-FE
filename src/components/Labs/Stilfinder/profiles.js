// Stil-Finder – the five style profiles.
// Plain module (no "use client", no "server-only"): the quiz (client), the
// scoring and the server-rendered result page all read it.
//
// Every profile is an editorial statement, not a claim: brands are listed as
// "Marken aus unserem Online-Katalog, die zu dieser Haltung passen" – never as
// partner or dealer. `moodboard` describes which catalogue slices (brand +
// Produkte-Kategorie keys, see Frappe doctype "Produkte New") the result page
// samples its products from; the actual products are always read live from the
// backoffice (catalog.js), nothing is invented here.

// Hero photos as static imports (blur placeholder, intrinsic size); `src`
// stays as a plain public path for Open Graph metadata.
import heroRuhe from "../../../../public/Images/Home/aboutHome.jpg";
// Abnahme Runde 3 (Inhaber-Frage Bildherkunft): no recognisable Tom Dixon
// pictures on the covers until the owner has cleared them – Warme Moderne
// and Pariser Salon use calmer archive pictures meanwhile.
// Feinschliff P3.5: Warme Moderne shows a long walnut table with cognac
// leather chairs (archive, Poliform kitchen scene) – the tagline speaks of
// "ein Tisch für alle", the former workplace picture had no table.
import heroWarm from "../../../../public/Images/Home/bannerImage-3.jpg";
import heroSee from "../../../../public/Images/Outdoor/bannerImage5.jpg";
import heroSalon from "../../../../public/Images/Home/download.jpg";
import heroKlar from "../../../../public/Images/Wohnen/bannerImage2.jpg";

import { textOn } from "../../../lib/stilfinder/palette.js";

export const PROFILE_ORDER = ["ruhe", "warm", "see", "salon", "klar"];

export const PROFILES = {
  ruhe: {
    key: "ruhe",
    slug: "italienische-ruhe",
    name: "Italienische Ruhe",
    tagline: "Tief sitzen, weit schauen, nichts muss.",
    text: "Sie lieben Räume, die durchatmen: niedrige, großzügige Sofas, ruhige Flächen in Sand und Greige, Stoffe, die man berühren möchte. Ihr Zuhause soll nicht beeindrucken – es soll gut tun.",
    keywords: ["Bouclé", "Leinen", "Eiche geräuchert", "Travertin", "Kaschmir-Plaid"],
    palette: [
      { name: "Leinen", hex: "#E9E3D9" },
      { name: "Sand", hex: "#CFC4B2" },
      { name: "Taupe", hex: "#8C8174" },
      { name: "Mokka", hex: "#4A443D" },
      { name: "Basalt", hex: "#2E2B28" },
    ],
    brands: ["Minotti", "Poliform", "Rimadesio"],
    moodboard: [
      {
        brand: "Minotti",
        categories: ["sofas-couches", "armchairs-stools", "coffee-tables", "rugs", "side-tables"],
        count: 4,
      },
      {
        brand: "Poliform",
        categories: ["beds", "dining-tables", "sofas-couches", "armchairs-stools"],
        count: 2,
      },
      {
        brand: "Rimadesio",
        categories: ["shelves", "sideboards-chests"],
        count: 2,
      },
    ],
    hero: {
      src: "/Images/Home/aboutHome.jpg",
      img: heroRuhe,
      alt: "Weitläufiger Wohnraum mit hellen Sofas, Sesseln und einem langen Kamin vor einer Fensterfront",
    },
    tip: "Ein großer Teppich in Wollton fasst die Sitzgruppe – lieber eine Nummer größer als das Sofa.",
  },
  warm: {
    key: "warm",
    slug: "warme-moderne",
    name: "Warme Moderne",
    tagline: "Klare Formen, warmes Holz, ein Tisch für alle.",
    text: "Bei Ihnen trifft skandinavische Klarheit auf Wärme: Nussbaum, Cognac-Leder, Keramik mit Charakter. Der Esstisch ist das Herz des Hauses – und Licht darf eine Skulptur sein.",
    keywords: ["Nussbaum", "Cognac-Leder", "Keramik", "Wolle", "Opalglas"],
    palette: [
      { name: "Hafer", hex: "#F1E8DA" },
      { name: "Cognac", hex: "#C9A27A" },
      { name: "Nussbaum", hex: "#7B5B3E" },
      { name: "Oliv", hex: "#6E7259" },
      { name: "Espresso", hex: "#2F2A24" },
    ],
    brands: ["101 Copenhagen", "Desalto", "ClassiCon", "Flos"],
    moodboard: [
      {
        brand: "101 Copenhagen",
        categories: ["decor", "lamps", "dining-chairs", "side-tables", "armchairs-stools"],
        count: 3,
      },
      {
        brand: "Desalto",
        categories: ["dining-tables", "dining-chairs", "coffee-tables"],
        count: 2,
      },
      {
        brand: "ClassiCon",
        categories: ["armchairs-stools", "side-tables", "dining-chairs"],
        count: 2,
      },
      { brand: "Flos", categories: ["lamps"], count: 1 },
    ],
    hero: {
      src: "/Images/Home/bannerImage-3.jpg",
      img: heroWarm,
      alt: "Langer Esstisch aus Nussbaum mit Lederstühlen in Cognac vor einer Küche mit Nussbaumfronten, darüber eine Pendelleuchte aus Glaskugeln",
    },
    tip: "Eine Pendelleuchte etwa 65 cm über dem Esstisch macht aus dem Tisch einen Ort.",
  },
  see: {
    key: "see",
    slug: "seeterrasse",
    name: "Seeterrasse",
    tagline: "Draußen ist Ihr schönstes Zimmer.",
    text: "Sie leben mit dem Wetter, dem Wasser und dem Abendlicht. Geflecht, Teak und wetterfeste Stoffe in Kalk- und Seetönen machen Terrasse und Garten zu einem Wohnraum – vom ersten Kaffee bis zur Dämmerung.",
    keywords: ["Teak", "Geflecht", "Outdoor-Stoff", "Naturstein", "Leinen"],
    palette: [
      { name: "Kalk", hex: "#F4F1EA" },
      { name: "Seenebel", hex: "#C8D3D2" },
      { name: "Bodensee", hex: "#7FA0A6" },
      { name: "Teak", hex: "#B79B76" },
      { name: "Schiefer", hex: "#3E4A4C" },
    ],
    brands: ["Paola Lenti", "Solpuri", "Tuuci", "Sifas", "Umbrosa"],
    moodboard: [
      {
        brand: "Paola Lenti",
        categories: ["lounge-furniture-daybeds", "rugs", "garden-tables", "armchairs-stools"],
        count: 3,
      },
      {
        brand: "Solpuri",
        categories: ["lounge-furniture-daybeds", "garden-chairs", "garden-tables"],
        count: 2,
      },
      {
        brand: "Tuuci",
        categories: ["garden-chairs", "sun-loungers", "lounge-furniture-daybeds"],
        count: 1,
      },
      {
        brand: "Sifas",
        categories: ["garden-tables", "lounge-furniture-daybeds", "garden-chairs"],
        count: 1,
      },
      { brand: "Umbrosa", categories: ["parasols"], count: 1 },
    ],
    hero: {
      src: "/Images/Outdoor/bannerImage5.jpg",
      img: heroSee,
      alt: "Lounge-Sofa mit gelben Kissen auf einer Terrasse über dem Meer, Pinien im Hintergrund",
    },
    tip: "Planen Sie draußen in Zonen wie drinnen: Essen, Liegen, Schatten – und Licht für den Abend.",
  },
  salon: {
    key: "salon",
    slug: "pariser-salon",
    name: "Pariser Salon",
    tagline: "Mehr Geschichte, mehr Glanz, mehr Gefühl.",
    text: "Sie mögen Räume mit Persönlichkeit: Samt, Messing, ein Spiegel mit Patina, ein Bett, in dem man versinkt. Kontraste sind erlaubt – solange alles zusammen ein Fest ergibt.",
    keywords: ["Samt", "Messing", "Marmor", "Spiegelglas", "Seide"],
    palette: [
      { name: "Champagner", hex: "#EDE4D6" },
      { name: "Messing", hex: "#B08D57" },
      { name: "Bordeaux", hex: "#6B3A3A" },
      { name: "Smaragd", hex: "#2F4A43" },
      { name: "Nacht", hex: "#1E1C1B" },
    ],
    brands: ["Eichholtz", "Treca", "Alonpi", "Baobab"],
    moodboard: [
      {
        brand: "Eichholtz",
        categories: ["sofas-couches", "armchairs-stools", "lamps", "mirrors", "coffee-tables", "dining-chairs"],
        count: 5,
      },
      { brand: "Treca", categories: ["beds"], count: 1 },
      { brand: "Alonpi", categories: ["bedwear", "decor"], count: 1 },
      { brand: "Baobab", categories: ["candles"], count: 1 },
    ],
    hero: {
      src: "/Images/Home/download.jpg",
      img: heroSalon,
      alt: "Esszimmer mit weißer Wandvertäfelung, langem Holztisch und Polsterstühlen mit runder Lehne in Sand",
    },
    tip: "Ein großer Spiegel gegenüber dem Fenster verdoppelt das Licht – und den Glanz am Abend.",
  },
  klar: {
    key: "klar",
    slug: "klare-linie",
    name: "Klare Linie",
    tagline: "Wenig, aber genau.",
    text: "Sie schätzen Präzision: schwarzes Metall, Glas, grafische Silhouetten und Ordnung, die nicht auffällt. Jedes Stück hat seinen Platz – und genug Raum um sich herum.",
    keywords: ["Glas", "Aluminium", "Lack matt", "Beton", "Rauchglas"],
    palette: [
      { name: "Kreide", hex: "#F5F5F3" },
      { name: "Aluminium", hex: "#BFC1C0" },
      { name: "Graphit", hex: "#6D7072" },
      { name: "Anthrazit", hex: "#2A2C2E" },
      { name: "Bronze", hex: "#A08463" },
    ],
    brands: ["Rimadesio", "Desalto", "Flos", "ClassiCon"],
    moodboard: [
      {
        brand: "Rimadesio",
        categories: ["display-cabinets", "sideboards-chests", "shelves", "dining-tables"],
        count: 3,
      },
      {
        brand: "Desalto",
        categories: ["dining-chairs", "side-tables", "shelves", "dining-tables"],
        count: 2,
      },
      { brand: "Flos", categories: ["lamps"], count: 2 },
      { brand: "ClassiCon", categories: ["side-tables", "mirrors"], count: 1 },
    ],
    hero: {
      src: "/Images/Wohnen/bannerImage2.jpg",
      img: heroKlar,
      alt: "Runder dunkler Esstisch mit Stuhl und einer kreisförmigen Pendelleuchte vor heller Wand",
    },
    tip: "Geschlossener Stauraum bis unter die Decke lässt den Rest des Raums leer – und ruhig.",
  },
};

export function profileBySlug(slug) {
  return PROFILE_ORDER.map((k) => PROFILES[k]).find((p) => p.slug === slug) || null;
}

// Mehrsprachigkeit (01.11.2026): derselbe Pfad /<locale>/stil-finder in allen
// vier Sprachen (Profil-Slugs bleiben deutsch); ohne locale = Deutsch.
export const RESULT_BASE = "/de/stil-finder";
export const resultBase = (locale = "de") => `/${locale}/stil-finder`;
export const resultHref = (profile, code, locale = "de") =>
  `${resultBase(locale)}/ergebnis/${profile.slug}${code ? `?a=${encodeURIComponent(code)}` : ""}`;

// Markenseiten unter dem übersetzten Pfad (wie src/utils/routing.js ROUTES.marken).
const MARKEN_PATHS = { de: "/ueber-uns/marken", en: "/about-us/brands", fr: "/a-propos/marques", it: "/chi-siamo/marche" };
export const brandHref = (name, locale = "de") =>
  `/${MARKEN_PATHS[locale] ? locale : "de"}${MARKEN_PATHS[locale] || MARKEN_PATHS.de}/${name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`;

// Readable text colour on a palette swatch (WCAG relative luminance).
// Text colour on a palette swatch by WCAG contrast (QA Runde 1, P2.6): ink or
// paper when either reaches 4.5:1, otherwise pure black/white.
export function onColor(hex) {
  return textOn(hex);
}
