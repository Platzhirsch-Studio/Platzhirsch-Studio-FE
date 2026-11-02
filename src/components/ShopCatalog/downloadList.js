"use client";
import { FileText } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// Manufacturer documents of the "Atelier" page (R4-produkt, masterplan AP4):
// only links to the backoffice files through the /cmx proxy – nothing is
// copied or hosted here. A click reports GA4 `file_download` (masterplan 4.5;
// no-op without consent, see src/lib/analytics.js).
// `downloads` = [{ href, label, fileName }], `product` = "Marke Modell".
export default function DownloadList({ downloads, product, newTabLabel }) {
  if (!downloads?.length) return null;
  return (
    <ul className="mt-6 border-t border-line">
      {downloads.map((d) => (
        <li key={d.href} className="border-b border-line">
          <a
            href={d.href}
            target="_blank"
            rel="noopener"
            onClick={() =>
              trackEvent("file_download", {
                file_name: d.fileName,
                file_extension: "pdf",
                link_url: d.href,
                link_text: d.label,
                item_name: product,
              })
            }
            className="flex min-h-14 items-center gap-3 py-2 text-ui text-text underline decoration-transparent underline-offset-4 hover:decoration-current"
          >
            <FileText aria-hidden="true" className="size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
            <span>
              {d.label}
              {newTabLabel && <span className="sr-only"> ({newTabLabel})</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
