"use client";
// Manufacturer image of a ProductTile with a loading state: a quiet shimmer
// (yacht.module.css .skeleton) until the image has loaded, so tiles never
// stand as empty white frames while scrolling (QA round 2, P2.4). The image
// itself is never hidden (works without JS) and shown unchanged (no filter, no overlay – Minotti condition).
// Loading (QA round 2 fix 2, P2.3): native lazy loading starts too late in
// WebKit, so an IntersectionObserver with a 1200 px margin switches the image
// to eager well before it scrolls in. `eager` for the first tiles of a row.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./yacht.module.css";

export default function TileImage({ src, alt, sizes, className = "", eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [near, setNear] = useState(eager);
  const ref = useRef(null);
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setNear(true);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        setNear(true);
      }
    }, { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return (
    <>
      <span ref={ref} aria-hidden="true" className={`absolute inset-0 ${loaded ? "" : styles.skeleton}`} />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={near ? "eager" : "lazy"}
        // deferred: next/image may report a cached image while the tile is still mounting
        onLoad={() => requestAnimationFrame(() => setLoaded(true))}
        className={className}
        data-pin-nopin="true" // Custom-Line-Bild: nicht für Pinterest (QA Recht Pinterest P2-4)
      />
    </>
  );
}
