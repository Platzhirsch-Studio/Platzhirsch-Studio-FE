"use client";
// „In den Warenkorb“ + „Reservieren & im Showroom abholen“ auf Produktseiten
// der Accessoire-Marken (nur bei SHOP_MODE test/live, ReservierenSlot.js
// entscheidet auf dem Server). Klein gehalten (Tempo-Gate): keine Preise
// (die zeigt der Server-Preisblock), nur Variante, Menge, zwei Aktionen.
// Shop-Feeling (31.10.2026): nach „In den Warenkorb“ gleitet der
// Mini-Warenkorb herein (MiniCart.js, erst beim ersten Klick geladen – die
// Insel bleibt klein). addItem meldet, was wirklich passiert ist (voll,
// Höchstmenge) – kein „Im Warenkorb“ mehr, wenn nichts hinzugefügt wurde.
import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { addItem } from "./cartStore";

const MiniCart = lazy(() => import("./MiniCart"));

const CART = "/shop/warenkorb";

/**
 * zuordnung (K10): { [variantenId]: Array<optionId|null> } – wählt der Konfigurator eine
 * Ausführung (window-Ereignis „katalog:ausfuehrung“ { slug, auswahl }), folgt die Variante.
 * start: Variante zur Standard-Auswahl des Konfigurators.
 * locale: für Preise/Texte im Mini-Warenkorb (Preise kommen vom Server).
 * @param {{ slug: string, varianten: Array<{id: string, name: string|null}>, zuordnung?: Record<string, Array<string|null>>, start?: string|null, locale?: string, copy: Record<string,string> }} props
 */
export default function AddToCart({ slug, varianten, zuordnung = {}, start = null, locale = "de", copy }) {
  const id = useId();
  const router = useRouter();
  const [variante, setVariante] = useState((start && varianten.some((v) => v.id === start) ? start : varianten[0]?.id) || "standard");
  const [menge, setMenge] = useState(1);
  const [done, setDone] = useState(false);
  const [drawer, setDrawer] = useState(null); // { added, returnFocus, n } | null
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const multi = varianten.length > 1;

  useEffect(() => {
    if (!multi || !Object.keys(zuordnung).length) return undefined;
    const onAuswahl = (e) => {
      const d = e?.detail;
      if (!d || d.slug !== slug || !Array.isArray(d.auswahl)) return;
      // Gleiche Regel wie varianteZurAuswahl (lib/shop/catalog.js), hier ohne Import (Insel klein halten).
      let best = null;
      let bestN = -1;
      for (const [vid, a] of Object.entries(zuordnung)) {
        if (!a.every((o, i) => o == null || o === d.auswahl[i])) continue;
        const n = a.filter(Boolean).length;
        if (n > bestN) [best, bestN] = [vid, n];
      }
      if (best) {
        setVariante(best);
        setDone(false);
      }
    };
    window.addEventListener("katalog:ausfuehrung", onAuswahl);
    return () => window.removeEventListener("katalog:ausfuehrung", onAuswahl);
  }, [slug, multi, zuordnung]);

  return (
    <div className="flex w-full flex-col items-start gap-3" data-shop-add={slug}>
      <div className="flex flex-wrap items-end gap-4">
        {multi && (
          <label className="flex flex-col gap-1 text-small text-text-soft" htmlFor={`${id}-v`}>
            {copy.variant}
            <select id={`${id}-v`} value={variante} onChange={(e) => setVariante(e.target.value)} className="min-h-11 border border-line-strong bg-surface px-3 text-body text-text" data-shop-variante="">
              {varianten.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-small text-text-soft" htmlFor={`${id}-m`}>
          {copy.qty}
          <input id={`${id}-m`} type="number" min={1} max={10} value={menge} onChange={(e) => setMenge(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="min-h-11 w-20 border border-line-strong bg-surface px-3 text-body text-text tabular" />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="ph-press inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper"
          onClick={(e) => {
            const result = addItem(slug, variante, menge);
            setDone(result.added > 0);
            setDrawer({ added: { slug, variante, result }, returnFocus: e.currentTarget, n: Date.now() });
          }}
          data-shop-in-warenkorb=""
        >
          {copy.inCart}
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center px-1 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
          onClick={() => {
            addItem(slug, variante, menge);
            router.push(`${CART}?lieferart=abholung&zahlung=vorort`);
          }}
          data-shop-reservieren=""
        >
          {copy.reserve}
        </button>
      </div>
      <p aria-live="polite" className="min-h-6 text-small text-text">
        {done && (
          <Link href={CART} prefetch={false} className="ph-arrive underline underline-offset-4" data-shop-im-warenkorb="">
            <span className="inline-flex items-center gap-1">
              {copy.added}
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {copy.cartTitle}
            </span>
          </Link>
        )}
      </p>
      {drawer && (
        <Suspense fallback={null}>
          <MiniCart key={drawer.n} added={drawer.added} returnFocus={drawer.returnFocus} locale={locale} copy={copy} onClose={closeDrawer} />
        </Suspense>
      )}
    </div>
  );
}
