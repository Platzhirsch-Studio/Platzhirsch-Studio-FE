// Share card of /<locale>/outdoor-gartenplanung: typographic, no photo (rights rule in src/lib/seo/pageMetadata.js, OG_CARDS).
// landing-kern (01.11.2026): DE wie bisher, EN/FR/IT aus src/lib/content/landingKern (alt bleibt deutsch, statischer Export).
import { ogCardAlt } from "@/lib/seo/ogCard";
import { kernOgImage } from "@/lib/content/landingKern/ogImage";

export const alt = ogCardAlt("/outdoor-gartenplanung");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default kernOgImage("/outdoor-gartenplanung");
