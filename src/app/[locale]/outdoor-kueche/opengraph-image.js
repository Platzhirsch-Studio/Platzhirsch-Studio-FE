// Share-Karte von /<locale>/outdoor-kueche: typografisch, kein Foto (Rechte-Regel in src/lib/seo/pageMetadata.js, OG_CARDS).
// DE aus OG_CARDS, EN/FR/IT aus src/lib/content/landingKern (alt bleibt deutsch, statischer Export).
import { ogCardAlt } from "@/lib/seo/ogCard";
import { kernOgImage } from "@/lib/content/landingKern/ogImage";

export const alt = ogCardAlt("/outdoor-kueche");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default kernOgImage("/outdoor-kueche");
