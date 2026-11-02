"use client";
// Web Vitals → GA4 "web_vitals" (Masterplan AP3 Nr. 8), with the built-in
// next/web-vitals hook (no npm package; docs:
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-report-web-vitals.md).
// reportWebVitals() sends only with statistics consent. The callback is a
// module constant, so the hook never reports a metric twice.
// Mounted once by CartProvider (the one client provider on every page; the
// layout files belong to the shell package). The effect also re-runs
// captureAttribution() as a safety net in case instrumentation-client.js
// did not run (it is idempotent: the first URL of the visit wins).
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

export default function WebVitals() {
  useReportWebVitals(reportWebVitals);
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
