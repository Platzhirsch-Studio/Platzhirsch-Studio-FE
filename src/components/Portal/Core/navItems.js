// The ONE portal navigation (desktop tab row + mobile bottom bar with "Mehr"
// sheet). Every portal area is reachable from every page; there is no second
// sub-navigation any more.
//
// key: Schlüssel unter Portal.nav.* (messages-r5-portal.json); label bleibt der DE-Fallback.
// primary: true -> visible in the mobile bottom bar; the rest lives in "Mehr".
import { tx } from "../../../lib/portal/i18n.js";

export const PORTAL_NAV = [
  { href: "/de/portal", key: "overview", label: "Übersicht", icon: "home", exact: true, primary: true },
  { href: "/de/portal/projekte", key: "projects", label: "Projekte", icon: "projects", primary: true },
  // N2 Raumzwilling (Integration 28.10.2026): Ihr Raum als 3D-Modell mit Kommentaren.
  { href: "/de/portal/raum", key: "room", label: "Ihr Raum", icon: "room" },
  { href: "/de/portal/dokumente", key: "documents", label: "Dokumente", icon: "documents", primary: true },
  { href: "/de/portal/termine", key: "appointments", label: "Termine", icon: "calendar", primary: true },
  { href: "/de/portal/nachrichten", key: "messages", label: "Nachrichten", icon: "messages" },
  { href: "/de/portal/pass", key: "pass", label: "Produktpass", icon: "pass" },
  { href: "/de/portal/gewerke", key: "trades", label: "Gewerke", icon: "trades" },
  // Service Nr. 4 (Integration 29.10.2026): Meine Stücke & Pflege.
  { href: "/de/portal/pflege", key: "care", label: "Pflege", icon: "care" },
  // Kundenkarte (04.11.2026): Stufe, Vorteile, Wallet (in Vorbereitung).
  { href: "/de/portal/kundenkarte", key: "card", label: "Kundenkarte", icon: "card" },
];

/** Call to action, shown as a button right of the desktop tabs and in "Mehr". */
export const PORTAL_CTA = { href: "/de/portal/anfragen", key: "newPlan", label: "Neue Planung", icon: "plan" };

/** Beschriftung über Portal.nav.<key> (R5), Fallback der DE-Text `label`. */
export function navLabel(t, item) {
  return tx(t, `Portal.nav.${item.key}`, item.label);
}

export function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
