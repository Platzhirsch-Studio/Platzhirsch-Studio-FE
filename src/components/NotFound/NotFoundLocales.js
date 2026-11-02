"use client";
// Globale 404 in allen vier Sprachen (R3 technik P2-4).
//
// src/app/not-found.js darf keine Anfragedaten lesen (sonst wird die ganze Seite
// dynamisch, R4-release). Im Produktions-Build landen aber alle unbekannten Pfade
// hier, auch /en/…, /fr/… und /it/… (dynamicParams=false in [locale]/[...rest]).
// Deshalb steht der Inhalt in allen vier Sprachen im Server-HTML, jeder Block mit
// eigenem lang. Ein kleines Skript am Anfang von <body> setzt vor dem ersten Bild
// html[lang] und html[data-nf] aus dem ersten Pfadsegment; CSS in globals.css
// zeigt dann nur den passenden Block (ohne JS: Deutsch). Nach der Hydration bleibt
// nur der passende Block im DOM (eine H1).
//
// Tempo & A11y (Konsolidierung): die Blöcke rendert der Server
// (NotFoundBody, src/app/not-found.js) und reicht sie als `blocks` herein. Diese
// Insel wählt nur noch aus. Die globale 404 steckt als Grenze des Root-Layouts
// im RSC-Payload JEDER Seite; vorher lud deshalb jede Seite den Chunk mit
// Seitentext, Links, Icons und next-intl-Provider (≈ 8 KB gzip).
import { useSyncExternalStore } from "react";

export const NF_LOCALES = ["de", "en", "fr", "it"];

/** Sprache aus dem ersten Pfadsegment, sonst Deutsch. */
export function localeFromPath(pathname) {
  const seg = String(pathname || "").split("/")[1] || "";
  return NF_LOCALES.includes(seg) ? seg : "de";
}

const noSubscribe = () => () => {};
const clientLocale = () => localeFromPath(window.location.pathname);
const serverLocale = () => null;

/** @param {{ blocks: Record<string, import("react").ReactNode> }} props */
export default function NotFoundLocales({ blocks }) {
  // Server und Hydration: alle vier Blöcke; danach nur der passende
  const active = useSyncExternalStore(noSubscribe, clientLocale, serverLocale);
  const list = active ? [active] : NF_LOCALES;
  return list.map((locale) => (
    <div key={locale} lang={locale} data-nf-block={locale}>
      {blocks?.[locale] ?? null}
    </div>
  ));
}
