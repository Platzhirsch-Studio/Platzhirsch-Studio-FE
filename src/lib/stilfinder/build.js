// src/lib/stilfinder/build.js
// Pure PDF pipeline of the Stil-Finder: candidate rows from the catalogue →
// curated items with checked images and QR codes → @react-pdf document →
// Buffer. All I/O is injected (catalogue rows, image loader), so node --test
// can build a real PDF offline. No "@/..." imports.
//
// Curation (QA Runde 1, P1.1 + P1.4):
//   - every candidate image is analysed (imageStats.js); empty/flat images and
//     (for non-curated pieces) off-palette colours are replaced by the next
//     candidate of the same room, in up to three waves inside BUDGET.imagesMs;
//   - room heroes are main pieces only, accessories max. one per room;
//   - no product twice in the document (the light page takes an unused lamp);
//   - Bild-Tor: fewer than IMAGE_GATE.min product images → ImageGateError
//     (the service answers 503 "busy"), never a PDF with placeholders.
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY } from "../site.js";
import { BUDGET, IMAGE_GATE, SITE_ORIGIN, terminUrl } from "./config.js";
import { PROFILE_CONTENT, ROOM_ORDER } from "./content.js";
import { buildDocument } from "./document.js";
import { loadPublicImage, toneToPaper } from "./images.js";
import { loadProfileMaterials, MATERIAL_SOURCE } from "./materials.js";
import { curateRooms, toItem } from "./curate.js";
import { LIGHT_KEY } from "./rooms.js";

// Moved to curate.js (shared with the web moodboard); re-exported for callers.
export { CATEGORY_LABELS, curateRooms, toItem, typoQuotes } from "./curate.js";

// Showroom chapter photos (Platzhirsch-Bildarchiv, same as on the website).
export const SHOWROOM_IMAGE = {
  src: "/Images/Home/secondAboutHome.jpg",
  credit: "Platzhirsch-Bildarchiv (Showroom Lochau)",
};
export const SHOWROOM_DARK_IMAGE = {
  src: "/Images/UberUns/living.jpg",
  credit: "Platzhirsch-Bildarchiv (Showroom Lochau)",
};

// Cover photo per profile: concrete source (QA P3.8). Files from the website's
// image archive; manufacturer photos are named as such.
// QA Runde 3, P1.1: no file names in the PDF (they made the notes column run
// into the footer) – the files are listed in meta.json (imageFiles).
// Abnahme Runde 3: the Tom Dixon covers (Warme Moderne, Pariser Salon) are
// replaced by calmer archive pictures until the owner has cleared their
// origin (Inhaber-Frage in the feature doc).
export const HERO_CREDITS = {
  ruhe: "Platzhirsch-Bildarchiv, Showroom Lochau",
  warm: "Herstellerbild Küche und Essen (Website-Archiv); Hersteller vor öffentlicher Nutzung bestätigen",
  see: "Herstellerbild Outdoor (Website-Archiv); Hersteller vor öffentlicher Nutzung bestätigen",
  salon: "Herstellerbild Essen (Website-Archiv); Hersteller vor öffentlicher Nutzung bestätigen",
  klar: "Herstellerbild Wohnen (Website-Archiv); Hersteller vor öffentlicher Nutzung bestätigen",
};

const ARCHIVE_CREDIT = "Website-Archiv Platzhirsch, Herstellerbild; Hersteller vor öffentlicher Nutzung bestätigen";
const ARCHIVE = (file) => ({ credit: ARCHIVE_CREDIT, file });

// Introduction picture per profile (QA Runde 2, P1.2 b + P2.4 c): fixed per
// profile and never a product picture, so it appears nowhere else in the PDF.
const scene = (src) => ({ src, ...ARCHIVE(src.replace(/^\/Images\//, "")) });
// QA Runde 3, P2.2: no scenes with recognisable third-party brands (Tom Dixon)
// without the owner's release – Warme Moderne gets the plaid scene.
export const INTRO_IMAGES = {
  ruhe: scene("/Images/Accessories/bannerImageAccessories1.jpg"),
  warm: scene("/Images/Accessories/bannerImageAccessories3.jpg"),
  see: scene("/Images/Outdoor/bannerImage3.jpg"),
  salon: scene("/Images/Licht/bannerImageLicht2.jpg"),
  klar: scene("/Images/Wohnen/bannerImage1.jpg"),
};

// Room scenes (QA Runde 2, P2.5; Runde 3, P2.1/2.2/2.5): one archive scene
// per profile AND room. When the room hero is a cut-out, the left half of the
// room page bleeds with this scene ("Raumstimmung") and the piece sits as an
// inset flush with its lower edge. Rules: no Minotti pictures (must not be
// cropped), no recognisable third-party brands (Tom Dixon), each profile its
// own outdoor scene. Checked by eye on 28.10.2026 (contact sheet).
export const ROOM_SCENES = {
  ruhe: {
    wohnen: scene("/Images/Home/Rimadesio-Modulor-1.jpg"),
    essen: scene("/Images/Wohnen/bannerImage3.jpg"),
    kueche: scene("/Images/Home/Poliform-Kitchen.jpg"),
    schlafen: scene("/Images/Home/bannerImage-1.jpg"),
    outdoor: scene("/Images/Outdoor/bannerImage1.jpg"),
  },
  warm: {
    wohnen: scene("/Images/Wohnen/bannerImage1.jpg"),
    essen: scene("/Images/UberUns/indoor.jpg"),
    kueche: scene("/Images/Kuche/bannerImageKuche2.jpg"),
    schlafen: scene("/Images/Home/bannerImage-2.jpg"),
    outdoor: scene("/Images/Outdoor/bannerImage2.jpg"),
  },
  see: {
    wohnen: scene("/Images/Wohnen/bannerImage9.jpg"),
    essen: scene("/Images/Outdoor/bannerImage4.jpg"),
    kueche: scene("/Images/Home/Poliform-Kitchen.jpg"),
    schlafen: scene("/Images/Home/bannerImage-1.jpg"),
    outdoor: scene("/Images/Home/thidImage.jpg"),
  },
  salon: {
    wohnen: scene("/Images/Wohnen/bannerImage7.jpg"),
    essen: scene("/Images/Licht/bannerImageLicht1.jpg"),
    kueche: scene("/Images/Kuche/bannerImageKuche1.jpg"),
    schlafen: scene("/Images/Wohnen/bannerImage6.jpg"),
    outdoor: scene("/Images/Outdoor/bannerImage3.jpg"),
  },
  klar: {
    wohnen: scene("/Images/UberUns/Rimadesio-Modulor.jpg"),
    essen: scene("/Images/Wohnen/bannerImage8.jpg"),
    kueche: scene("/Images/Kuche/bannerImageKuche3.jpg"),
    schlafen: scene("/Images/Home/bannerImage-1.jpg"),
    outdoor: scene("/Images/Outdoor/bannerImage4.jpg"),
  },
};

// Light page without a lamp of its own (QA Runde 3, P2.4): a scene with light
// before the dark block (Flos, a brand of the catalogue).
export const LIGHT_SCENE = scene("/Images/Home/bannerImage-2.jpg");

const HOURS = [
  ["Dienstag bis Freitag", "10–18 Uhr"],
  ["Samstag", "10–14 Uhr"],
  ["Sonntag und Montag", "geschlossen"],
];

export const FACTS = {
  ...ADDRESS,
  phone: PHONE_DISPLAY,
  phoneHref: `tel:${String(PHONE_DISPLAY).replace(/[^\d+]/g, "")}`,
  email: EMAIL,
  emailHref: `mailto:${EMAIL}`,
  legalName: LEGAL_NAME,
  hours: HOURS,
  impressum: `${SITE_ORIGIN}/de/impressum`,
  datenschutz: `${SITE_ORIGIN}/de/datenschutz`,
};

export class ImageGateError extends Error {
  constructor(found, needed) {
    super(`image gate: ${found}/${needed} product images`);
    this.code = "busy";
    this.found = found;
    this.needed = needed;
  }
}

export const qrPng = (text, width = 360) =>
  QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 0,
    width,
    color: { dark: "#30373e", light: "#ffffff" },
  });

export function dateLabel(now = new Date()) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Vienna",
  }).format(now);
}

// pdf-lead fix-01: the Termin link lives in config.js (shared with mail and
// form): planer, produkt and the result link reach /beratung and /termin.
export { terminUrl };

/** Layout variant of a product image: tone cut-outs (not for protected brands). */
async function prepareForLayout(it) {
  if (!it?.img) return it;
  if (it.img.cutout && !it.protected) it.img = await toneToPaper(it.img);
  return it;
}

/**
 * buildMoodboardPdf(options) → { buffer, pages, bytes, ms, items, timings }
 *   profile       PROFILES[key] (name, slug, tagline, text, keywords, palette, hero)
 *   customer      { name, projektLabel, regionLabel }
 *   result        { shares:[{name,pct,color}], answers:[{q,a}] } | null
 *   roomRows      { wohnen: [row], … } candidates from roomCandidates()
 *   loadImage     async (cmxPath) => { data, width, height, cutout, stats } | null
 *   helpers       { cleanName, brandName } (display helpers of src/lib/content)
 *   minImages     Bild-Tor (default IMAGE_GATE.min); 0 = off (tests only)
 *   labs, now
 *   code, calendar  answer code (result link in the Termin hand-off) and
 *                   ownCalendarActive() of the server (/termin vs. /beratung)
 */
export async function buildMoodboardPdf({ profile, customer = {}, result = null, roomRows, loadImage, helpers, labs = true, now = new Date(), minImages = IMAGE_GATE.min, timings: outerTimings = {}, code = null, calendar = false, delivery = "outbox" }) {
  const t0 = Date.now();
  const content = PROFILE_CONTENT[profile.key];
  if (!content) throw new Error(`unknown profile ${profile.key}`);

  const candidates = Object.fromEntries([...ROOM_ORDER, LIGHT_KEY].map((r) => [r, (roomRows?.[r] || []).map((row) => toItem(row, helpers))]));
  const heroSrc = profile.hero?.src;
  const intro = INTRO_IMAGES[profile.key];
  const sceneDefs = Object.entries(ROOM_SCENES[profile.key] || {});
  const [cur, hero, showroom, showroomDark, terminQr, materials, introImg, sceneImgs, lightSceneImg] = await Promise.all([
    curateRooms({ profile, candidates, loadImage }),
    heroSrc ? loadPublicImage(heroSrc) : null,
    loadPublicImage(SHOWROOM_IMAGE.src),
    loadPublicImage(SHOWROOM_DARK_IMAGE.src, { maxPx: 1600, quality: 76 }),
    qrPng(terminUrl(profile, { code, calendar }), 560),
    loadProfileMaterials(profile.key),
    intro ? loadPublicImage(intro.src, { maxPx: 1400, quality: 78 }) : null,
    Promise.all(sceneDefs.map(([, d]) => loadPublicImage(d.src, { maxPx: 1500, quality: 78 }))),
    loadPublicImage(LIGHT_SCENE.src, { maxPx: 1200, quality: 78 }),
  ]);
  const roomScenes = Object.fromEntries(sceneDefs.map(([r, d], i) => [r, sceneImgs[i] ? { img: sceneImgs[i], credit: d.credit, file: d.file } : null]).filter(([, v]) => v));
  const { rooms, extraLamp } = cur;
  const items = ROOM_ORDER.flatMap((r) => rooms[r]);
  const withImage = items.filter((it) => it.img).length;
  if (withImage < minImages) throw new ImageGateError(withImage, minImages);

  const all = extraLamp ? [...items, extraLamp] : items;
  const [qrs] = await Promise.all([Promise.all(all.map((it) => qrPng(it.url, 240).catch(() => null))), Promise.all(all.map(prepareForLayout))]);
  all.forEach((it, i) => {
    it.qr = qrs[i];
  });
  const tImages = Date.now() - t0;

  const { doc, pages, plan, combos, layout } = buildDocument({
    profile,
    content,
    customer,
    result,
    rooms,
    lamp: extraLamp,
    labs,
    delivery,
    dateLabel: dateLabel(now),
    facts: FACTS,
    qr: { termin: terminQr },
    links: {
      termin: terminUrl(profile, { code, calendar }),
      terminLabel: calendar ? "platzhirsch.studio/de/termin" : "platzhirsch.studio/de/beratung",
    },
    images: {
      hero,
      heroCredit: HERO_CREDITS[profile.key] || "Platzhirsch-Bildarchiv",
      showroom,
      showroomCredit: SHOWROOM_IMAGE.credit,
      showroomDark,
      showroomDarkCredit: SHOWROOM_DARK_IMAGE.credit,
      materials,
      materialCredit: MATERIAL_SOURCE,
      intro: introImg ? { img: introImg, credit: intro.credit, file: intro.file } : null,
      roomScenes,
      lightScene: lightSceneImg
        ? {
            img: lightSceneImg,
            credit: LIGHT_SCENE.credit,
            file: LIGHT_SCENE.file,
          }
        : null,
    },
  });
  const buffer = await renderToBuffer(doc);
  const ms = Date.now() - t0;
  if (buffer.length > BUDGET.maxPdfBytes) throw new Error(`pdf too large (${buffer.length} bytes)`);
  return {
    buffer,
    pages,
    bytes: buffer.length,
    ms,
    timings: {
      ...outerTimings,
      images: tImages,
      imagesTried: cur.tried,
      imageWaves: cur.waves,
      render: ms - tImages,
    },
    items: all.map(({ id, name, brand, url, img, category, room, page }) => ({
      id,
      name,
      brand,
      category,
      url,
      room: room || null,
      page: page || null,
      image: Boolean(img),
      cutout: Boolean(img?.cutout),
      coverage: img?.stats?.coverage ?? null,
      fill: img?.fill ?? null,
    })),
    // QA Runde 3, P1.1: archive files of the scenes (not printed in the PDF)
    imageFiles: layout.imageFiles,
    // room lead layout per room (tests, QA Runde 3, P2.1/2.2)
    leads: layout.leads,
    light: layout.light,
    // page plan and combination references (tests, QA Runde 2, P2.1)
    plan,
    combos: combos.map((c) => ({
      title: c.title,
      refs: c.items.map((it) => ({
        id: it.id,
        name: it.name,
        room: it.room,
        page: it.page,
      })),
    })),
  };
}

/** Pages in a PDF buffer (count of /Type /Page objects, not /Pages). */
export function countPdfPages(buffer) {
  const s = buffer.toString("latin1");
  return (s.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}
