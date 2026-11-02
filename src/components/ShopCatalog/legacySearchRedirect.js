"use client";
// Runde 2 (technik P2-1): the /produkte hub is static again, so it cannot read
// ?q= on the server. Old links and the navbar Enter (Navbar/SearchSheet.js:
// "/de/produkte?q=…") are forwarded here to the search page /produkte/suche.
// Renders nothing; without JavaScript the hub simply shows its categories.
import { useEffect } from "react";
import { productsPath } from "@/utils/routing";

export default function LegacySearchRedirect({ locale = "de" }) {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q && q.trim()) {
        window.location.replace(`/${locale}${productsPath(locale)}/suche?q=${encodeURIComponent(q.trim())}`);
      }
    } catch {
      /* no redirect – the hub stays usable */
    }
  }, [locale]);
  return null;
}
