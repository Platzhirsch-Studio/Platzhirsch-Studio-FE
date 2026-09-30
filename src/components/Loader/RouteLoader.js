"use client";

import { useEffect, useState } from "react";
import LoaderOverlay from "./LoaderOverlay";

// Shows the intro loader overlay ONCE per browser session (the first page the
// visitor loads), then never again on subsequent route changes. It renders on
// TOP of the already-server-rendered content, so it never removes the page body
// from the SSR HTML. Cleared automatically when the tab/session ends.
export default function RouteLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already shown in this session → don't show again on route changes.
    if (sessionStorage.getItem("ph_intro_shown")) return;

    sessionStorage.setItem("ph_intro_shown", "1");
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 2500); // match the fill animation
    return () => clearTimeout(t);
  }, []);

  return loading ? <LoaderOverlay /> : null;
}
