"use client";

import dynamic from "next/dynamic";

// Tempo (Startseite, Lighthouse mobil, 30.10.2026): the sketch slot of the
// USP chapter (Process.js) with its "Zum Ideenboard" island (IdeenboardAdd +
// clientStore + model + pinterest rights, ~4.4 KB gzip, ~11 KB raw).
// Imported statically by the server component Process, Turbopack put these
// client modules into the page chunk of /de, which Lighthouse counts before
// the LCP – although in phase A (media.js empty) the slot is never rendered.
// next/dynamic on the server component did not split them (checked on the
// dev server: still in the page chunk). A client boundary with next/dynamic
// does (Next docs lazy-loading: code splitting works for Client Components):
// the chunk loads only when the slot is rendered. ssr stays on, so with a
// sketch the figure, credit line and both save actions are in the server
// HTML as before (crawlers, no layout shift). ImageSlot is server-safe (no
// "use client", not async) and takes plain props, so it renders here too.
const ImageSlot = dynamic(() => import("@/components/Arbeitsweise/ImageSlot"));

export default function ProcessSketch(props) {
  return <ImageSlot {...props} />;
}
