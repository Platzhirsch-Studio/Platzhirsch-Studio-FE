import { notFound } from "next/navigation";

// Catch-all for any unknown route under a locale (e.g. /de/old/removed/link).
//
// F5 (Runde 1, 404 mit lang + Server-Rendering): no params are generated and
// dynamicParams is false, so Next answers every such URL with the prerendered
// 404 page (src/app/not-found.js: <html lang="de">, house fonts, links to the
// EN/FR/IT homepages, full server-rendered HTML, status 404). Before, the
// on-demand render called notFound() and Next 16 sent an empty shell
// <html id="__next_error__"> (no lang, content only after JavaScript) –
// reproduced in a minimal app with next 16.3.8, 16.4.1 and 16.4.3.
// The function body stays as a safety net (never reached).
export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function CatchAllNotFound() {
  notFound();
}
