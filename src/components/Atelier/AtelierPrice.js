// Preis eines Atelier-Stücks mit allen Pflichtzusätzen (priceRules.js):
// Gesamtpreis inkl. USt, zzgl. Lieferung nach Aufwand, Standort Lochau,
// UVP nur mit Beleg. Kein Streichpreis, keine Prozentangabe. Server-Komponente.
import { cx } from "@/components/ui";
import { priceDisplay } from "@/lib/commerce/priceRules";

export default function AtelierPrice({ item, size = "card", className }) {
  const p = priceDisplay(item);
  if (!p) return null;
  return (
    <div className={className}>
      <p className={cx("tabular-nums text-text", size === "detail" ? "font-display text-display-m" : "text-lead font-medium")}>{p.price}</p>
      <p className="mt-1 text-small text-text-soft">{p.notes.join(" · ")}</p>
      {p.uvp && <p className="mt-2 max-w-measure text-small text-text-soft">{p.uvp}</p>}
    </div>
  );
}
