"use client";
// Binds Embla to an already rendered carousel viewport and reports the API.
// Loaded with next/dynamic (ssr: false) only when the carousel comes near the
// screen (NavettaCarousel), so Embla (≈ 7 KB gzip) is not in the page's first
// bundle and never runs before the LCP. Renders nothing: the slides, buttons
// and counter stay server-rendered markup of the carousel itself.
import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

/**
 * @param {{ viewport: { current: HTMLElement | null }, options?: object, onApi: (api: object | undefined) => void }} props
 */
export default function EmblaBinder({ viewport, options, onApi }) {
  const [ref, api] = useEmblaCarousel(options);
  useEffect(() => {
    ref(viewport.current);
    return () => ref(null);
  }, [ref, viewport]);
  useEffect(() => {
    onApi(api);
  }, [api, onApi]);
  return null;
}
