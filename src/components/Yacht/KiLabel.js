// Visible AI label on every concept image (AI Act Art. 50, Rechtspaket W11,
// Design-Bibel §7.7). Server-safe, no hooks. The IPTC/XMP entry
// "trainedAlgorithmicMedia" sits in the image files themselves.
// 02.11.2026: Blender renderings (renders.json kiGeneriert: false) are no AI
// images – with `ki={false}` the same badge shows the caption
// "Visualisierung (Rendering)" (ui.renderLabel) instead of the AI label.
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";

export default function KiLabel({ className = "", children, ki = true }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  if (ki === false) {
    return (
      <span data-render-label="" className={`inline-flex max-w-[calc(100%-1rem)] items-center bg-ink-deep/85 px-2 py-1 text-small leading-tight text-paper ${className}`}>
        <span className="min-w-0">{children || t.renderLabel}</span>
      </span>
    );
  }
  const text = children || t.kiLabel;
  // QM r4: das Kürzel („KI“) nur, wenn der Text es nicht schon enthält – sonst las sich das
  // Label doppelt („KI KI-generierte …“, EN „AI AI-generated …“).
  const kuerzel = typeof text === "string" && text.includes(t.ki) ? null : t.ki;
  return (
    <span
      data-ki-label=""
      // QM r4 (200 % Text): nie breiter als das Bild – der Text bricht (an Wortgrenzen bzw. am
      // weichen Trennstrich in „Konzept­visualisierung“) statt am Bildrand abgeschnitten zu werden.
      className={`inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 bg-ink-deep/85 px-2 py-1 text-small leading-tight text-paper ${className}`}
    >
      {kuerzel ? (
        <span aria-hidden="true" className="font-medium">
          {kuerzel}
        </span>
      ) : null}
      <span className="min-w-0">{text}</span>
    </span>
  );
}
