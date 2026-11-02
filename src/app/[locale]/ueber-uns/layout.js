import { ZOOM_SAFE_TEXT } from "@/components/UberUns/zoomSafe";

// QM wm-fix4: one wrapper for all Über-uns pages (Platzhirsch, Team, Partner,
// Presse, Karriere, Marken) – display headings stay inside a phone screen at
// 200 % text size (see components/UberUns/zoomSafe.js). No markup otherwise.
export default function UeberUnsLayout({ children }) {
  return <div className={ZOOM_SAFE_TEXT}>{children}</div>;
}
