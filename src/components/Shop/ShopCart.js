"use client";
// Warenkorb + Kasse des Shops (Accessoire-Welt, SHOP_MODE test/live).
// Preise, Versand und Summen kommen IMMER vom Server (/api/shop/versand);
// hier wird nur angezeigt und die angezeigten Summen beim Bestellen
// mitgeschickt – der Server prüft sie gegen und antwortet bei Abweichung 409.
// Pflichtelemente vor dem Kauf: Zusammenfassung (Artikel, Preise inkl. USt,
// Versand, Gesamtpreis, Lieferzeit), Links zu den Rechtstexten (Slots,
// solange die Kanzlei nicht liefert: sichtbar gesperrt), Button
// „Zahlungspflichtig bestellen“. Keine AGB-Checkbox (Kanzlei entscheidet).
//
// Shop-Feeling (31.10.2026):
//   - sichtbare Schritte (Warenkorb → Lieferung → Ihre Angaben → Prüfen & bestellen),
//     eine Seite, Gastbestellung ohne Konto
//   - Zeilen mit Bild, Mengen-Stepper (− Zahl +), Entfernen mit „Rückgängig“,
//     Ansage jeder Änderung über aria-live
//   - Lade-/Fehlerzustand der Bepreisung (vorher: leere Liste und „€ 0,00“,
//     solange/falls /api/shop/versand nicht antwortete)
//   - Versandkosten werden automatisch berechnet, sobald die Adresse
//     vollständig ist (Button bleibt als Rückfall); der gesperrte
//     Bestell-Button sagt, warum (aria-describedby)
//   - Zahlungsart sichtbar (Stripe; im Test: „es wird nichts abgebucht“)
//   - mobile Leiste unten mit Gesamtpreis → springt zur Übersicht. Bewusst
//     KEIN Bestell-Button in der Leiste: der Button gehört unmittelbar unter
//     die Zusammenfassung und die Rechtshinweise (FAGG § 8, BGB § 312j).
//   - leerer Warenkorb mit Vorschlägen (vom Server, Katalogpreise)
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { Minus, Plus } from "@/components/ui/icons";
// euroKurz: „€ 119“ wie auf Produktseite und Kachel (Cent nur, wenn vorhanden).
import { euroKurz as euro } from "@/lib/shop/format";
import { lieferzeitFuer, lieferzeitText } from "@/lib/shop/lieferzeit";
import { PENDING_ORDER_KEY, pendingValue } from "@/lib/shop/pendingOrder";
import { anzeigeSatz, steuerLand, ustAufteilung } from "@/lib/shop/ust";
import { clearCart, removeItem, restoreItem, setQty, setVariant, useShopCart } from "./cartStore";
import { shopTitel, titelTeile } from "@/components/Katalog/shopTitel"; // Namen: Trenner/Einheiten nie am Zeilenanfang
import AuswahlFeld from "./AuswahlFeld"; // eckiges Auswahlfeld auch in WebKit (Optik-QA r2)
import { varianteZeile } from "@/components/Katalog/kaufAuswahl";
import { ruhigeBewegung } from "./ruhigeBewegung"; // sanftes Scrollen nur ohne „Bewegung reduzieren“/Ruhige Ansicht

const noop = () => () => {};
const field = "min-h-11 w-full border border-line-strong bg-surface px-3 text-body text-text";
const label = "flex flex-col gap-1 text-small text-text-soft";
const stepBtn = "ph-press inline-flex size-11 items-center justify-center border border-line-strong text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-stone disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
// Buttons im Warenkorb: Farbwechsel in 160 ms, Druck 1 px (ph-press).
const BTN_FARBE = "transition-colors duration-(--duration-micro) ease-quiet";
const fill = (s, v) => String(s || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));
/** Adresse so weit vollständig, dass ein Tarif sinnvoll ist (Server prüft genauer). */
const adresseKomplett = (a) => a.land !== "CH" && /^[A-Za-z0-9 -]{4,12}$/.test(a.plz.trim()) && a.ort.trim().length >= 2 && a.strasse.trim().length >= 2 && a.hausnr.trim().length >= 1;
const MAX_QTY = 10;
// Ausführungs-Auswahl im Warenkorb: „Classique · 10 cm · 500 g – € 119,00“ (Name wie überall im Shop).
// Optik-QA r2: WebKit kürzt den geschlossenen Select trotzdem („… 500 g – €“, iPhone SE bis iPad quer). Die gewählte
// Ausführung steht deshalb OHNE Preis im Feld – ihr Preis steht direkt darunter („€ 119,00 je …“); die übrigen
// Optionen tragen ihren Preis zum Vergleich in der Auswahlliste.
// Optik-QA r3 (iPad hoch): Maße mit Kommas wie Mini-Warenkorb und Übersicht („Classique, 10 cm, 500 g“).
const optionText = (name, preis, gewaehlt = false) => (gewaehlt ? shopTitel(varianteZeile(name)) : `${shopTitel(varianteZeile(name))} – ${preis}`);

/** Name mit Zusatz in eigener Zeile („Die klassische Kerze“ / „Cabinet des miroirs“) – kein „–“ am Zeilenende (Optik-QA r3). */
function Titel({ name }) {
  const t = titelTeile(name);
  if (!t.zusatz) return t.haupt;
  return (
    <>
      {t.haupt}
      <span className="sr-only"> – </span>
      <br aria-hidden="true" />
      {t.zusatz}
    </>
  );
}

/** Mobile Leiste höher als 25 % des Bildschirms (200 % Textzoom: ~40 %)? Dann entfällt sie – die Übersicht ist ohnehin erreichbar. */
export const leisteZuHoch = (hoehe, fenster) => fenster > 0 && hoehe > fenster * 0.25;

/** Schlüssel für den Versandtarif: nur Felder, die den Tarif bestimmen (Adresszusatz nicht – Optik-QA r3: 4 Aufrufe je Eingabe). */
export const tarifSchluessel = (a) => JSON.stringify([a.land, a.plz.trim(), a.ort.trim(), a.strasse.trim(), a.hausnr.trim()]);
// (vorher: amStueck – geschützte Leerzeichen im Ausführungsnamen; Optik-QA r3: der lange, unteilbare Name schob in der
// Übersicht den Preis „€ 54,10“ über die Spalte. Die Kommas aus varianteZeile brechen sauber um.)

// Bepreisen/Versand höchstens 15 s abwarten (Optik-QA r2: unter Last blieb „Preise werden geladen …“ ohne
// Meldung stehen) – danach Fehlerhinweis mit „Erneut versuchen“. Die Bestellung selbst (checkout) ohne Zeitlimit:
// ein Abbruch dort könnte eine angelegte Bestellung verdecken.
const PREIS_TIMEOUT_MS = 15000;

async function post(url, body, timeoutMs = 0) {
  const ctrl = timeoutMs && typeof AbortController === "function" ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ctrl?.signal });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return { status: 0, data: {} };
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {{ locale: string, copy: object, legal: Array<{id: string, titel: string, offen: boolean, entwurf?: boolean, path?: string|null}>, start: { lieferart?: string, zahlung?: string, abbruch?: boolean }, test?: boolean, vorschlaege?: Array<{slug: string, name: string, markeName: string, abCent: number, mehrere: boolean, bild: string|null, href: string}> }} props
 */
export default function ShopCart({ locale, copy: c, legal, start = {}, test = false, vorschlaege = [] }) {
  const id = useId();
  const cart = useShopCart();
  const shown = useRef(0);
  const summaryRef = useRef(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [priced, setPriced] = useState(null); // letzte Server-Antwort (bleibt beim Nachladen sichtbar)
  const [pricedKey, setPricedKey] = useState(null); // für welchen Warenkorb sie gilt
  const [pricingFailed, setPricingFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [removed, setRemoved] = useState(false);
  const [undo, setUndo] = useState(null); // { removed, name }
  const [live, setLive] = useState("");
  const [lieferart, setLieferart] = useState(start.lieferart === "abholung" ? "abholung" : "versand");
  const [zahlung, setZahlung] = useState(start.zahlung === "vorort" ? "vorort" : "online");
  const [adresse, setAdresse] = useState({ land: "AT", plz: "", ort: "", strasse: "", hausnr: "", zusatz: "" });
  const [kunde, setKunde] = useState({ name: "", email: "", telefon: "" });
  const [versandState, setVersandState] = useState(null);
  const [versandFehler, setVersandFehler] = useState("");
  const [rechnet, setRechnet] = useState(false);
  const [msg, setMsg] = useState(start.abbruch ? c.cancelled : "");
  const [busy, setBusy] = useState(false);
  const cartKey = JSON.stringify(cart);
  // Ein Tarif gilt nur für genau diesen Warenkorb + diese Adresse.
  const versandKey = `${cartKey}|${tarifSchluessel(adresse)}`;
  const neuesterKey = useRef(versandKey);
  useEffect(() => {
    neuesterKey.current = versandKey; // für berechnen(): veraltete Antworten verwerfen
  }, [versandKey]);
  const leisteRef = useRef(null);
  const [leisteAus, setLeisteAus] = useState(false);
  const versand = versandState?.key === versandKey ? versandState.data : null;
  const setVersand = (data, key = versandKey) => setVersandState(data ? { key, data } : null);

  useEffect(() => {
    shown.current = Date.now();
  }, []);

  // Bepreisen (Server) bei jeder Änderung des Warenkorbs (auch aus anderen Tabs).
  useEffect(() => {
    let alive = true;
    if (!cart.length) return undefined;
    post("/api/shop/versand", { cart, locale }, PREIS_TIMEOUT_MS).then(({ data }) => {
      if (!alive) return;
      if (!data?.success) {
        setPricingFailed(true);
        return;
      }
      setPricingFailed(false);
      setPriced(data);
      setPricedKey(cartKey);
      if (data.fehler?.length) {
        data.fehler.forEach((f) => cart.filter((x) => x.slug === f.slug).forEach((x) => removeItem(x.slug, x.variante)));
        setRemoved(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [cartKey, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const fresh = pricedKey === cartKey;
  const zeilen = cart.length ? priced?.zeilen || [] : [];
  const hatZeilen = zeilen.length > 0;
  const warenCent = priced?.summen?.warenCent || 0;
  const versandCent = lieferart === "versand" ? versand?.cent ?? null : 0;
  const gesamtCent = versandCent == null ? null : warenCent + versandCent;
  // USt je Satz (ust.js, dieselbe Rechnung wie der Server): Abholung AT; Versand nach Lieferland
  // (DE nur mit OSS_AKTIV deutsche Sätze); Versand anteilig nach Warenwert je Satz.
  const ustLand = steuerLand({ lieferart, land: adresse.land });
  const ust = gesamtCent == null || !ustLand ? null : ustAufteilung({ zeilen, versandCent: versandCent || 0, lieferart, land: adresse.land });
  const satzText = (klasse) => {
    const satz = anzeigeSatz({ klasse, steuerland: ustLand });
    return satz == null ? c.inclVat : fill(c.inclVatRate, { satz });
  };
  const ch = lieferart === "versand" && adresse.land === "CH";
  const effZahlung = lieferart === "versand" ? "online" : zahlung;
  const stueck = cart.reduce((s, x) => s + x.menge, 0);

  const setA = (k) => (e) => {
    setVersandFehler(""); // neue Adresse → neuer Versuch (auch automatisch)
    setAdresse((a) => ({ ...a, [k]: e.target.value }));
  };
  const setK = (k) => (e) => setKunde((x) => ({ ...x, [k]: e.target.value }));

  function menge(z, n) {
    const v = Math.max(1, Math.min(MAX_QTY, n));
    if (v === z.menge) return;
    setQty(z.slug, z.variante, v);
    setUndo(null);
    setLive(fill(c.qtyChanged, { name: z.name, n: v }));
  }

  function entfernen(z) {
    const r = removeItem(z.slug, z.variante);
    if (!r) return;
    setUndo({ removed: r, name: z.name });
    setLive(fill(c.lineRemoved, { name: z.name }));
  }

  async function berechnen() {
    const key = versandKey;
    setVersandFehler("");
    setMsg("");
    setRechnet(true);
    const { data, status } = await post("/api/shop/versand", { cart, locale, ziel: adresse }, PREIS_TIMEOUT_MS);
    setRechnet(false);
    if (key !== neuesterKey.current) return; // Adresse inzwischen geändert: neuer Lauf folgt automatisch
    if (data?.success && data.versand) {
      setVersand(data.versand, key);
      setPriced(data);
      setPricedKey(JSON.stringify(cart));
      return;
    }
    setVersand(null, key);
    setVersandFehler(data?.code === "land_ch" ? c.chUnavailable : data?.code === "profil_fehlt" ? c.shippingProfile : status === 400 ? c.error : c.shippingError);
  }

  // Automatisch berechnen, sobald die Adresse vollständig ist (kurz entprellt).
  const auto = lieferart === "versand" && cart.length > 0 && adresseKomplett(adresse) && !versand && !versandFehler;
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(berechnen, 700);
    return () => clearTimeout(t);
  }, [auto, versandKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile Leiste nur, solange sie klein bleibt (Optik-QA r3: bei 200 % Textzoom verdeckte sie ~40 % des Bildschirms).
  useEffect(() => {
    const el = leisteRef.current;
    if (!el || typeof ResizeObserver !== "function") return undefined;
    let hoehe = 0; // zuletzt gemessene Höhe, solange sichtbar (versteckt misst sie 0)
    const pruefe = () => {
      if (!el.hidden) hoehe = el.offsetHeight;
      setLeisteAus(leisteZuHoch(hoehe, window.innerHeight));
    };
    const ro = new ResizeObserver(pruefe);
    ro.observe(el);
    window.addEventListener("resize", pruefe);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", pruefe);
    };
  }, [hatZeilen]);

  async function bestellen(e) {
    e.preventDefault();
    setMsg("");
    if (lieferart === "versand" && !versand) {
      setMsg(c.shippingFirst);
      return;
    }
    setBusy(true);
    const { status, data } = await post("/api/shop/checkout", {
      cart,
      lieferart,
      zahlung: effZahlung,
      kunde,
      adresse: lieferart === "versand" ? adresse : undefined,
      tarifId: lieferart === "versand" ? versand?.tarifId : undefined,
      angezeigt: { versandCent: versandCent || 0, gesamtCent: gesamtCent || 0 },
      locale,
      _t: Date.now() - shown.current,
    });
    setBusy(false);
    if (data?.success && data.redirect) {
      // Nur die Bestätigungsseite DIESER Bestellung darf den Warenkorb leeren (ClearCartOnMount).
      const mark = pendingValue(data.bestellung, Date.now());
      try {
        if (mark) window.localStorage.setItem(PENDING_ORDER_KEY, mark);
      } catch {
        /* gesperrt: Warenkorb bleibt nach der Zahlung stehen */
      }
      if (effZahlung === "vorort") clearCart();
      window.location.assign(data.redirect);
      return;
    }
    if (status === 409) {
      if (data.versand) setVersand(data.versand);
      if (data.zeilen) {
        setPriced((p) => ({ ...p, zeilen: data.zeilen, summen: data.summen }));
        setPricedKey(cartKey);
      }
      setMsg(c.changed);
      return;
    }
    setMsg(data?.code === "invalid" && data?.error && data.error !== "Invalid form data" ? data.error : c.error);
  }

  // Lieferzeit aus lib/shop/lieferzeit.js (Entwurf; test: Vorschläge + Marker
  // „Entwurf“, live: nur freigegebene Werte, sonst „auf Anfrage“ – FAGG § 4 Abs 1 Z 7).
  // Die Laufzeit des Dienstes erscheint nur bei echtem Tarif, nie beim Mock.
  const lieferzeit = useMemo(() => {
    const r = lieferzeitFuer({ lieferart, land: adresse.land, slugs: cart.map((i) => i.slug), mode: test ? "test" : "live" });
    const dienstTage = lieferart === "versand" && versand?.quelle !== "mock" && versand?.dienst?.tage ? c.deliveryDays.replace("{n}", versand.dienst.tage) : null;
    return { text: lieferzeitText(r, c), entwurf: Boolean(r?.entwurf), bestand: r?.bestand || "bestellware", dienstTage };
  }, [lieferart, adresse.land, cart, versand, c, test]);

  // Aktueller Schritt (nur Anzeige): 1 Warenkorb, 2 Lieferung, 3 Angaben, 4 Prüfen. Optik-QA r2: „2 Lieferung“
  // war schon aktiv, bevor jemand etwas zur Lieferung angegeben hatte – Schritt 2 erst mit Abholung oder Adresse.
  const lieferungFertig = lieferart === "abholung" || Boolean(versand);
  const lieferungBegonnen = lieferungFertig || [adresse.plz, adresse.ort, adresse.strasse].some((x) => x.trim());
  const angabenFertig = kunde.name.trim().length >= 2 && /.+@.+\..+/.test(kunde.email.trim());
  const schritt = !lieferungBegonnen ? 1 : !lieferungFertig ? 2 : !angabenFertig ? 3 : 4;
  const blockiert = busy || !zeilen.length || !fresh || ch || (lieferart === "versand" && !versand);
  const warum = !busy && zeilen.length > 0 && lieferart === "versand" && !versand && !ch;
  // Adresse vollständig, Tarif kommt gleich (automatisch) – kein „Bitte vervollständigen …“ mehr (Optik-QA r3).
  const wartetAuto = lieferart === "versand" && !ch && !versand && !versandFehler && adresseKomplett(adresse) && cart.length > 0;

  if (mounted && !cart.length) {
    return (
      <div className="py-8" data-shop-leer="">
        <div aria-live="polite" className="text-small text-text">
          {undo && (
            <p className="mb-4">
              {fill(c.lineRemoved, { name: undo.name })}{" "}
              <button
                type="button"
                onClick={() => {
                  restoreItem(undo.removed);
                  setUndo(null);
                }}
                className="min-h-11 underline underline-offset-4"
                data-shop-rueckgaengig=""
              >
                {c.undo}
              </button>
            </p>
          )}
          {removed && <p className="mb-4">{c.unavailable}</p>}
          {msg && <p className="mb-4">{msg}</p>}
        </div>
        <p className="text-title text-text">{c.empty}</p>
        <p className="mt-2 max-w-measure text-body text-text-soft">{c.emptyLead}</p>
        {vorschlaege.length > 0 && (
          <section className="mt-10" aria-labelledby={`${id}-vorschlaege`}>
            <h2 id={`${id}-vorschlaege`} className="text-title text-text">
              {c.suggestions}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-grid" data-shop-vorschlaege="">
              {vorschlaege.map((v) => (
                <li key={v.slug}>
                  {/* Wie die Shop-Kachel: 4:5-Fläche, Herstellerbild unbeschnitten (object-contain). */}
                  <Link href={v.href} prefetch={false} className="group flex h-full flex-col gap-1 text-text no-underline">
                    <span className="mb-2 block aspect-[4/5] w-full overflow-hidden bg-surface-raised">
                      {v.bild ? <img src={v.bild} alt="" width={320} height={400} loading="lazy" className="size-full object-contain p-[6%] mix-blend-multiply transition-transform duration-(--duration-ui) ease-drift motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]" /> : null}
                    </span>
                    <span className="text-overline uppercase text-text-soft">{v.markeName}</span>
                    <span className="text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">{shopTitel(v.name)}</span>
                    <span className="mt-auto pt-1 text-small text-text-soft tabular">
                      {v.mehrere ? `${c.priceFrom} ` : ""}
                      {euro(v.abCent, locale)} · {c.inclVat}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link href="/accessoires/produkte" prefetch={false} className={`ph-press mt-8 inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper ${BTN_FARBE}`}>
          {c.toAccessoires}
        </Link>
      </div>
    );
  }

  const stepCls = (n) => (n < schritt ? "text-text" : n === schritt ? "font-medium text-text" : "text-text-soft");

  return (
    <form onSubmit={bestellen} className={`grid grid-cols-1 gap-6 pb-24 sm:gap-10 lg:grid-cols-12 lg:pb-0 [@media(max-height:500px)]:pb-0${leisteAus ? " max-lg:pb-0" : ""}`} data-shop-cart="" noValidate={false}>
      <nav aria-label={c.stepsLabel} className="lg:col-span-12">
        {/* Telefon (Optik-QA r2, iPhone SE): nur der aktuelle Schritt mit Namen, die übrigen als Ziffer – eine Zeile statt zwei. */}
        <ol className="flex flex-wrap gap-x-4 gap-y-2 text-small sm:gap-x-6" data-shop-schritte={schritt}>
          {c.steps.map((s, i) => (
            <li key={s} aria-current={i + 1 === schritt ? "step" : undefined} className={`flex items-center gap-2 transition-colors duration-(--duration-ui) ease-quiet ${stepCls(i + 1)}`}>
              <span aria-hidden="true" className={`inline-flex size-6 items-center justify-center rounded-pill border tabular transition-colors duration-(--duration-ui) ease-quiet ${i + 1 <= schritt ? "border-ink" : "border-line-strong"}`}>
                {i + 1}
              </span>
              <span className={i + 1 === schritt ? "" : "max-sm:sr-only"}>{s}</span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-8 lg:col-span-7">
        <div aria-live="polite" className="sr-only" data-shop-ansage="">
          {live}
        </div>
        {removed && <p className="text-small text-text">{c.unavailable}</p>}
        {undo && (
          <p className="ph-arrive flex flex-wrap items-center gap-x-3 border-l-2 border-line-strong bg-stone px-4 py-2 text-small text-text" data-shop-entfernt="">
            {fill(c.lineRemoved, { name: undo.name })}
            <button
              type="button"
              onClick={() => {
                restoreItem(undo.removed);
                setUndo(null);
                setLive("");
              }}
              className="min-h-11 underline underline-offset-4"
              data-shop-rueckgaengig=""
            >
              {c.undo}
            </button>
          </p>
        )}
        {pricingFailed && (
          <p className="text-small text-text" role="alert">
            {c.pricesError}{" "}
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 underline underline-offset-4">
              {c.retry}
            </button>
          </p>
        )}
        <ul className={`divide-y divide-line border-y border-line transition-opacity duration-(--duration-swap) ease-quiet ${fresh ? "" : "opacity-60"}`} aria-busy={!fresh} data-shop-zeilen="">
          {/* Platzhalter-Zeilen, bis die Server-Preise da sind (vor dem Mounten eine):
              hält die Höhe der echten Zeilen frei – kein Layoutsprung (CLS). */}
          {!priced && !pricingFailed && (!mounted || cart.length > 0) &&
            Array.from({ length: mounted ? cart.length : 1 }, (_, i) => (
              <li key={`platzhalter-${i}`} className="flex gap-4 py-4" data-shop-zeile-platzhalter="">
                <div aria-hidden="true" className="ph-skeleton size-20 shrink-0 sm:size-24" />
                <div className="min-h-40 min-w-0 flex-1 sm:min-h-24">
                  {i === 0 && mounted && (
                    <p className="text-small text-text-soft" role="status">
                      {c.loadingPrices}
                    </p>
                  )}
                </div>
              </li>
            ))}
          {zeilen.map((z) => (
            // Raster statt verschachtelter Flex-Boxen (Optik-QA r3): Bild | Marke + Name; darunter Ausführung und Preis in
            // voller Breite ab der Bildkante, dann Menge links und Summe/Entfernen rechts. Ab sm dritte Spalte (16rem)
            // für Menge/Summe – Auswahlfelder sind dadurch in jeder Zeile gleich breit. Bild max. 22vw (200 % Textzoom).
            <li key={`${z.slug}-${z.variante}`} className="grid grid-cols-[min(5rem,22vw)_minmax(0,1fr)] gap-x-4 gap-y-3 py-4 sm:grid-cols-[6rem_minmax(0,1fr)_16rem]" data-shop-zeile={z.slug}>
              <span aria-hidden="true" className="block aspect-square w-full bg-surface-raised sm:row-span-2">
                {z.bild ? <img src={z.bild} alt="" width={96} height={96} loading="lazy" className="size-full object-contain p-1 mix-blend-multiply" /> : null}
              </span>
                <div className="min-w-0">
                  <p className="text-small text-text-soft">{z.markeName}</p>
                  <p className="text-body break-words text-text">
                    <Titel name={z.name} />
                  </p>
                </div>
                <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">
                  {z.varianten.length > 1 ? (
                    <label className="flex flex-col gap-1 text-small text-text-soft">
                      {c.variant}
                      {/* Volle Breite der Spalte, in jeder Zeile gleich (Optik-QA r1/r3: WebKit kürzte sonst den Namen). */}
                      <AuswahlFeld wrapClassName="w-full" value={z.variante} onChange={(e) => setVariant(z.slug, z.variante, e.target.value)} className="min-h-11 border border-line-strong pl-2 text-small text-text" data-shop-variante-wahl="">
                        {z.varianten.map((v) => (
                          <option key={v.id} value={v.id}>
                            {optionText(v.name, euro(v.cent, locale), v.id === z.variante)}
                          </option>
                        ))}
                      </AuswahlFeld>
                    </label>
                  ) : null}
                  <p className="mt-1 text-small text-text-soft tabular">
                    {euro(z.einzelCent, locale)} {c.each} · <span data-shop-zeile-ust={anzeigeSatz({ klasse: z.ustKlasse, steuerland: ustLand }) ?? ""}>{satzText(z.ustKlasse)}</span>
                  </p>
                  {z.grundpreis && (
                    <p className="text-small text-text-soft tabular">
                      {c.basePrice}: {euro(z.grundpreis.cent, locale)} / {z.grundpreis.je}
                    </p>
                  )}
                  {z.grundpreisFehlt && <p className="text-small text-text">{c.basePriceMissing}</p>}
                </div>
                {/* Feste Spalte ab sm: Menge, Zeilensumme und „Entfernen“ stehen in jeder Zeile an derselben Stelle. */}
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:justify-end sm:self-start">
                  <div className="flex items-center" role="group" aria-label={`${c.qty}: ${z.name}`}>
                    <button type="button" className={stepBtn} onClick={() => menge(z, z.menge - 1)} disabled={z.menge <= 1} aria-label={c.qtyLess} data-shop-weniger="">
                      <Minus className="size-4" strokeWidth={1.5} />
                    </button>
                    <label className="sr-only" htmlFor={`${id}-${z.slug}-${z.variante}`}>
                      {c.qty}
                    </label>
                    <input
                      id={`${id}-${z.slug}-${z.variante}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_QTY}
                      value={z.menge}
                      onChange={(e) => {
                        const n = Math.trunc(Number(e.target.value));
                        if (n >= 1) menge(z, n);
                      }}
                      className="min-h-11 w-14 border-y border-line-strong bg-surface px-1 text-center text-body tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      data-shop-menge=""
                    />
                    <button type="button" className={stepBtn} onClick={() => menge(z, z.menge + 1)} disabled={z.menge >= MAX_QTY} aria-label={c.qtyMore} data-shop-mehr="">
                      <Plus className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <span className="ml-auto flex items-center gap-x-3">
                  <span className="text-right text-body text-text tabular" aria-label={`${c.lineTotal}: ${euro(z.summeCent, locale)}`}>
                    {euro(z.summeCent, locale)}
                  </span>
                  <button type="button" onClick={() => entfernen(z)} className="-ml-2 min-h-11 px-2 text-small text-text underline underline-offset-4 sm:-mr-2 sm:ml-0" data-shop-entfernen="">
                    {c.remove}
                  </button>
                  </span>
                </div>
            </li>
          ))}
        </ul>
        <Link href="/accessoires/produkte" prefetch={false} className="inline-flex min-h-11 items-center self-start text-small text-text underline underline-offset-4">
          {c.continueShopping}
        </Link>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-title text-text">{c.delivery}</legend>
          {["versand", "abholung"].map((v) => (
            <label key={v} className="flex min-h-11 items-center gap-3 text-body text-text">
              <input type="radio" name="lieferart" value={v} checked={lieferart === v} onChange={() => setLieferart(v)} className="size-5 shrink-0 accent-(--color-ink)" data-shop-lieferart={v} />
              {v === "versand" ? c.shipping : c.pickup}
            </label>
          ))}
        </fieldset>

        {lieferart === "versand" && (
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <legend className="mb-2 text-title text-text">{c.shipping}</legend>
            <label className={`${label} sm:col-span-6`}>
              {c.country}
              <AuswahlFeld wrapClassName="w-full" name="land" value={adresse.land} onChange={setA("land")} className={field} data-shop-land="">
                {Object.entries(c.countries).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </AuswahlFeld>
            </label>
            {ch ? (
              <p className="text-small text-text sm:col-span-6" role="status">
                {c.chUnavailable}
              </p>
            ) : (
              <>
                <label className={`${label} sm:col-span-4`}>
                  {c.street}
                  <input name="strasse" required autoComplete="address-line1" value={adresse.strasse} onChange={setA("strasse")} className={field} />
                </label>
                <label className={`${label} sm:col-span-2`}>
                  {c.houseNo}
                  <input name="hausnr" required value={adresse.hausnr} onChange={setA("hausnr")} className={field} />
                </label>
                <label className={`${label} sm:col-span-6`}>
                  {c.extra}
                  <input name="zusatz" autoComplete="address-line2" value={adresse.zusatz} onChange={setA("zusatz")} className={field} />
                </label>
                <label className={`${label} sm:col-span-2`}>
                  {c.zip}
                  <input name="plz" required autoComplete="postal-code" value={adresse.plz} onChange={setA("plz")} className={field} />
                </label>
                <label className={`${label} sm:col-span-4`}>
                  {c.city}
                  <input name="ort" required autoComplete="address-level2" value={adresse.ort} onChange={setA("ort")} className={field} />
                </label>
                <div className="sm:col-span-6">
                  {/* Optik-QA r3: Hinweis und Verhalten passen zusammen – bei vollständiger Adresse „wird berechnet …“, der
                      Knopf erscheint nur noch als Rückfall nach einem Fehler (die Berechnung läuft automatisch). */}
                  {!versand && (
                    <p className="mb-3 text-small text-text-soft" role="status" data-shop-versand-status={wartetAuto ? "rechnet" : "offen"}>
                      {wartetAuto ? c.shippingCalculating : c.shippingAuto}
                    </p>
                  )}
                  {versandFehler && (
                    <button type="button" onClick={berechnen} disabled={rechnet} className={`ph-press inline-flex min-h-12 items-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper disabled:opacity-50 ${BTN_FARBE}`} data-shop-versand-berechnen="">
                      {rechnet ? c.calculating : c.calcShipping}
                    </button>
                  )}
                  <div aria-live="polite" className="mt-3 text-small text-text">
                    {versandFehler && <p data-shop-versand-fehler="">{versandFehler}</p>}
                    {versand && (
                      <div key={versand.cent} className="ph-arrive" data-shop-versand={versand.cent}>
                        <p className="tabular">
                          {c.shippingCost}: {euro(versand.cent, locale)} {c.inclVat}
                          {ust?.posten?.length > 1 ? ` (${c.vatShippingShare})` : ""}
                          {versand.dienst?.name ? ` · ${versand.dienst.name}` : ""}
                        </p>
                        {versand.quelle === "mock" && <p className="text-text-soft">{c.mockTariff}</p>}
                        {versand.versichert && <p>{c.insured}</p>}
                        {versand.zerbrechlich && <p className="text-text-soft">{c.fragile}</p>}
                        {versand.kerze && <p className="text-text-soft">{c.candle}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-title text-text">{lieferart === "abholung" ? c.payment : c.paymentInfo}</legend>
          {lieferart === "abholung" ? (
            ["online", "vorort"].map((v) => (
              <label key={v} className="flex min-h-11 items-center gap-3 text-body text-text">
                <input type="radio" name="zahlung" value={v} checked={zahlung === v} onChange={() => setZahlung(v)} className="size-5 shrink-0 accent-(--color-ink)" data-shop-zahlung={v} />
                {v === "online" ? c.payOnline : c.payOnSite}
              </label>
            ))
          ) : (
            <p className="text-body text-text">{c.payOnline}</p>
          )}
          <p className="text-small text-text-soft" data-shop-zahlart={effZahlung}>
            {effZahlung === "vorort" ? c.payOnSiteInfo : c.payStripe}
          </p>
          {test && effZahlung === "online" && <p className="text-small text-text">{c.payStripeTest}</p>}
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-title text-text">{c.contact}</legend>
          <p className="text-small text-text-soft sm:col-span-2">{c.guest}</p>
          <label className={`${label} sm:col-span-2`}>
            {c.name}
            <input name="name" required autoComplete="name" value={kunde.name} onChange={setK("name")} className={field} />
          </label>
          <label className={label}>
            {c.email}
            <input name="email" type="email" required autoComplete="email" value={kunde.email} onChange={setK("email")} className={field} />
          </label>
          <label className={label}>
            {c.phone}
            <input name="telefon" type="tel" autoComplete="tel" value={kunde.telefon} onChange={setK("telefon")} className={field} />
          </label>
        </fieldset>
      </div>

      <aside className="lg:col-span-5" aria-labelledby={`${id}-sum`}>
        {/* Innenabstand max. 6vw und Umbruch in langen Wörtern (Optik-QA r3, 200 % Textzoom: „ahlungspflichti“,
            „Versandbedingungen“ ragten über den Rand). */}
        <div className="border border-line bg-surface p-[min(1.25rem,6vw)] break-words hyphens-auto lg:sticky lg:top-24" data-shop-summary="">
          <h2 id={`${id}-sum`} ref={summaryRef} tabIndex={-1} className="text-title text-text focus:outline-none">
            {c.summary}
          </h2>
          <dl className="mt-4 divide-y divide-line text-body">
            {zeilen.map((z) => (
              <div key={`${z.slug}-${z.variante}`} className="flex flex-wrap justify-between gap-x-4 py-2">
                {/* min-w-0 + Preis ohne Umbruch: der Preis bleibt bündig an der Innenkante (Optik-QA r3, iPhone SE: „€ 54,10“
                    ragte hinaus); Zusatz des Namens in eigener Zeile statt „–“ am Zeilenende. */}
                <dt className="min-w-0 text-text-soft">
                  {z.menge}&nbsp;× <Titel name={z.name} />
                  {z.varianteName ? ` (${shopTitel(varianteZeile(z.varianteName))})` : ""}
                </dt>
                <dd className="ml-auto shrink-0 whitespace-nowrap tabular">{euro(z.summeCent, locale)}</dd>
              </div>
            ))}
            <div className="flex flex-wrap justify-between gap-x-4 py-2">
              <dt className="text-text-soft">{c.goods}</dt>
              <dd className="ml-auto whitespace-nowrap tabular">{priced ? euro(warenCent, locale) : "–"}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-4 py-2">
              <dt className="text-text-soft">{c.shippingCost}</dt>
              <dd className="ml-auto whitespace-nowrap tabular" data-shop-summe-versand="">
                {/* Abholung: „entfällt“ statt „€ 0“ (Optik-QA r3). */}
                {lieferart === "abholung" ? c.pickupNoShipping : versandCent == null ? "–" : euro(versandCent, locale)}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-4 py-2 font-medium">
              <dt>{c.total}</dt>
              <dd className="ml-auto whitespace-nowrap tabular" data-shop-summe-gesamt={priced ? gesamtCent ?? "" : ""}>
                {/* Summe wechselt: neuer Wert setzt sich (0,6 → 1 in 280 ms), ruhig = sofort. */}
                <span key={priced ? gesamtCent ?? "-" : "-"} className={priced && gesamtCent != null ? "ph-arrive" : undefined}>
                  {gesamtCent == null || !priced ? "–" : euro(gesamtCent, locale)}
                </span>
              </dd>
            </div>
            {ust && priced &&
              ust.posten.map((p) => (
                <div key={p.satz} className="flex flex-wrap justify-between gap-x-4 py-2 text-small text-text-soft" data-shop-ust-satz={p.satz}>
                  <dt>
                    {c.vatIncluded} ({p.satz} %)
                  </dt>
                  <dd className="ml-auto whitespace-nowrap tabular">{euro(p.ustCent, locale)}</dd>
                </div>
              ))}
            <div className="flex flex-col gap-1 py-2 text-small">
              <dt className="text-text-soft">{c.deliveryTime}</dt>
              <dd data-shop-lieferzeit={lieferzeit.bestand}>
                {lieferzeit.text}
                {lieferzeit.entwurf && (
                  <span className="ml-2 inline-block border border-line-strong px-1 text-text-soft" title={c.draftMarkTitle} data-shop-lieferzeit-entwurf="">
                    {c.draftMark}
                  </span>
                )}
                {lieferzeit.dienstTage && <span className="block text-text-soft">{lieferzeit.dienstTage}</span>}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-small text-text-soft">{c.legalTitle}</p>
            <ul className="mt-2 flex flex-col gap-1 text-small" data-shop-recht="">
              {legal.map((l) => (
                <li key={l.id} data-shop-recht-slot={l.id}>
                  {l.offen && l.entwurf && test && l.path ? (
                    <span className="text-text">
                      <Link href={l.path} prefetch={false} className="underline underline-offset-4">
                        {l.titel}
                      </Link>{" "}
                      <span className="inline-block border border-line-strong px-1 text-text-soft" data-shop-recht-entwurf="">
                        {c.legalPending}
                      </span>
                    </span>
                  ) : l.offen ? (
                    <span className="text-text">
                      {l.titel}: <span className="inline-block border border-line-strong px-1">{c.legalPending}</span>
                    </span>
                  ) : (
                    <Link href={l.path} prefetch={false} className="underline underline-offset-4">
                      {l.titel}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-small text-text-soft">{c.legalNote}</p>
          </div>

          <button
            type="submit"
            disabled={blockiert}
            aria-describedby={warum ? `${id}-warum` : undefined}
            className={`ph-press mt-5 inline-flex min-h-12 w-full items-center justify-center bg-action px-[min(1.5rem,4vw)] py-2 text-center text-ui text-paper hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 ${BTN_FARBE}`}
            data-shop-bestellen={effZahlung}
            data-cta="primary"
          >
            {busy ? c.sending : effZahlung === "vorort" ? c.reserveSubmit : c.buy}
          </button>
          {warum && (
            <p id={`${id}-warum`} className="mt-2 text-small text-text-soft">
              {wartetAuto ? c.shippingCalculating : c.whyDisabled}
            </p>
          )}
          <p aria-live="assertive" className="mt-3 min-h-6 text-small text-text" data-shop-meldung="">
            {msg}
          </p>
        </div>
      </aside>

      {/* Mobile: Gesamtpreis immer sichtbar, springt zur Übersicht (kein Bestell-Button hier, s. Kopf). */}
      {zeilen.length > 0 && (
        // Telefon quer (≤ 500 px hoch): keine klebende Leiste – sie verdeckte dort rund 75 von 390 px (Optik-QA r2).
        <div ref={leisteRef} hidden={leisteAus || undefined} className="fixed inset-x-0 bottom-0 z-(--z-sticky) flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-surface px-gutter py-3 lg:hidden [@media(max-height:500px)]:hidden" data-shop-mobilleiste="">
          <p className="text-small text-text-soft">
            {gesamtCent == null ? c.subtotal : c.stickyTotal} <span className="tabular">({stueck})</span>
            <span key={priced ? gesamtCent ?? warenCent : "-"} className={`block text-body font-medium text-text tabular${priced ? " ph-arrive" : ""}`} data-shop-mobil-summe="">
              {priced ? euro(gesamtCent ?? warenCent, locale) : "–"}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              summaryRef.current?.scrollIntoView({ behavior: ruhigeBewegung() ? "auto" : "smooth", block: "start" });
              summaryRef.current?.focus({ preventScroll: true });
            }}
            // Bei 200 % Textzoom bricht die Leiste um statt den Knopf rechts abzuschneiden (Nachprüfung r3).
            className={`ph-press ml-auto inline-flex min-h-12 max-w-full items-center justify-center bg-action px-5 text-center text-ui text-paper hover:bg-action-hover ${BTN_FARBE}`}
          >
            {c.toSummary}
          </button>
        </div>
      )}
    </form>
  );
}
