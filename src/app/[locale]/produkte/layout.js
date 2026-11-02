import { ZOOM_SAFE_TEXT } from "@/components/UberUns/zoomSafe";

// QM wm-fix4: same 200 %-text-size guard as the Über-uns pages
// (components/UberUns/zoomSafe.js) for the catalogue hub, categories and products.
export default function ProdukteLayout({ children }) {
  return <div className={ZOOM_SAFE_TEXT}>{children}</div>;
}
