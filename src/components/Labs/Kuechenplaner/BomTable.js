// Küchenplaner – Stückliste als Tabelle (Planer und Druckansicht). Ohne Preise:
// Beträge gibt es erst mit freigegebener Preistabelle (release.js).
import { buildBom } from "../../../lib/kuechenplaner/bom";
import { keepTogether as kt } from "../../../lib/kuechenplaner/typo";
import { kpIdentity } from "../../../lib/kuechenplaner/i18n";

// Sprachen (01.11.2026): t = Übersetzer (Planer: useKpT, Druckansicht: Server), sonst deutsch.

export default function BomTable({ plan, kitchen, compact = false, geraete = null, t = kpIdentity }) {
  const { rows } = buildBom(plan, kitchen, geraete);
  return (
    // print:mx-0 – im Druck ragte die -mx-1-Ausgleichsfläche über den Satzspiegel, „Menge“ wurde rechts angeschnitten
    <div className="-mx-1 scroll-mt-24 overflow-x-auto px-1 print:mx-0 print:overflow-visible print:px-0 focus-visible:outline-2 focus-visible:outline-ink" tabIndex={0} role="region" aria-label={t("Stückliste")}>
      <table className={`w-full border-collapse sm:min-w-[27rem] print:min-w-0 text-left ${compact ? "text-[0.6875rem]" : "text-[0.8125rem]"} text-ink`}>
        <caption className="sr-only">{t("Stückliste der Planung mit {n} Positionen", { n: rows.length })}</caption>
        <thead>
          <tr className="border-b border-ink/25 text-ink-soft">
            <th scope="col" className="py-1.5 pr-2 font-medium">{t("Pos.")}</th>
            <th scope="col" className="py-1.5 pr-2 font-medium">{t("Bezeichnung")}</th>
            <th scope="col" className="hidden py-1.5 pr-2 font-medium sm:table-cell print:table-cell">{t("B × H × T (cm)")}</th>
            <th scope="col" className="hidden py-1.5 pr-2 font-medium sm:table-cell print:table-cell">{t("Ort")}</th>
            <th scope="col" className="py-1.5 pr-0.5 text-right font-medium">{t("Menge")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.pos} className={`border-b border-ink/10 align-top ${i > 0 && rows[i - 1].group !== r.group ? "border-t border-t-ink/25" : ""}`}>
              <td className="py-1.5 pr-2 tabular-nums">{r.pos}</td>
              <td className="py-1.5 pr-2">
                <span className="block font-medium">{r.href ? <a className="underline underline-offset-2" href={t.locale && t.locale !== "de" ? r.href.replace(/^\/de\//, `/${t.locale}/`) : r.href}>{kt(t(r.label))}</a> : kt(t(r.label))}</span>
                {/* QM r2: schmal (unter 640 px) Maße und Ort hier statt in eigenen, abgeschnittenen Spalten */}
                <span className="block tabular-nums text-ink sm:hidden print:hidden">
                  {r.size ? (/^[\d.,\s×]+$/.test(r.size) ? kt(`${t(r.size)} cm`) : kt(t(r.size))) : ""}
                  {r.size && r.wall ? " · " : ""}
                  {kt(t(r.wall))}
                </span>
                {r.detail && <span className="block text-ink-soft">{kt(t(r.detail))}</span>}
                {r.note && <span className={`block ${r.status === "passtNicht" ? "font-medium text-notice" : "text-ink-soft"}`}>{kt(t(r.note))}</span>}
              </td>
              <td className="hidden whitespace-nowrap py-1.5 pr-2 tabular-nums sm:table-cell print:table-cell">{t(r.size)}</td>
              <td className="hidden py-1.5 pr-2 sm:table-cell print:table-cell">{kt(t(r.wall))}</td>
              <td className="whitespace-nowrap py-1.5 pr-0.5 text-right tabular-nums">
                {r.qty} {t(r.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
