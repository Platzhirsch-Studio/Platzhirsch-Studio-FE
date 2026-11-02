"use client";
// Mini-Warenkorb (Shop-Feeling, 31.10.2026): gleitet nach „In den Warenkorb“
// von rechts herein. Zeigt den gerade gelegten Artikel (Ausführung, Menge,
// Preis), die Zwischensumme des ganzen Warenkorbs und zwei Wege:
// „Weiter einkaufen“ (schließt) und „Zur Kasse“ (/shop/warenkorb).
// Preise IMMER vom Server (POST /api/shop/versand ohne Ziel = nur bepreisen),
// nie aus dem Browser. Keine Versandkosten-Frei-Leiste: es gibt keine
// konfigurierte Schwelle und der Server rechnet keine (siehe Bericht).
// Barrierefreiheit: natives <dialog> mit showModal() → Rest der Seite inert
// (Fokus bleibt im Panel), Esc schließt, Fokus kehrt zum auslösenden Button
// zurück; Ergebnis wird über eine aria-live-Region angesagt.
// Wird von AddToCart erst beim ersten Klick nachgeladen (React.lazy).
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { X } from "@/components/ui/icons";
// euroKurz: „€ 119“ wie auf Produktseite und Kachel (Cent nur, wenn vorhanden).
import { euroKurz as euro } from "@/lib/shop/format";
import { anzeigeSatz } from "@/lib/shop/ust";
import { useShopCart } from "./cartStore";
import { keinUmbruch } from "./keinUmbruch"; // „20 %“ ohne Zeilenumbruch
import { ruhigeBewegung } from "./ruhigeBewegung";
import { shopTitel } from "@/components/Katalog/shopTitel";
import { varianteZeile } from "@/components/Katalog/kaufAuswahl";

// Ausgang: Panel gleitet in --duration-exit (180 ms, ease-exit) hinaus, erst danach aushängen.
const AUSGANG_MS = 200;

const fill = (s, v) => String(s || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));

// Höchstens 15 s warten (Optik-QA r2: unter Last blieb „Preise werden geladen …“ bis zu 61 s stehen) –
// danach Fehlerhinweis mit „Erneut versuchen“, die Zeile bleibt mit Name, Bild und Ausführung sichtbar.
const PREIS_TIMEOUT_MS = 15000;

async function priceCart(cart, locale) {
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), PREIS_TIMEOUT_MS) : 0;
  try {
    const res = await fetch("/api/shop/versand", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ cart, locale }), signal: ctrl?.signal });
    const data = await res.json().catch(() => null);
    return data?.success ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {{ added: { slug: string, variante: string, result: { reason: string|null, added: number } }, locale: string, copy: Record<string,string>, returnFocus?: HTMLElement|null, onClose: () => void }} props
 */
export default function MiniCart({ added, locale, copy: c, returnFocus, onClose }) {
  const id = useId();
  const ref = useRef(null);
  const cart = useShopCart();
  const cartKey = JSON.stringify(cart);
  const [state, setState] = useState({ key: null, data: null, failed: false });
  const [attempt, setAttempt] = useState(0);

  // Öffnen (modal) + Fokus zurückgeben beim Schließen.
  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    if (!d.open) d.showModal();
    let t = 0;
    const onCloseEvt = () => {
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
      // Fokus sofort zurück; aushängen erst nach der Ausgangs-Transition (ruhig = sofort).
      if (ruhigeBewegung()) onClose();
      else t = window.setTimeout(onClose, AUSGANG_MS);
    };
    d.addEventListener("close", onCloseEvt);
    return () => {
      d.removeEventListener("close", onCloseEvt);
      window.clearTimeout(t);
    };
  }, [onClose, returnFocus]);

  // Bepreisen (Server) – bei jeder Änderung des Warenkorbs, auch aus anderen Tabs.
  useEffect(() => {
    let alive = true;
    if (!cart.length) return undefined;
    priceCart(cart, locale).then((data) => {
      if (alive) setState({ key: `${cartKey}#${attempt}`, data, failed: !data });
    });
    return () => {
      alive = false;
    };
  }, [cartKey, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = state.key === `${cartKey}#${attempt}`;
  const data = ready ? state.data : null;
  const zeile = data?.zeilen?.find((z) => z.slug === added.slug && z.variante === added.variante) || null;
  const stueck = cart.reduce((s, x) => s + x.menge, 0);
  const hinweis = added.result?.reason === "voll" ? c.cartFull : added.result?.reason === "max_menge" ? c.qtyMax : "";
  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // Klick auf den Hintergrund
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md translate-x-0 overflow-y-auto border-l border-line bg-surface p-0 text-text backdrop:bg-ink/40 transition-[translate,display,overlay] transition-discrete duration-(--duration-ui) ease-quiet starting:open:translate-x-full not-open:translate-x-full not-open:duration-(--duration-exit) not-open:ease-exit backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-(--duration-ui) starting:open:backdrop:opacity-0 not-open:backdrop:opacity-0 motion-reduce:transition-none motion-reduce:backdrop:transition-none"
      data-shop-minicart=""
    >
      <div className="flex min-h-full flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Startfokus auf den Titel statt auf „Schließen“ (Optik-QA r3: dicker Fokusrahmen beim Öffnen wirkte grob);
              Screenreader lesen so zuerst „Warenkorb (n)“, Tab führt direkt zu „Schließen“. */}
          <h2 id={`${id}-t`} tabIndex={-1} autoFocus className="text-title text-text focus:outline-none">
            {c.drawerTitle} <span className="tabular text-small text-text-soft">({stueck})</span>
          </h2>
          <button type="button" onClick={close} aria-label={c.close} className="ph-press -mt-2 -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:text-text-soft">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div aria-live="polite" className="text-small text-text">
          {added.result?.added > 0 && zeile && <p>{fill(c.drawerAdded, { name: shopTitel(zeile.name) })}</p>}
          {hinweis && <p className="mt-1">{hinweis}</p>}
        </div>

        {(!ready || state.failed) && cart.length > 0 && added.vorschau && (
          // Sofort die hinzugefügte Zeile aus den Anzeige-Daten der Produktseite (Optik-QA r1: bei 2 Artikeln stand
          // sonst „(2)“ über einer Skelett-Zeile). Der Server-Preis ersetzt sie gleich; Summe erst mit Server-Daten.
          // Scheitert das Bepreisen, bleibt die Zeile ohne Preis stehen (Optik-QA r2: der Artikel verschwand ganz).
          <div className="flex gap-4 border-y border-line py-4" aria-busy={!ready || undefined} data-shop-minicart-vorschau="">
            <span aria-hidden="true" className="block size-20 shrink-0 bg-surface-raised">
              {added.vorschau.bild ? <img src={added.vorschau.bild} alt="" width={80} height={80} className="size-full object-contain p-1 mix-blend-multiply" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small text-text-soft">{added.vorschau.marke}</p>
              <p className="text-body text-text">{shopTitel(added.vorschau.name)}</p>
              {added.vorschau.variante && (
                <p className="text-small text-text-soft">
                  {c.variant}: {shopTitel(varianteZeile(added.vorschau.variante))}
                </p>
              )}
              {!state.failed && <p className="mt-1 text-small text-text-soft tabular">{added.vorschau.preis}</p>}
            </div>
          </div>
        )}
        {!ready && cart.length > 0 && !added.vorschau && (
          // Platzhalter in Form der Artikelzeile: kein leeres Panel und kein Sprung, wenn die Preise kommen.
          <div className="flex gap-4 border-y border-line py-4" aria-busy="true">
            <div aria-hidden="true" className="ph-skeleton size-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-small text-text-soft" role="status">
                {c.loadingPrices}
              </p>
              <div aria-hidden="true" className="ph-skeleton mt-2 h-4 w-3/4" />
              <div aria-hidden="true" className="ph-skeleton mt-2 h-4 w-1/2" />
            </div>
          </div>
        )}
        {ready && state.failed && (
          <p className="text-small text-text">
            {c.pricesError}{" "}
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 underline underline-offset-4">
              {c.retry}
            </button>
          </p>
        )}

        {zeile && (
          <div className="ph-arrive flex gap-4 border-y border-line py-4" data-shop-minicart-zeile={zeile.slug}>
            {/* Fläche am Rahmen, nicht am Bild: sonst wird das Bild samt eigener Fläche multipliziert → helles Quadrat im Kasten. */}
            <span aria-hidden="true" className="block size-20 shrink-0 bg-surface-raised">
              {zeile.bild ? <img src={zeile.bild} alt="" width={80} height={80} loading="lazy" className="size-full object-contain p-1 mix-blend-multiply" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small text-text-soft">{zeile.markeName}</p>
              <p className="text-body text-text">{shopTitel(zeile.name)}</p>
              {zeile.varianteName && (
                <p className="text-small text-text-soft">
                  {c.variant}: {shopTitel(varianteZeile(zeile.varianteName))}
                </p>
              )}
              <p className="mt-1 text-small text-text-soft tabular">
                {zeile.menge}&nbsp;× {euro(zeile.einzelCent, locale)}
                {/* eigene Zeile statt „… € 317,40 ·“ mit hängendem Trenner; Satz je Kategorie (ust.js), bei OSS nur „inkl. USt.“ */}
                <span className="block">
                  {anzeigeSatz({ klasse: zeile.ustKlasse }) == null || !c.inclVatRate ? c.inclVat : keinUmbruch(fill(c.inclVatRate, { satz: anzeigeSatz({ klasse: zeile.ustKlasse }) }))}
                </span>
              </p>
              {zeile.grundpreis && (
                <p className="text-small text-text-soft tabular">
                  {c.basePrice}: {euro(zeile.grundpreis.cent, locale)} / {zeile.grundpreis.je}
                </p>
              )}
            </div>
            <p className="text-body text-text tabular">{euro(zeile.summeCent, locale)}</p>
          </div>
        )}

        {data && (
          <div>
            <div className="flex justify-between gap-4 text-body font-medium">
              <span>{c.subtotal}</span>
              <span key={data.summen?.warenCent ?? ""} className="ph-arrive tabular" data-shop-minicart-summe={data.summen?.warenCent ?? ""}>
                {euro(data.summen?.warenCent || 0, locale)}
              </span>
            </div>
            <p className="mt-1 text-small text-text-soft">{c.subtotalNote}</p>
          </div>
        )}

        {/* Knöpfe direkt unter der Zwischensumme (Optik-QA r3, iPad hoch: mit mt-auto lagen ~1100 px Leere dazwischen). */}
        <div className="flex flex-col gap-3">
          <Link href="/shop/warenkorb" prefetch={false} className="ph-press inline-flex min-h-12 w-full items-center justify-center bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover" data-shop-zum-warenkorb="">
            {c.toCheckout}
          </Link>
          <button type="button" onClick={close} className="ph-press inline-flex min-h-12 w-full items-center justify-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper">
            {c.continueShopping}
          </button>
        </div>
      </div>
    </dialog>
  );
}
