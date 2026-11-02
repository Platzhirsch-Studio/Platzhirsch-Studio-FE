// src/components/UberUns/zoomSafe.js – rein, ohne Importe (node:test).
// QM wm-fix4 (WCAG 1.4.4/1.4.10, iphone-15 at 200 % text size): Bodoni
// display headings grew to 64–96 px on a 393 px phone and were cut mid-word
// („in Locha|u“, „Designermö|“, „Platzhir|sch“), and a long body word ran
// 2 px past the edge. Wrapper classes for the areas Über uns and Produkte:
// - below 640 px the display roles are capped at a share of the viewport
//   width – at normal text size the cap lies above the role size from
//   320 px on (display-xl ≈ 48 px vs. 14vw, display-l 40 px vs. 12.5vw,
//   display-m 32–34 px vs. 11vw), so nothing changes there;
// - overflow-wrap: break-word as the last resort (inherited), it only acts
//   on a word that does not fit its line at all.
// The token values themselves stay in globals.css (shell-home).
// QM wm-r4 (desktop + phones at 200 % text size): the wrapper is also the
// size container "page". Container queries in rem follow the root font size
// (media queries do not), so `@5xl/page:` (64 rem = 1024 px at 100 %) acts as
// the lg breakpoint but reflows to one column when the text is doubled
// (WCAG 1.4.10). container-type: inline-size does not trap position:fixed
// children (checked in Chromium, WebKit and Firefox) – dialogs keep working.
export const PAGE_CONTAINER = "@container/page";
export const ZOOM_SAFE_TEXT = [
  PAGE_CONTAINER,
  "wrap-break-word",
  "max-sm:[&_.text-display-xl]:text-[length:min(var(--text-display-xl),14vw)]",
  "max-sm:[&_.text-display-l]:text-[length:min(var(--text-display-l),12.5vw)]",
  "max-sm:[&_.text-display-m]:text-[length:min(var(--text-display-m),11vw)]",
].join(" ");
