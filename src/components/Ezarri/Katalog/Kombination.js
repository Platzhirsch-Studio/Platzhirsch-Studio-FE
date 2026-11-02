// „Mischung laut Ezarri“ auf der Mosaik-Detailseite (QM Runde 2, P2-2).
// Zeigt das Rezept einer fertigen Mischung (Cocktail, Mix, Gold, Fosfo,
// Iridescent): Balken mit Anteilen in der Farbe der Einzelmosaike, darunter
// die Liste mit Links auf die Einzelmosaike und Prozent, Quelle mit Stand.
// Knöpfe: Mischung im Konfigurator (mit dem Rezept als Startwert, wenn alle
// Einzelfarben dort mischbar sind, sonst die fertige Mischung) und Muster der
// Einzelfarben anfragen. Server-Komponente, kein JS.
import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import { FARBFAMILIEN, formatIdsOf } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { ezarriUrlFor } from "@/lib/ezarri/config";
import { konfiguratorHref } from "./konfigLink";
import { anfrageHref } from "@/components/Ezarri/Anfrage/AnfrageLink";

const swatchOf = (t) => t.hex || FARBFAMILIEN.find((f) => f.id === t.farbfamilie)?.swatch || null;
const pct = (n) => `${n} %`;

/**
 * @param {object} mosaik voller Datensatz (data.getReference)
 * @param {object} kombination data.getKombination(ref)
 */
export default function Kombination({ mosaik: r, kombination: k }) {
  const { teile } = k;
  const locale = useLocale();
  const t = ezT(locale);
  const { MISCHUNG } = ezCopy(locale);
  const fmt = formatIdsOf(r)[0];
  const konfHref = k.konfigurierbar
    ? konfiguratorHref(teile.map((t) => ({ konfId: t.konfId, ref: t.ref, anteil: t.anteil })), fmt)
    : r.konfigurator
      ? konfiguratorHref([{ konfId: r.konfigurator.id, ref: r.id }], fmt)
      : null;
  const musterRefs = [r.id, ...teile.map((t) => t.ref).filter(Boolean)];
  const summary = teile.map((t) => `${t.name} ${pct(t.anteil)}`).join(", ");
  return (
    <section aria-labelledby="ez-mischung" className="border-t border-line pt-5">
      <h2 id="ez-mischung" className="text-ui text-text">
        {MISCHUNG.title}
      </h2>
      <div role="img" aria-label={`${MISCHUNG.balken}: ${summary}`} className="mt-3 flex h-4 w-full overflow-hidden border border-line-strong">
        {teile.map((t, i) => {
          const sw = swatchOf(t);
          return (
            <span
              key={`${t.name}-${i}`}
              className={`h-full ${sw ? "bg-(--swatch)" : "bg-linen bg-[repeating-linear-gradient(45deg,transparent_0_4px,var(--color-line-strong)_4px_5px)]"} ${i ? "border-l border-paper" : ""}`}
              style={{ width: `${t.anteil}%`, ...(sw ? { "--swatch": sw } : {}) }}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-col">
        {teile.map((t, i) => {
          const sw = swatchOf(t);
          return (
            <li key={`${t.name}-${i}`} className="flex min-h-11 items-center gap-3 border-b border-line text-small">
              <span aria-hidden="true" className={`size-4 shrink-0 border border-line-strong ${sw ? "bg-(--swatch)" : "bg-linen"}`} style={sw ? { "--swatch": sw } : undefined} />
              <span className="min-w-0 flex-1">
                {t.ref ? (
                  <Link href={`/ezarri/mosaike/${t.ref}`} className="inline-flex min-h-11 items-center text-text underline underline-offset-4">
                    {t.refName ?? t.name}
                  </Link>
                ) : (
                  <span className="text-text">
                    {t.name} <span className="text-text-soft">({MISCHUNG.ohneSeite})</span>
                  </span>
                )}
              </span>
              <span className="tabular-nums text-text">{pct(t.anteil)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-small text-text-soft">
        {k.basis === "konfigurator" ? MISCHUNG.quelleKonfigurator : MISCHUNG.quelle}, {t("Stand", "as of", "état au", "aggiornato al")} {k.stand.split("-").reverse().join(".")} ·{" "}
        <a href={ezarriUrlFor(k.quelle, locale)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1 underline underline-offset-4">
          {MISCHUNG.quelleLink}
          <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          <span className="sr-only">{t("(öffnet ezarri.com)", "(opens ezarri.com)", "(ouvre ezarri.com)", "(apre ezarri.com)")}</span>
        </a>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {konfHref && (
          <Button href={konfHref} {...ezLinkProps(locale, "/ezarri/konfigurator")} variant="secondary">
            {k.konfigurierbar ? MISCHUNG.konfigurator : MISCHUNG.konfiguratorFertig}
          </Button>
        )}
        {musterRefs.length > 1 && (
          <Button href={anfrageHref({ art: "muster", refs: musterRefs, quelle: "katalog" })} {...ezLinkProps(locale, "/ezarri/anfrage")} variant="secondary">
            {MISCHUNG.muster}
          </Button>
        )}
      </div>
      {k.konfigurierbar && <p className="mt-2 text-small text-text-soft">{MISCHUNG.konfiguratorHinweis}</p>}
    </section>
  );
}
