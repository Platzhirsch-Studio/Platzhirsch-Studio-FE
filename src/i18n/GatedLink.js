"use client";
// next-intl <Link> with the prefetch gate of src/lib/prefetchGate.js
// (Tempo fix2): same props, same href/locale handling, same markup; viewport
// and hover prefetches only start once the first paint has settled or the
// visitor shows intent. An explicit prefetch={false} stays false.
import { createNavigation } from "next-intl/navigation";
import { routing } from "./config";
import { gatedPrefetch, usePrefetchOpen } from "@/lib/prefetchGate";

const { Link: IntlLink } = createNavigation(routing);

export default function Link({ prefetch, ...props }) {
  const isOpen = usePrefetchOpen();
  return <IntlLink {...props} prefetch={gatedPrefetch(isOpen, prefetch)} />;
}
