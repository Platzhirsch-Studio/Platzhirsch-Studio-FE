"use client";
// src/components/ShopStart/ShopNavCurrent.js
// Setzt aria-current in der Shop-Kopfleiste (ShopSubHeader) nach dem Pfad:
//   "page" auf dem Link der aktuellen Seite (exakt),
//   "true" auf dem Abteilungs-Chip, wenn die Seite eine seiner Kategorien
//   (data-shop-match, auch …/seite/<n>) ist.
// Optik-QA r3: scrollt den aktiven Chip in den sichtbaren Teil der wischbaren Abteilungszeile (iPhone 15:
// „Gläs…“ am rechten Rand) und setzt data-ueberlauf, solange rechts Einträge verborgen sind (nur dann die Maske).
// Rendert nichts; keine Texte, keine Daten im Bundle.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Neue scrollLeft-Position, damit [links, rechts] (relativ zum Inhalt) ganz sichtbar ist; null = schon sichtbar.
 * Rein (für Tests exportiert). rand: Luft zur Kante (Maske rechts ~40 px).
 */
export function scrollZiel({ links, rechts, scrollLeft, breite, rand = 40 }) {
  if (links >= scrollLeft && rechts <= scrollLeft + breite - rand) return null;
  return Math.max(0, Math.round(links - rand / 2));
}

/** Rechts noch Inhalt verborgen? (für die Ausblend-Maske; polster = Endabstand der Liste, pr-10, zählt nicht) */
export const ueberlauf = ({ scrollLeft, breite, gesamt, polster = 0 }) => gesamt - polster - breite - scrollLeft > 4;

/** Pfad ohne Locale-Präfix und Schluss-Schrägstrich. */
export function ohneLocale(pathname, locale) {
  const p = String(pathname || "/").replace(/\/+$/, "") || "/";
  return p === `/${locale}` ? "/" : p.startsWith(`/${locale}/`) ? p.slice(locale.length + 1) : p;
}

export default function ShopNavCurrent({ locale }) {
  const pathname = usePathname();
  useEffect(() => {
    const path = ohneLocale(pathname, locale);
    for (const a of document.querySelectorAll("[data-shop-nav] a[data-shop-path]")) {
      const own = a.getAttribute("data-shop-path");
      const match = (a.getAttribute("data-shop-match") || "").split(" ").filter(Boolean);
      if (own === path) a.setAttribute("aria-current", "page");
      else if (match.some((m) => path === m || path.startsWith(`${m}/`))) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
    const sc = document.querySelector("[data-shop-nav] [data-shop-abteilungen]");
    if (!sc) return undefined;
    const aktiv = sc.querySelector("a[aria-current]");
    if (aktiv) {
      const r = aktiv.getBoundingClientRect();
      const links = r.left - sc.getBoundingClientRect().left + sc.scrollLeft;
      const ziel = scrollZiel({ links, rechts: links + r.width, scrollLeft: sc.scrollLeft, breite: sc.clientWidth });
      if (ziel != null) sc.scrollLeft = ziel; // ohne Animation, ohne die Seite zu scrollen
    }
    const markiere = () => {
      const polster = parseFloat(getComputedStyle(sc.firstElementChild || sc).paddingRight) || 0;
      if (ueberlauf({ scrollLeft: sc.scrollLeft, breite: sc.clientWidth, gesamt: sc.scrollWidth, polster })) sc.setAttribute("data-ueberlauf", "");
      else sc.removeAttribute("data-ueberlauf");
    };
    markiere();
    sc.addEventListener("scroll", markiere, { passive: true });
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(markiere) : null;
    ro?.observe(sc);
    return () => {
      sc.removeEventListener("scroll", markiere);
      ro?.disconnect();
    };
  }, [pathname, locale]);
  return null;
}
