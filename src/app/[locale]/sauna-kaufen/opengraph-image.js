// Share-Karte von /<locale>/sauna-kaufen: typografisch, kein Foto (OG_CARDS in src/lib/seo/pageMetadata.js).
// DE über ogCardImage, EN/FR/IT aus src/lib/content/landingKern (alt bleibt deutsch, statischer Export).
import { ogCardAlt } from "@/lib/seo/ogCard";
import { kernOgImage } from "@/lib/content/landingKern/ogImage";

export const alt = ogCardAlt("/sauna-kaufen");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default kernOgImage("/sauna-kaufen");
