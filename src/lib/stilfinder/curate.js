// src/lib/stilfinder/curate.js
// Curation shared by the Moodboard PDF (build.js) and the web moodboard on the
// result page (components/Labs/Stilfinder/catalog.js), so both show the same
// pieces (QA Runde 2, P2.7). Free of @react-pdf, so the result page can import
// it. No "@/..." imports: tested with node --test.
//
//   - every candidate image is analysed (imageStats.js); empty/flat images and
//     (for non-curated pieces) off-palette colours are replaced by the next
//     candidate of the same room, in up to three waves inside the deadline;
//   - room heroes are main pieces by category AND name (QA Runde 2, P1.1 c),
//     accessories max. one per room, never first;
//   - one piece per product family in the whole document (QA Runde 2, P1.2).
import { generateSlug } from "../slugify.js";
import { BUDGET, PROTECTED_BRANDS, SITE_ORIGIN } from "./config.js";
import { ROOM_ORDER } from "./content.js";
import { loadAll } from "./images.js";
import { rejectReason } from "./imageStats.js";
import { CURATOR_PICKS, LIGHT_KEY, MAX_PER_BRAND, PER_ROOM, SMALL_IN_SCENE, familyKey, fitsVisible, isHeroFor, lightFits, seqRank } from "./rooms.js";

// QA Runde 3, P2.2: a cut-out that covers less than this share of its own
// picture is a white piece on white (Mac – Outdoor: 5 %) and reads as empty.
export const MIN_CUTOUT_COVERAGE = 0.08;
// pieces a room should show at least (hero + two), see brandMax in curateRooms
export const MIN_PIECES = 3;

// Abnahme Runde 3, Restliste 1 (Teil von P2.3): in a room scene these pieces
// are a corner of the picture (Bow Coffee Table at the fireplace, Superquadra
// at the stone wall, Joséphine behind a blue armchair). The coverage of one
// piece inside a scene cannot be measured, so the rule is by category: as a
// selection picture they need a cut-out. curateRooms first looks for a
// cut-out among the product's further catalogue pictures (same file family,
// up to SCENE_ALT_TRIES); without one the piece is skipped – unless a
// curator picked it by eye, then the scene stays (checked on the contact sheet).
export const SCENE_DETAIL = ["coffee-tables", "side-tables", "night-tables", "sideboards-chests", "display-cabinets", "bar-stools", "lamps", "small-furniture", "tv-low-units"];
export const SCENE_ALT_TRIES = 3;
export const needsCutout = (category) => SCENE_DETAIL.includes(category) || SMALL_IN_SCENE.includes(category);

/**
 * Further pictures of the same product (catalogue rows carry up to ~60, some
 * of them of other products: "vase-10.jpg" under Bow Coffee Table). Only files
 * of the same family as the first picture count: same name without the
 * running number, compared on the first three words ("bow-coffee-table",
 * "101-copenhagen-drop", "minotti-superquadra").
 */
export function altImages(row, max = 6) {
  const list = (row?.bild_anhangen || []).map((b) => b?.bild_anhangen || "").filter((p) => p.startsWith("/files/"));
  if (list.length < 2) return [];
  const stem = (p) =>
    p
      .split("/")
      .pop()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_ ]\d+$/, "")
      .toLowerCase();
  const key = stem(list[0])
    .split(/[-_ ]+/)
    .slice(0, 3)
    .join("-");
  return list
    .slice(1)
    .filter((p) =>
      stem(p)
        .split(/[-_ ]+/)
        .join("-")
        .startsWith(key),
    )
    .slice(0, max)
    .map((p) => `/cmx${p}`);
}

export const CATEGORY_LABELS = {
  "sofas-couches": "Sofa",
  "armchairs-stools": "Sessel und Hocker",
  "coffee-tables": "Couchtisch",
  "side-tables": "Beistelltisch",
  rugs: "Teppich",
  lamps: "Leuchte",
  "dining-tables": "Esstisch",
  "dining-chairs": "Stuhl",
  "sideboards-chests": "Sideboard",
  "display-cabinets": "Vitrine",
  shelves: "Regal",
  "tv-low-units": "Lowboard",
  kitchen: "Küche",
  "kitchen-accessories": "Küchenzubehör",
  "bar-stools": "Barhocker",
  decor: "Accessoire",
  candles: "Kerze und Duft",
  beds: "Bett",
  "night-tables": "Nachttisch",
  bedwear: "Bettwäsche",
  wardrobes: "Schrank",
  mirrors: "Spiegel",
  "small-furniture": "Kleinmöbel",
  "lounge-furniture-daybeds": "Lounge",
  "garden-tables": "Gartentisch",
  "garden-chairs": "Gartenstuhl",
  "sun-loungers": "Liege",
  parasols: "Sonnenschirm",
  "chaise-longues-daybeds": "Chaiselongue",
};

const identity = (x) => x;

/** Straight or English quotes in product names → German „…“ (QA P2.7). */
export function typoQuotes(name) {
  return String(name ?? "")
    .replace(/["“”]([^"“”]+)["“”]/g, "„$1“")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Backoffice row → item (no image yet). */
export function toItem(row, { cleanName = identity, brandName = identity } = {}) {
  const category = String(row.kategories || "").toLowerCase();
  const firstRow = row.bild_anhangen?.[0] || {};
  const first = firstRow.bild_anhangen || "";
  const brand = brandName(row.marken);
  const name = typoQuotes(cleanName(row.produkt_name));
  const path = `/de/produkte/${generateSlug(category)}/${row.path_field}`;
  return {
    id: row.name,
    name,
    brand,
    family: familyKey(brand, name),
    category,
    categoryLabel: CATEGORY_LABELS[category] || "Einrichtung",
    cmx: first.startsWith("/files/") ? `/cmx${first}` : null,
    alt: firstRow.alt_text || `${brand} ${name}`,
    slug: row.path_field,
    href: path,
    url: `${SITE_ORIGIN}${path}`,
    alts: altImages(row),
    protected: PROTECTED_BRANDS.includes(String(row.marken || "").trim()) || PROTECTED_BRANDS.includes(brand),
  };
}

/**
 * curateRooms → { rooms: {room: [item]}, extraLamp, tried, waves }
 * Loads candidate images in waves and keeps the first PER_ROOM good ones per
 * room (hero first, max. one accessory, one piece per family).
 */
export async function curateRooms({ profile, candidates, loadImage, deadlineMs = BUDGET.imagesMs, now = () => Date.now(), lamp: wantLamp = true }) {
  const start = now();
  const curated = new Set(Object.values(CURATOR_PICKS[profile.key] || {}).flat());
  const palette = profile.palette;
  const state = Object.fromEntries(ROOM_ORDER.map((r) => [r, { queue: [...(candidates[r] || [])], ok: [], next: 0 }]));
  const check = (it, room, lenient = false) => {
    if (!it.img) return false;
    // QA Runde 3, P2.3: small pieces only as cut-out (in a scene they are a corner)
    if (!it.img.cutout && SMALL_IN_SCENE.includes(it.category)) return false;
    // Abnahme Runde 3, Restliste 1: a detail piece only as cut-out (a
    // further catalogue picture, see loadFor) – a curator pick keeps its scene
    if (!lenient && room !== null && !it.img.cutout && SCENE_DETAIL.includes(it.category) && !curated.has(it.id)) return false;
    if (it.img.cutout && (it.img.stats?.coverage ?? 1) < MIN_CUTOUT_COVERAGE) return false;
    // Curated pieces were checked by eye: only the technical checks apply –
    // except outdoor, where the colour check runs for every piece (P2.5).
    return !rejectReason(it.img.stats, curated.has(it.id) && room !== "outdoor" ? null : palette);
  };
  // first picture; for a detail piece in a scene a cut-out among the further
  // pictures of the same product (Abnahme Runde 3, Restliste 1)
  const loadFor = async (it, r) => {
    if (!it.cmx || !loadImage) return null;
    const img = await loadImage(it.cmx);
    if (!img || img.cutout || r === null || !needsCutout(it.category)) return img;
    for (const alt of (it.alts || []).slice(0, SCENE_ALT_TRIES)) {
      const a = await Promise.resolve(loadImage(alt)).catch(() => null);
      if (a?.cutout && (a.stats?.coverage ?? 0) >= MIN_CUTOUT_COVERAGE) return { ...a, alt };
    }
    return img;
  };
  const usedIds = new Set();
  const usedFamilies = new Set();
  const famOf = (it) => it.family || familyKey(it.brand, it.name);
  const taken = (it) => usedIds.has(it.id) || usedFamilies.has(famOf(it));
  let tried = 0;
  let waves = 0;
  // spare lamps first (QA Runde 3, P2.4), then lamps the rooms did not need
  const lampQueue = () => [...(candidates[LIGHT_KEY] || []), ...ROOM_ORDER.flatMap((r) => state[r].queue)];
  // Feinschliff P3.1: lamps that fit the light text of the profile first
  // (stable sort, so the order of rooms.js stays inside both groups)
  const pickLamps = (n) =>
    lampQueue()
      .filter((it) => it.category === "lamps" && !taken(it) && !it.tried)
      .sort((a, b) => Number(lightFits(profile.key, b)) - Number(lightFits(profile.key, a)))
      .slice(0, n);
  let lamp = null;
  const hasHero = (r) => state[r].ok.some((it) => isHeroFor(r, it.category, it.name));

  const need = (r) => Math.max(0, PER_ROOM - state[r].ok.length) + (hasHero(r) ? 0 : 1);

  // Abnahme Runde 3, Restliste 2: a room that still has fewer than
  // MIN_PIECES after two waves may take a third piece of one brand (the
  // Pariser Salon dines with Eichholtz) – better than an empty slot
  const brandMax = Object.fromEntries(ROOM_ORDER.map((r) => [r, MAX_PER_BRAND]));
  // QA Runde 3: four waves (the category/brand rules need more replacements)
  const relax = () => {
    let changed = false;
    for (const r of ROOM_ORDER)
      if (state[r].ok.length < MIN_PIECES && brandMax[r] === MAX_PER_BRAND) {
        brandMax[r] = MAX_PER_BRAND + 1;
        changed = true;
      }
    return changed;
  };
  while (waves < 4) {
    if (waves >= 2) relax();
    const batch = [];
    const plan = () => {
      for (const r of ROOM_ORDER) {
        const s = state[r];
        let n = waves === 0 ? PER_ROOM : need(r);
        // QA Runde 3, P2.3: only candidates that fit the room so far (one per
        // category, two per brand) – no load is wasted on a second sofa
        const planned = [...s.ok];
        for (const it of s.queue) {
          if (n <= 0 || planned.length >= PER_ROOM + 1) break;
          if (it.tried || taken(it) || !fitsVisible(planned, it, brandMax[r])) continue;
          batch.push({ r, it });
          planned.push(it);
          n--;
        }
      }
    };
    plan();
    // nothing left under the normal rules: relax once and plan again
    if (!batch.length && relax()) plan();
    if (wantLamp && !lamp) {
      for (const it of pickLamps(waves === 0 ? 2 : 3)) if (!batch.some((b) => b.it === it)) batch.push({ r: null, it, lamp: true });
    }
    if (!batch.length) break;
    const left = deadlineMs - (now() - start);
    if (left <= 150) break;
    const imgs = await loadAll(
      batch.map(
        ({ it, r }) =>
          () =>
            loadFor(it, r),
      ),
      { deadlineMs: left },
    );
    waves++;
    batch.forEach(({ r, it, lamp: isLamp }, i) => {
      it.tried = true;
      tried++;
      it.img = imgs[i];
      if (!check(it, r)) {
        // a detail piece that exists only as a scene is kept aside as the last resort
        if (r && it.img && !it.img.cutout && SCENE_DETAIL.includes(it.category) && check(it, r, true)) it.detailScene = it.img;
        it.img = null;
        return;
      }
      if (it.img.alt) it.shown = it.img.alt;
      // QA Runde 3, P2.3: one per category, max. two per brand (hero counts)
      if (r && !taken(it) && fitsVisible(state[r].ok, it, brandMax[r])) {
        state[r].ok.push(it);
        usedIds.add(it.id);
        usedFamilies.add(famOf(it));
      } else if (isLamp && !lamp && !taken(it)) {
        lamp = it;
        usedIds.add(it.id);
        usedFamilies.add(famOf(it));
      }
    });
    if (ROOM_ORDER.every((r) => need(r) === 0) && (lamp || !wantLamp || !pickLamps(1).length)) break;
  }

  // last resort (Abnahme Runde 3, Restliste 1/2): a room that still shows
  // fewer than MIN_PIECES takes a detail piece in its scene – also keeps the
  // Bild-Tor (IMAGE_GATE) out of reach when a brand has no cut-outs
  for (const r of ROOM_ORDER) {
    const s = state[r];
    for (const it of s.queue) {
      if (s.ok.length >= MIN_PIECES) break;
      if (!it.detailScene || taken(it) || !fitsVisible(s.ok, it, brandMax[r])) continue;
      it.img = it.detailScene;
      it.lastResort = true;
      s.ok.push(it);
      usedIds.add(it.id);
      usedFamilies.add(famOf(it));
    }
  }

  const rooms = {};
  for (const r of ROOM_ORDER) {
    const ok = state[r].ok;
    const heroIdx = ok.findIndex((it) => isHeroFor(r, it.category, it.name));
    // no fitting hero: the room still opens with a main piece, never an
    // accessory (a foot never got this far: FILLER_NAME)
    const ordered = heroIdx > 0 ? [ok[heroIdx], ...ok.filter((_, i) => i !== heroIdx)] : [...ok];
    const out = [];
    for (const it of ordered) {
      if (out.length >= PER_ROOM) break;
      if (fitsVisible(out, it, brandMax[r])) out.push(it);
    }
    // bedroom: bed → night table → lamp/mirror → wardrobe (P2.3)
    const [head, ...rest] = out;
    rest.sort((a, b) => seqRank(r, a.category) - seqRank(r, b.category));
    rooms[r] = head ? [head, ...rest] : [];
  }
  const inRooms = new Set(
    Object.values(rooms)
      .flat()
      .map((it) => it.id),
  );
  const roomFamilies = new Set(Object.values(rooms).flat().map(famOf));
  const extraLamp = lamp?.img && !inRooms.has(lamp.id) && !roomFamilies.has(famOf(lamp)) ? lamp : null;
  return { rooms, extraLamp, tried, waves };
}

// Large web tiles (QA Runde 2, P2.7): scenes, or cut-outs that fill at least
// a quarter of the picture – a tiny top view in the biggest tile looks empty.
export const BIG_TILE_MIN_COVERAGE = 0.25;
const bigOk = (it) => it?.img && (!it.img.cutout || (it.img.stats?.coverage ?? 0) >= BIG_TILE_MIN_COVERAGE);

/**
 * boardItems(rooms, n) → up to n items for the web moodboard, in tile order:
 * index 0 = 2×2 tile, index 5 = 2×1 tile. Same pieces as the PDF: the room
 * heroes first, then the next pieces of each room.
 */
// QA Runde 3, P2.6: the big tile carries the mood of the profile – a room
// scene, living and sleeping first, the kitchen (often a light, neutral
// manufacturer kitchen) only as the last resort.
export const BIG_TILE_ROOMS = ["wohnen", "schlafen", "essen", "outdoor", "kueche"];
const isScene = (it) => it?.img && !it.img.cutout && !it.protected;

/**
 * boardItems(rooms, n) → up to n + 1 items for the web moodboard, each with
 * `tile`: "big" (2×2), "wide" (2×1) or "square". Same pieces as the PDF.
 * The wide tile only takes a landscape scene (a cut-out sofa covered ~10 %
 * of it); without one it becomes two squares, so the grid stays closed
 * (4 + 2 + 6 = 4 + 8 = 12 cells).
 */
export function boardItems(rooms, n = 8) {
  const pool = [];
  const maxLen = Math.max(0, ...ROOM_ORDER.map((r) => (rooms[r] || []).length));
  for (let i = 0; i < maxLen; i++) for (const r of ROOM_ORDER) if (rooms[r]?.[i]?.img) pool.push({ it: rooms[r][i], r, i });
  const take = (pred) => {
    const k = pool.findIndex(pred);
    return k < 0 ? null : pool.splice(k, 1)[0].it;
  };
  let big = null;
  for (const r of BIG_TILE_ROOMS) {
    big = take((p) => p.r === r && p.i === 0 && isScene(p.it));
    if (big) break;
  }
  big ||= take((p) => p.r !== "kueche" && isScene(p.it)) || take((p) => isScene(p.it)) || take((p) => bigOk(p.it));
  const wide = take((p) => isScene(p.it) && p.it.img.width > p.it.img.height * 1.2);
  const squares = wide ? 6 : 8;
  const rest = pool.slice(0, squares).map((p) => ({ ...p.it, tile: "square" }));
  const out = big ? [{ ...big, tile: "big" }] : [];
  out.push(...rest.slice(0, 4));
  if (wide) out.push({ ...wide, tile: "wide" });
  out.push(...rest.slice(4));
  return out.slice(0, n + 1);
}
