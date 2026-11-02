// Gleiches Share-Bild für X/Twitter wie ./opengraph-image.js, damit dort nicht
// das Standardbild aus dem Layout erscheint.
import OgImage from "./opengraph-image";
import { EVENT, TITLE } from "./event";
import { SITE_NAME } from "@/lib/site";

export const alt = `${TITLE} bei ${SITE_NAME} in Lochau, ${EVENT.dateLabel}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image(props) {
  return OgImage(props);
}
