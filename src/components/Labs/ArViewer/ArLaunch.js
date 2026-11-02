"use client";
// „In meinem Raum ansehen“ mit einem Tap (QA R1 P1-2), ohne vorher eine 3D-Bühne
// oder three.js zu laden – wie bei IKEA und Amazon:
//   iPhone/iPad (Safari, Chrome iOS): <a rel="ar" href="….usdz#allowsContentScaling=0">
//     mit <img>-Kind → AR Quick Look mit dem fertigen USDZ vom Server.
//   Android: Scene-Viewer-Intent (mode=ar_preferred, resizable=false); kann Scene
//     Viewer nicht starten, führt browser_fallback_url zurück auf die Seite mit
//     ?ar=fallback – dort lädt die model-viewer-Bühne.
//   Desktop (feiner Zeiger): QR-Übergabe aufs Handy (PhoneHandoff).
//   In-App-Browser (Instagram, Facebook, TikTok …): Hinweis „In Safari/Chrome öffnen“
//     mit Kopier-Link statt eines toten Knopfs (QA R2 P1-2.4).
//   Sonst: Bühne laden (onFallback).
//   Modulare Familien: Größen-Umschalter direkt über dem Knopf, je Größe eigenes
//     GLB/USDZ (QA R2 P2-1.2); die Wahl gilt auch für Bühne und Maßleiste (groesse.js).
// Design-Bibel §6: primärer Knopf, min. 48 px, kein Radius, Fokusrahmen.
import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, QrCode, Smartphone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";
import PhoneHandoff, { preloadQr } from "./PhoneHandoff";
import { groessenListe, groesseLabel, setGroesse, useGroesse } from "./groesse";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

// In-App-Browser, in denen AR Quick Look / Scene Viewer meist nicht startet.
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|MicroMessenger|TikTok|musical_ly|Snapchat|LinkedInApp|Pinterest/i;

/** Plattform einmal bestimmen; auf dem Server null (Platzhalter ohne Layoutsprung). */
export function detectPlatform() {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (IN_APP.test(ua)) return /Android/i.test(ua) ? "inapp-android" : "inapp-ios";
  const a = document.createElement("a");
  const quickLook = Boolean(a.relList?.supports?.("ar"));
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (quickLook || iOS) return quickLook ? "ios" : "ios-ohne-ar";
  if (/Android/i.test(ua)) return "android";
  if (window.matchMedia?.("(pointer: fine) and (hover: hover)").matches) return "desktop";
  return "andere";
}
let platformCache;
const getPlatform = () => (platformCache === undefined ? (platformCache = detectPlatform()) : platformCache);
const noop = () => () => {};
export const usePlatform = () => useSyncExternalStore(noop, getPlatform, () => null);

/** Scene-Viewer-Intent nach developers.google.com/ar/develop/scene-viewer. */
export function sceneViewerIntent({ fileUrl, title, fallbackUrl }) {
  const q = new URLSearchParams({ file: fileUrl, mode: "ar_preferred", resizable: "false", title: title || "" });
  return (
    `intent://arvr.google.com/scene-viewer/1.0?${q.toString()}#Intent;scheme=https;` +
    `package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`
  );
}

/** Quick Look starten: Safari verlangt einen Anker mit rel="ar" und einem <img>-Kind. */
export function openQuickLook(usdz, poster) {
  const a = document.createElement("a");
  a.setAttribute("rel", "ar");
  a.href = `${usdz}#allowsContentScaling=0`;
  const img = document.createElement("img");
  img.alt = "";
  img.src = poster || "";
  a.appendChild(img);
  // wie model-viewer (quick-look): Anker nicht ins DOM hängen, nur klicken
  a.click();
}

/**
 * Origin für den QR-Link (QA R2 P1-2.1), nie localhost:
 *   1. NEXT_PUBLIC_ARVIEWER_ORIGIN (Tunnel/Vorschau, z. B. cloudflared)
 *   2. außerhalb von Produktion: die Adresse, über die die Seite gerade offen ist,
 *      sofern sie nicht localhost ist (Tunnel- oder LAN-Adresse) – so testet niemand gegen eine 404
 *   3. SITE_URL
 */
export function handoffOrigin() {
  const env = process.env.NEXT_PUBLIC_ARVIEWER_ORIGIN;
  if (env) return env.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host)) return window.location.origin;
  }
  return SITE_URL.replace(/\/$/, "");
}

/** Absolute, teilbare Adresse eines Viewer-Pfads (?von=qr, optional Übergabe-Token für den Live-Status). */
export function handoffUrl(pathname, token = null) {
  return `${handoffOrigin()}${pathname}?von=qr${token ? `&t=${encodeURIComponent(token)}` : ""}`;
}

export const TOKEN_RE = /^[A-Za-z0-9_-]{16,32}$/;

/** Auf dem Handy: dem Desktop melden, dass der QR-Link geöffnet wurde (nur das Token, keine weiteren Daten). */
function useMeldeGeoeffnet(token) {
  useEffect(() => {
    if (!token || !TOKEN_RE.test(token)) return;
    fetch("/de/3d-ansicht/uebergabe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aktion: "geoeffnet", t: token }),
      keepalive: true,
    }).catch(() => {});
  }, [token]);
}

function InAppHinweis({ ios }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const u = new URL(window.location.toString());
      u.searchParams.delete("t");
      await navigator.clipboard.writeText(u.toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="border border-line-strong bg-surface-raised p-4" role="status" data-testid="arv-inapp">
      <p className="text-ui font-medium text-text">Für die Ansicht im Raum bitte in {ios ? "Safari" : "Chrome"} öffnen.</p>
      <p className="mt-1 text-small leading-relaxed text-text-soft">
        In dieser App startet die Kamera-Ansicht nicht. Tippen Sie oben auf „…“ und dann auf „Im Browser öffnen“ – oder kopieren Sie den Link.
      </p>
      <button
        type="button"
        onClick={copy}
        className={`mt-3 inline-flex min-h-12 items-center gap-2 border border-ink px-5 text-small font-medium text-text hover:bg-ink hover:text-paper ${FOCUS}`}
      >
        {copied ? <Check aria-hidden="true" className="size-4" strokeWidth={1.75} /> : <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />}
        {copied ? "Link kopiert" : "Link kopieren"}
      </button>
    </div>
  );
}

/** Größen-Umschalter: Knöpfe mit aria-pressed, 44 px, direkt über dem AR-Knopf. */
function GroessenWahl({ productId, list, active }) {
  if (list.length < 2) return null;
  const id = `arv-gr-${productId}`;
  return (
    <div className="mb-3" data-testid="arv-groessen">
      <p id={id} className="text-small font-medium text-text">
        Größe für die Ansicht im Raum
      </p>
      <div role="group" aria-labelledby={id} className="mt-1.5 flex flex-wrap gap-2">
        {list.map((g, i) => (
          <button
            key={`${g.w}-${g.d}-${g.h}-${i}`}
            type="button"
            aria-pressed={active === i}
            title={g.modell || undefined}
            onClick={() => setGroesse(productId, i)}
            className={`inline-flex min-h-11 items-center border px-3.5 text-small tabular-nums transition-colors duration-(--duration-micro) ${FOCUS} ${
              active === i ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper text-text hover:border-ink"
            }`}
          >
            {groesseLabel(list, i)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{id:string, name:string, brand:string, path:string}} product
 * @param {{glb:string, usdz:string|null, poster:string, art:string, raumbedarf?:object, modell?:string}} ar  Asset für die Ansicht im Raum
 * @param {boolean} highlight  Seite kam per QR vom Desktop
 * @param {string|null} token  Übergabe-Token aus dem QR-Link (Live-Status am Desktop)
 * @param {() => void} onFallback  Bühne laden (kein natives AR)
 */
const openStage = () => window.dispatchEvent(new CustomEvent("arv:buehne"));

/**
 * Text unter dem AR-Knopf (QA R2 P3 iPad). iPhone/iPad ohne Quick Look (z. B. ein Browser,
 * der rel="ar" nicht meldet) bekommen den Weg zur Kamera genannt statt nur „lädt hier“.
 */
export function hinweisText(platform) {
  if (platform === "ios" || platform === "android") return "Startet direkt die Kamera. Originalgröße, verkleinern ist gesperrt.";
  if (platform === "ios-ohne-ar") return "In Safari startet hier direkt die Kamera. In diesem Browser lädt die Ansicht auf der Seite.";
  return "Lädt die Ansicht hier auf der Seite.";
}

export default function ArLaunch({ product, ar: arBase, highlight = false, token = null, onFallback = openStage }) {
  const platform = usePlatform();
  const [qrOpen, setQrOpen] = useState(false);
  const [note, setNote] = useState("");
  useMeldeGeoeffnet(highlight ? token : null);
  const sizes = arBase.art === "raumbedarf" ? groessenListe(arBase.raumbedarf, arBase.modell) : [];
  const gi = useGroesse(product.id);
  const g = sizes[gi] || null;
  const ar = g && gi > 0 ? { ...arBase, glb: g.glb, usdz: g.usdz } : arBase;

  const start = () => {
    trackEvent("ar_quick_start", { product_id: product.id, platform, art: ar.art, labs: true });
    if (platform === "ios" && ar.usdz) return openQuickLook(ar.usdz, ar.poster);
    if (platform === "android") {
      const here = new URL(window.location.href);
      here.searchParams.set("ar", "fallback");
      here.searchParams.delete("von");
      here.searchParams.delete("t");
      here.hash = "arv-buehne";
      window.location.href = sceneViewerIntent({
        fileUrl: new URL(ar.glb, window.location.origin).toString(),
        title: `${product.brand} ${product.name}`,
        fallbackUrl: here.toString(),
      });
      return undefined;
    }
    if (platform === "ios-ohne-ar") setNote("AR Quick Look ist in diesem Browser nicht verfügbar. Öffnen Sie die Seite in Safari.");
    onFallback?.();
    return undefined;
  };

  if (platform === null) {
    return <div aria-hidden="true" className="h-12 w-full max-w-sm bg-ink/5 motion-safe:animate-pulse" />;
  }

  if (platform === "inapp-ios" || platform === "inapp-android") return <InAppHinweis ios={platform === "inapp-ios"} />;

  const shown = g && sizes.length > 1 ? ` Gezeigt: ${g.modell || `${g.w} × ${g.d} × ${g.h} cm`}.` : "";

  if (platform === "desktop") {
    return (
      <div>
        <GroessenWahl productId={product.id} list={sizes} active={gi} />
        <button
          type="button"
          onPointerEnter={preloadQr}
          onFocus={preloadQr}
          onClick={() => {
            preloadQr();
            setQrOpen(true);
            trackEvent("ar_handoff_qr", { product_id: product.id, labs: true });
          }}
          data-testid="arv-qr-start"
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-action-hover sm:w-auto ${FOCUS}`}
        >
          <QrCode aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Auf dem Smartphone im Raum ansehen
        </button>
        <p className="mt-2 text-small text-text-soft">
          AR läuft auf iPhone, iPad und Android. Der Code öffnet genau dieses Produkt.{shown}
        </p>
        <PhoneHandoff
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          path={product.path}
          product={{ name: product.name, brand: product.brand, image: ar.poster, imageUnoptimized: true }}
        />
      </div>
    );
  }

  return (
    <div>
      <GroessenWahl productId={product.id} list={sizes} active={gi} />
      <button
        type="button"
        onClick={start}
        data-testid="arv-ar-start"
        data-platform={platform}
        className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-action-hover sm:w-auto ${
          highlight ? "outline-2 outline-offset-4 outline-gold-text" : ""
        } ${FOCUS}`}
      >
        <Smartphone aria-hidden="true" className="size-5" strokeWidth={1.5} />
        In meinem Raum ansehen
      </button>
      <p className="mt-2 text-small text-text-soft">
        {highlight ? "Vom Computer übergeben. " : ""}
        {hinweisText(platform)}
        {shown}
      </p>
      {note && (
        <p className="mt-1 text-small text-text" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
