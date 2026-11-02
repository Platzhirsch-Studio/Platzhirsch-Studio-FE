// src/components/Katalog/shopCrumbs.js
// Klassen für <Breadcrumbs> auf Shop-Seiten (ui/Breadcrumbs.js ist gemeinsame Datei,
// daher nur von außen über className). Optik-QA r1: auf Telefonen brach der Pfad auf
// 2–3 Zeilen um, jede Folgezeile begann mit einem verwaisten „/“ (≈ 150 px über dem Bild).
// Unter sm deshalb nur der übergeordnete Schritt als „← Duftkerze“ (eine Zeile, 44-px-Ziel);
// ab sm der volle Pfad. JSON-LD (BreadcrumbList) bleibt vollständig. Rein, ohne Importe.
export const SHOP_CRUMBS =
  "[&_a]:min-h-11 max-sm:[&_li]:hidden max-sm:[&_li:nth-last-child(2)]:flex max-sm:[&_li:nth-last-child(2)>span:first-child]:hidden max-sm:[&_li:nth-last-child(2)_a]:before:mr-1.5 max-sm:[&_li:nth-last-child(2)_a]:before:content-['←']";
