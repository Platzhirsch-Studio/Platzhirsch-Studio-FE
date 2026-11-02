"use client";
// src/components/Katalog/KaufBox.js
// Kaufbox der Shop-Produktseite (Accessoire-Welt; ReservierenSlot entscheidet
// auf dem Server, ob sie erscheint – nur SHOP_MODE test/live + verkaufbar).
// Ersetzt dort AddToCart (Shop/AddToCart.js bleibt für andere Aufrufer):
//   - großer Preis der gewählten Ausführung + „inkl. X % MwSt., zzgl. Versand“ (Satz je Kategorie) + Grundpreis
//     (nur wo der Server ihn mitgibt: Volumen-Kategorien mit belegtem Inhalt)
//   - Ausführungen als native Radios (Name + Preis je Ausführung sichtbar,
//     Pfeiltasten/Space nativ), keine Auswahl bei nur einer Variante
//   - Menge als Stepper (− / Zahl / +), 1 … CART_MAX_QTY
//   - „In den Warenkorb“ (primär, volle Breite auf Telefonen) und
//     „Reservieren & im Showroom abholen“ (sekundär)
//   - Konfigurator-Kopplung wie AddToCart (Ereignis „katalog:ausfuehrung“).
//   - nach „In den Warenkorb“ gleitet der Mini-Warenkorb herein (Shop/MiniCart.js,
//     erst beim ersten Klick geladen); addItem meldet ehrlich, was passiert ist
//     (voll / max_menge) – „Hinzugefügt“ nur, wenn wirklich etwas dazukam.
// Preise sind NUR Anzeige (vom Server formatiert): Warenkorb und Kasse holen
// sie immer neu vom Server (lib/shop/catalog.js), der Browser speichert nur
// slug, variante, menge (cartStore).
import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, Check } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { CART_MAX_QTY } from "@/lib/shop/cartLimits";
import { addItem } from "@/components/Shop/cartStore";
import { shopTitel } from "./shopTitel";
import { massText, varianteTeile } from "./kaufAuswahl";

const MiniCart = lazy(() => import("@/components/Shop/MiniCart"));

const CART = "/shop/warenkorb";
// Mengen-Knöpfe: Hover-Fläche (160 ms) + 1 px Druck (ph-press); deaktiviert ohne Hover.
const STEPPER =
  "ph-press inline-flex size-12 items-center justify-center text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-ink/5 disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * @param {{
 *   slug: string,
 *   varianten: Array<{id: string, name: string|null, preis: string, grundpreis: string|null}>,
 *   zuordnung?: Record<string, Array<string|null>>, start?: string|null,
 *   locale?: string, copy: Record<string, string>, hinweis?: string|null
 * }} props
 */
export default function KaufBox({ slug, varianten, zuordnung = {}, start = null, locale = "de", copy, hinweis = null, sofortLieferbar = false, vorschau = null }) {
  const id = useId();
  const router = useRouter();
  const [variante, setVariante] = useState((start && varianten.some((v) => v.id === start) ? start : varianten[0]?.id) || "standard");
  const [menge, setMenge] = useState(1);
  const [done, setDone] = useState(false);
  // Zähler der Ausführungswechsel: neuer Preis setzt sich (ph-arrive, 0,6 → 1) – nie beim Laden.
  const [wechsel, setWechsel] = useState(0);
  const [drawer, setDrawer] = useState(null); // { added, returnFocus, n } | null
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const multi = varianten.length > 1;
  const v = varianten.find((x) => x.id === variante) || varianten[0];
  const aktuell = useRef(variante); // für den Konfigurator-Abgleich: nur echte Wechsel bewegen den Preis
  useEffect(() => {
    aktuell.current = variante;
  }, [variante]);

  useEffect(() => {
    if (!multi || !Object.keys(zuordnung).length) return undefined;
    const onAuswahl = (e) => {
      const d = e?.detail;
      if (!d || d.slug !== slug || !Array.isArray(d.auswahl)) return;
      // Gleiche Regel wie varianteZurAuswahl (lib/shop/catalog.js), ohne Import (Insel klein halten).
      let best = null;
      let bestN = -1;
      for (const [vid, a] of Object.entries(zuordnung)) {
        if (!a.every((o, i) => o == null || o === d.auswahl[i])) continue;
        const n = a.filter(Boolean).length;
        if (n > bestN) [best, bestN] = [vid, n];
      }
      if (best) {
        if (best !== aktuell.current) setWechsel((n) => n + 1);
        setVariante(best);
        setDone(false);
      }
    };
    window.addEventListener("katalog:ausfuehrung", onAuswahl);
    return () => window.removeEventListener("katalog:ausfuehrung", onAuswahl);
  }, [slug, multi, zuordnung]);

  const setzeMenge = (n) => {
    setMenge(Math.max(1, Math.min(CART_MAX_QTY, Number(n) || 1)));
    setDone(false);
  };

  return (
    <div className="w-full" data-shop-add={slug} data-kat-kaufbox="">
      {sofortLieferbar && copy.inStock && (
        <p className="mb-3 inline-flex items-center gap-1 border border-line-strong px-2 py-0.5 text-small text-text" data-shop-sofort-lieferbar="">
          <Check aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          {copy.inStock}
        </p>
      )}
      {v && (
        <div aria-live="polite">
          <p key={wechsel} className={`text-title text-text tabular${wechsel ? " ph-arrive" : ""}`} data-kat-kaufpreis="">
            {v.preis}
          </p>
          <p className="mt-1 text-small text-text-soft">
            {copy.inklMwst}
            {v.grundpreis && (
              <>
                {" · "}
                {copy.grundpreis} {v.grundpreis}
              </>
            )}
          </p>
        </div>
      )}

      {multi && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-small text-text-soft">{copy.ausfuehrung}</legend>
          {/* Eine Zeile je Ausführung (Optik-QA r2): im 2er-Raster spannte bei ungerader Zahl die letzte Kachel über
              die ganze Breite (Riedel „Jubiläumsset“, Zalto „6er-Karton“), bei 200 % Textzoom überdeckte der Haken
              den Namen. Jetzt: Name/Maße links, Preis rechts, Haken im Fluss – nichts überlappt, nichts spannt. */}
          <div className="flex flex-col gap-2">
            {varianten.map((x) => {
              const an = x.id === variante;
              return (
                <label
                  key={x.id}
                  htmlFor={`${id}-${x.id}`}
                  className={`flex min-h-14 cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 border px-3 py-2 transition-colors duration-(--duration-micro) ease-quiet has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${an ? "border-ink bg-ink/5" : "border-line-strong hover:border-ink"}`}
                  data-shop-variante-option={x.id}
                >
                  <input
                    id={`${id}-${x.id}`}
                    type="radio"
                    name={`${id}-variante`}
                    value={x.id}
                    checked={an}
                    onChange={() => {
                      setVariante(x.id);
                      setWechsel((n) => n + 1);
                      setDone(false);
                    }}
                    className="sr-only"
                  />
                  {/* „MONUMENT · 35 cm · 6,5 kg“ → Name, darunter die Maße mit Kommas: kein hängendes „·“ am Zeilenende. */}
                  <span className="flex min-w-0 flex-1 basis-40 flex-col">
                    <span className="text-ui text-text">{shopTitel(varianteTeile(x.name).name)}</span>
                    {varianteTeile(x.name).mass && <span className="text-small text-text-soft">{shopTitel(massText(varianteTeile(x.name).mass))}</span>}
                  </span>
                  <span className="ml-auto flex items-center gap-2 text-small text-text-soft tabular">
                    <span className="text-right">
                      {x.preis}
                      {x.grundpreis && <span className="block">{x.grundpreis}</span>}
                    </span>
                    {/* Platz für den Haken immer reserviert: die Preise stehen bündig, der Haken überdeckt nichts. */}
                    <span aria-hidden="true" className="inline-flex size-4 shrink-0">
                      {an && <Check className="size-4 text-text" strokeWidth={1.5} />}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex items-stretch border border-line-strong self-start sm:self-auto" role="group" aria-label={copy.menge}>
          <button type="button" onClick={() => setzeMenge(menge - 1)} disabled={menge <= 1} className={STEPPER} aria-label={copy.weniger}>
            <Minus aria-hidden="true" className="size-4" strokeWidth={1.5} />
          </button>
          <label htmlFor={`${id}-m`} className="sr-only">
            {copy.menge}
          </label>
          <input
            id={`${id}-m`}
            type="number"
            inputMode="numeric"
            min={1}
            max={CART_MAX_QTY}
            value={menge}
            onChange={(e) => setzeMenge(e.target.value)}
            className="w-12 border-x border-line bg-surface text-center text-body text-text tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button type="button" onClick={() => setzeMenge(menge + 1)} disabled={menge >= CART_MAX_QTY} className={STEPPER} aria-label={copy.mehrMenge}>
            <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          className="ph-press inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover focus-visible:bg-action-hover"
          onClick={(e) => {
            const result = addItem(slug, variante, menge);
            setDone(result.added > 0);
            // vorschau: Name/Marke/Bild der Seite → der Mini-Warenkorb zeigt die Zeile sofort, bis der Server-Preis da ist.
            const anzeige = vorschau && v && result.added > 0 ? { ...vorschau, variante: multi ? v.name : null, preis: `${menge} × ${v.preis}` } : null;
            setDrawer({ added: { slug, variante, result, vorschau: anzeige }, returnFocus: e.currentTarget, n: Date.now() });
          }}
          data-shop-in-warenkorb=""
        >
          {/* Erfolg: der Haken zeichnet sich einmal (globals.css .ph-tick, Pfad ≤ 16 Einheiten); ruhig = steht. */}
          {done && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ph-tick size-4" data-shop-haken="">
              <path d="M6.5 12.5l3.5 3.5 7.5-8" />
            </svg>
          )}
          {done ? copy.added : copy.inCart}
        </button>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
        onClick={() => {
          addItem(slug, variante, menge);
          router.push(`${CART}?lieferart=abholung&zahlung=vorort`);
        }}
        data-shop-reservieren=""
      >
        {copy.reserve}
      </button>
      <p aria-live="polite" className="min-h-6 text-small text-text">
        {done && (
          <Link href={CART} prefetch={false} className="ph-arrive underline underline-offset-4" data-shop-zum-warenkorb="" data-shop-im-warenkorb="">
            {/* Der Knopf sagt schon „✓ Im Warenkorb“ – hier nur das Ziel („Warenkorb →“), nicht „Im Warenkorb → Warenkorb“. */}
            {/* Icon-Pfeil wie überall sonst (Optik-QA r3: typografisches „→“ fiel aus der Reihe). */}
            <span className="inline-flex items-center gap-1">
              {copy.cartTitle}
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </span>
          </Link>
        )}
      </p>
      {hinweis && <p className="mt-2 text-small text-text-soft">{hinweis}</p>}
      {drawer && (
        <Suspense fallback={null}>
          <MiniCart key={drawer.n} added={drawer.added} returnFocus={drawer.returnFocus} locale={locale} copy={copy} onClose={closeDrawer} />
        </Suspense>
      )}
    </div>
  );
}
