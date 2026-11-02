import "server-only";
import { cleanProductName, displayBrandName } from "@/lib/content/brands";
import { PROFILES } from "./profiles";
import { ROOM_ORDER } from "@/lib/stilfinder/content";
import { roomCandidates } from "@/lib/stilfinder/rooms";
import { boardItems, curateRooms, toItem } from "@/lib/stilfinder/curate";
import { catalogFor, loadImage } from "@/lib/stilfinder/warm";

// Stil-Finder – web moodboard of the result page. QA Runde 2, P2.7: the same
// selection as the PDF (curator picks, room slots, filler and family rules,
// image and palette check in curate.js), so website and PDF show the same
// pieces. Read only: the catalogue comes from the backoffice (Frappe doctype
// "Produkte New", get_produkte_by_marke_api), images through the shared disk
// cache of the PDF. Only the fields the tiles need leave the server.

// The web board waits for the pictures at most this long (Suspense streams the
// rest of the page meanwhile); pieces whose image is not ready are skipped.
const WEB_DEADLINE_MS = 4_500;

const helpers = { cleanName: cleanProductName, brandName: displayBrandName };

function toTile(it) {
  return {
    id: it.id,
    name: it.name,
    brand: it.brand,
    categoryKey: it.category,
    // Abnahme Runde 3, Restliste 1: a detail piece may show a further
    // catalogue picture (its cut-out) instead of the first one (a scene)
    image: it.shown || it.cmx,
    alt: it.alt,
    url_slug: it.slug,
    href: it.href,
    // decided on the server from the image analysis (no canvas sniffing)
    cutout: Boolean(it.img?.cutout),
    protected: Boolean(it.protected),
    // QA Runde 3, P2.6: tile size decided with the same image analysis
    tile: it.tile || "square",
  };
}

/**
 * Moodboard for one profile. Returns { items, error }.
 * `error` is true when the backoffice could not be reached at all – the
 * result page then still shows palette, brands and CTAs.
 */
export async function loadMoodboard(profile, seed = 1) {
  const p = PROFILES[profile.key] || profile;
  const { byBrand } = await catalogFor(p.key);
  const rows = roomCandidates(p.key, byBrand, seed || 1);
  const candidates = Object.fromEntries(ROOM_ORDER.map((r) => [r, (rows[r] || []).map((row) => toItem(row, helpers))]));
  const { rooms } = await curateRooms({
    profile: p,
    candidates,
    loadImage,
    deadlineMs: WEB_DEADLINE_MS,
    lamp: false,
  });
  const items = boardItems(rooms, 8).map(toTile);
  return { items, error: items.length === 0 };
}
