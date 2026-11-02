"use client";
// Outbound link to the Google review form. Fires the GA4 event `review_click`
// (no-op without analytics consent, see src/lib/analytics.js).
import { trackEvent } from "@/lib/analytics";

export default function ReviewLink({ href, className, children, ...rest }) {
  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("review_click", { platform: "google", page_path: "/de/bewerten" })}
    >
      {children}
    </a>
  );
}
