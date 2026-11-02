// src/instrumentation-client.js
// Runs once per page load, after the HTML and before hydration
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
// Masterplan AP3 Nr. 2: the Herkunft of the visit is read here from the very
// first URL (utm_*, referrer host, landing path, click ids) instead of a
// useSearchParams() in the layout. Without Google-Ads consent it stays in
// memory; with it, src/lib/attribution.js keeps "ph_attr" in localStorage.
// Web Vitals: src/context/WebVitals.js (useReportWebVitals needs a component).
// Synchronous, no network, well below the 16 ms budget; never throws.
import { captureAttribution } from "./lib/attribution";

try {
  captureAttribution(window);
} catch {
  /* attribution must never break the page */
}
