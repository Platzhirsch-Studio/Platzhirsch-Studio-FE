// Image register of the landing pages (Design-Bibel §7/§7.1, Jury §3.4, QM
// Runde 1 P1-1/P1-2/P2-3). The page files still carry their own `image` fields;
// this layer makes sure no landing page shows a foreign place (sea,
// Mediterranean, Provence), a broken file or the same photo twice, until the
// page owners move the values into their CONTENT objects and the own shooting
// (Shotliste Tag 5) replaces them. Server-only data, no client JavaScript.
// Docs: Marktresearch/digital/redesign/landingpages.md (Bildregister).

/** Files that must not appear on a landing page, with the reason. */
export const BLOCKED_IMAGES = {
  "/Images/Outdoor/bannerImage3.jpg": "Provence mit Zypressen (fremder Ort)",
  "/Images/Outdoor/bannerImage4.jpg": "Pinien und Meer (fremder Ort)",
  "/Images/Outdoor/bannerImage5.jpg": "Palmen, Meer, Kreuzfahrtschiff (fremder Ort)",
  "/Images/Home/thidImage.jpg": "Meer und Steilküste (fremder Ort)",
  "/Images/Home/secondImage.jpg": "Pool am Mittelmeerhang (fremder Ort)",
  "/Images/Wohnen/bannerImage6.jpg": "weisser Rand im Bild eingebacken",
};

export const isBlocked = (src) => Boolean(src && BLOCKED_IMAGES[src]);

/**
 * Replacements per landing path. Every hero is unique across all landing
 * pages (checked against the 15 template pages + Yacht + Outdoor).
 * Keys: hero {src, alt, released?}, intro {src, alt}, gallery [{src, alt}],
 * services [{src, alt}] (Yacht), noRegionImages (Yacht area cards).
 *
 * hero.released === false (R3-landing): the hero photo is a stand-in without
 * a documented release (Bibel §7.1: hero = own photo; Herstellerbilder only
 * with written release) and does not show the page's subject (Yacht: no boat;
 * Outdoor: no garden at the lake). The hero is then shown without a photo
 * (typographic hero) instead of an unmarked stand-in. src stays here only for
 * the unchanged JSON-LD primaryImageOfPage; swap in the own photo from the
 * shooting (Shotliste Tag 5) and drop `released: false` to show it again.
 */
const OVERRIDES = {
  // Küchen + Kempten (QM R3-landing P2-2): the hero is a manufacturer press
  // photo (Kuche1: Poliform look; Kempten: Rimadesio wall system) without a
  // documented release for a landing page – same rule as Yacht/Outdoor.
  // src/alt = the page's own values, kept for the unchanged JSON-LD.
  "/kuechen-vorarlberg": {
    hero: {
      released: false,
      src: "/Images/Kuche/bannerImageKuche1.jpg",
      alt: "Designerküche mit weißer Kochinsel und dunklen Hochschränken",
    },
  },
  // Outdoor-Küche (02.11.2026): kein eigenes Foto einer Außenküche – Hero
  // typografisch (src nur für JSON-LD). Intro-Bild = Liebherr-Raumszene aus dem
  // Katalog (src/lib/katalog/marken/liebherr.js, Bildfreigabe laut Inhaber,
  // Entscheidung Nr. 24), im eigenen Seitenverhältnis 1200 × 677 ohne Zuschnitt.
  "/outdoor-kueche": {
    hero: {
      released: false,
      src: "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp",
      alt: "Außenküche aus Holz auf einer Dachterrasse mit geöffnetem Outdoor-Kühlschrank",
    },
    intro: {
      src: "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp",
      alt: "Außenküche aus Holz auf einer Dachterrasse mit geöffnetem Outdoor-Kühlschrank von Liebherr",
      width: 1200,
      height: 677,
    },
  },
  "/designermoebel-kempten": {
    hero: {
      released: false,
      src: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
      alt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
    },
  },
  // The five city pages (Runde 3 P5, gesamtwerk P1): no city page shares the
  // homepage photo any more (Bregenz had /Images/Home/aboutHome.jpg). No local
  // or manufacturer photo in Marktresearch/recht/bildrechte.csv has a
  // documented release, so the five heroes are typographic (lead + fact row
  // per city) until the own shooting (Shotliste Tag 5) delivers one per city.
  "/designermoebel-bregenz": {
    hero: { released: false, src: "/Images/Home/aboutHome.jpg", alt: "Showroom von Platzhirsch Home Living in Lochau bei Bregenz" },
    // Rat 9,5 A6 (Inhaber-Entscheidung Nr. 11): aboutHome.jpg ist freigegeben (Mail 28.10.2026,
    // bildrechte.csv). Nicht als Hero (kein Duplikat zur Startseite), sondern als Intro-Bild –
    // im eigenen Seitenverhältnis, ohne Zuschnitt (Umfang „Zuschnitte“ laut Register noch offen).
    // Ersetzt secondAboutHome.jpg (Freigabe offen).
    intro: {
      src: "/Images/Home/aboutHome.jpg",
      alt: "Showroom von Platzhirsch Home Living in Lochau, wenige Minuten von Bregenz",
      width: 2048,
      height: 1228,
    },
  },
  "/designermoebel-dornbirn": {
    hero: { released: false, src: "/Images/Home/slider/poliform-kueche-kochinsel.webp", alt: "Poliform Küche mit Kochinsel, Esstisch aus Holz und Wandregal" },
  },
  "/designermoebel-friedrichshafen": {
    hero: { released: false, src: "/Images/Licht/bannerImageLicht3.jpg", alt: "Schwarzer Esstisch mit schwarzen Stühlen unter kugelförmigen Pendelleuchten" },
  },
  "/designermoebel-st-gallen": {
    hero: { released: false, src: "/Images/UberUns/Rimadesio-Modulor.jpg", alt: "Wohnwand mit Holzpaneelen, Regalböden und Lowboard, davor eine schwarze Lederbank" },
    // Optik-QA 01.11.2026: dasselbe Intro-Bild wie in page.js, aber im eigenen Format – die Datei
    // ist nur 1024 × 615 px; als 4:5-Zuschnitt war sie am Handy/iPad 1,4–1,9-fach hochskaliert.
    intro: {
      src: "/Images/UberUns/living.jpg",
      alt: "Wohnbereich mit dunklen Sofas, Sesseln, Regal und Treppe vor einer schwarzen Wand",
      width: 1024,
      height: 615,
    },
  },
  "/designermoebel-lindau": {
    hero: {
      released: false,
      src: "/Images/Wohnen/bannerImage10.jpg",
      alt: "Wohnraum mit hellem Ecksofa, rundem Marmortisch und Glasfront zu einem begrünten Innenhof",
    },
    gallery: [
      {
        src: "/Images/Home/bannerImage.jpg",
        alt: "Zwei Outdoor-Sessel mit Flechtwerk und Couchtisch vor einer Natursteinwand",
      },
      {
        src: "/Images/Wohnen/bannerImage1.jpg",
        alt: "Beistelltische mit farbigen Glasfüßen und ein Stuhl vor einer Sichtbetonwand",
      },
    ],
  },
  "/designermoebel-liechtenstein": {
    hero: {
      src: "/Images/Home/secondAboutHome.jpg",
      alt: "Wohnbereich mit hellem Ecksofa, schwarzem Ledersessel und Couchtischen unter einer dunklen Decke",
    },
    // The page's own intro photo shows the same room as the new hero.
    intro: {
      src: "/Images/Wohnen/bannerImage4.jpg",
      alt: "Wohnraum mit hellem Ecksofa, Couchtischen und Sesseln vor einer dunklen Holzwand",
    },
  },
  "/yacht-interior": {
    hero: {
      released: false,
      src: "/Images/Outdoor/bannerImage1.jpg",
      alt: "Lounge aus Teak mit Outdoor-Polstern und Couchtischen aus Holz vor einer weißen Lochwand",
    },
    services: [
      {
        src: "/Images/Home/bannerImage.jpg",
        alt: "Outdoor-Sessel mit Flechtwerk und hellen Polstern vor einer Natursteinwand",
      },
      {
        src: "/Images/UberUns/white-sofas.jpg",
        alt: "Zwei helle Outdoor-Liegen mit Flechtwerk auf einem runden Teppich im Grünen",
      },
    ],
    noRegionImages: true,
  },
  "/outdoor-gartenplanung": {
    hero: {
      released: false,
      src: "/Images/Outdoor/bannerImage2.jpg",
      alt: "Esstisch aus Holz mit geflochtenen Stühlen auf einer Terrasse mit Bambus und Pflanzen",
    },
    gallery: [
      {
        src: "/Images/Outdoor/bannerImage1.jpg",
        alt: "Outdoor-Lounge mit Sofa, Sesseln und Couchtischen aus Holz vor einer weißen Lochwand",
      },
      {
        src: "/Images/UberUns/white-sofas.jpg",
        alt: "Zwei helle Outdoor-Liegen mit Flechtwerk auf einem runden Teppich im Grünen",
      },
    ],
  },
};

export const imageOverrides = (path) => OVERRIDES[path] || {};

/**
 * Hero image of a page: the register entry wins, otherwise the page's own.
 * `show` is false while the register marks the hero as not released; the
 * page then renders its hero without a photo (src is kept for JSON-LD).
 * @returns {{src: string, alt: string, show: boolean}}
 */
export function heroImage(path, src, alt) {
  const o = imageOverrides(path).hero;
  if (!o) return { src, alt, show: true };
  const { released, ...img } = o;
  return { ...img, show: released !== false };
}

/**
 * Gallery without blocked files, without the hero (no duplicate in the first
 * two screens) and without duplicates.
 */
export function cleanGallery(images = [], heroSrc, override) {
  const source = override || images;
  const seen = new Set([heroSrc]);
  return source.filter((img) => {
    if (!img?.src || isBlocked(img.src) || seen.has(img.src)) return false;
    seen.add(img.src);
    return true;
  });
}
