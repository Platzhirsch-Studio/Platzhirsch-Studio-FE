"use client";
// Desktop → Smartphone: QR-Code (lokal erzeugt, keine Drittanbieter). Der Link kommt
// aus handoffOrigin() (Tunnel/Vorschau oder SITE_URL, nie localhost) mit ?von=qr.
// Drei Schritte, Link kopieren. Nur auf Geräten mit feinem Zeiger angeboten.
// Modal nach Design-Bibel §6/§9: kein Radius, ein Schatten (overlay), Esc
// schließt, Fokus kehrt zum Auslöser zurück (natives <dialog>).
// QA R2 P2-6:
//   - qrcode wird beim Hover/Fokus des Auslösers vorgeladen (preloadQr)
//   - bis der Code steht: ruhiges Skeleton (Suchermuster + Raster, motion-safe Puls),
//     das Mittel-Bild erscheint erst zusammen mit dem Code
//   - Live-Status „Auf dem Handy geöffnet“: kurzlebiges Übergabe-Token im Link (&t=),
//     das Handy meldet nur das Token, der Dialog fragt alle 2,5 s nach (max. 15 min)
// QA R2 P1-2.1: außerhalb von Produktion steht im Dialog, wohin der Link führt.
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, X } from "lucide-react";
import styles from "./ArViewer.module.css";
import { handoffOrigin, handoffUrl, TOKEN_RE } from "./ArLaunch";
import { SITE_URL } from "@/lib/site";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const ENDPOINT = "/de/3d-ansicht/uebergabe";
const POLL_MS = 2500;
const POLL_MAX_MS = 15 * 60 * 1000;
const noop = () => () => {};

let qrModule = null;
/** qrcode vorab laden (Hover/Fokus auf den Auslöser). */
export function preloadQr() {
  if (!qrModule) qrModule = import("qrcode").catch((e) => ((qrModule = null), Promise.reject(e)));
  return qrModule;
}

function QrSkeleton() {
  // Drei Suchermuster und ein ruhiges Raster – sieht aus wie ein Code, der gleich erscheint.
  const finder = (pos) => (
    <span aria-hidden="true" className={`absolute ${pos} grid h-[22%] w-[22%] place-items-center border-[6px] border-ink/12`}>
      <span className="h-[46%] w-[46%] bg-ink/12" />
    </span>
  );
  return (
    <div className="absolute inset-[7%] motion-safe:animate-pulse" data-testid="arv-qr-skeleton">
      {finder("left-0 top-0")}
      {finder("right-0 top-0")}
      {finder("bottom-0 left-0")}
      <span
        aria-hidden="true"
        className="absolute inset-[26%_0_0_26%] bg-[radial-gradient(rgb(31_37_43/0.10)_38%,transparent_40%)] bg-[length:10px_10px]"
      />
    </div>
  );
}

export default function PhoneHandoff({ open, onClose, path, product }) {
  const ref = useRef(null);
  const titleId = useId();
  const [qr, setQr] = useState(null);
  const [token, setToken] = useState(null);
  const [openedToken, setOpenedToken] = useState(null);
  const opened = Boolean(token && openedToken === token);
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(noop, handoffOrigin, () => null);
  const url = path ? handoffUrl(path, token) : "";
  const shareUrl = path ? handoffUrl(path) : "";

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // Übergabe-Token je Öffnen des Dialogs (ohne Token: QR ohne Live-Status, alles andere geht).
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ aktion: "neu" }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !cancelled && setToken(j && TOKEN_RE.test(j.t || "") ? j.t : ""))
      .catch(() => !cancelled && setToken(""));
    return () => {
      cancelled = true;
      setToken(null);
      setQr(null);
    };
  }, [open]);

  // QR erst, wenn das Token feststeht (sonst springt der Code einmal um).
  useEffect(() => {
    if (!open || !path || token === null) return undefined;
    let cancelled = false;
    preloadQr()
      .then((QR) => QR.toString(url, { type: "svg", margin: 4, errorCorrectionLevel: "Q", color: { dark: "#1f252bff", light: "#00000000" } }))
      .then((svg) => !cancelled && setQr(svg))
      .catch(() => !cancelled && setQr(""));
    return () => {
      cancelled = true;
    };
  }, [open, path, token, url]);

  // Live-Status: nachfragen, bis das Handy den Link geöffnet hat.
  useEffect(() => {
    if (!open || !token || opened) return undefined;
    const t0 = Date.now();
    let stop = false;
    const tick = async () => {
      if (stop || Date.now() - t0 > POLL_MAX_MS || document.hidden) return;
      try {
        const r = await fetch(`${ENDPOINT}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (!stop && j?.geoeffnet) setOpenedToken(token);
      } catch {
        // still: nächster Versuch
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [open, token, opened]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const preview = process.env.NODE_ENV !== "production" && origin;
  const previewDead = preview && origin === SITE_URL.replace(/\/$/, "");

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`${styles.handoff} m-auto w-[min(94vw,760px)] max-h-[92svh] overflow-auto bg-surface p-0 text-text shadow-overlay backdrop:bg-ink-deep/55 backdrop:backdrop-blur-[2px]`}
      data-testid="arv-qr-dialog"
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* QR-Seite */}
        <div className="relative flex flex-col items-center justify-center gap-5 bg-surface-raised px-8 py-10 md:py-12">
          <div className="relative p-5">
            {/* Eckmarken statt Rahmen – wirkt wie ein Sucher */}
            <span aria-hidden="true" className="absolute left-0 top-0 h-5 w-5 border-l border-t border-ink" />
            <span aria-hidden="true" className="absolute right-0 top-0 h-5 w-5 border-r border-t border-ink" />
            <span aria-hidden="true" className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-ink" />
            <span aria-hidden="true" className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-ink" />
            {/* Ruhezone: 4 Module Papier im SVG selbst (QA R1 P2-5, ältere Android-Scanner) */}
            <div className="relative h-[232px] w-[232px] bg-paper" data-ready={qr ? "" : undefined}>
              {qr ? (
                <>
                  <div
                    role="img"
                    aria-label={`QR-Code zum Link ${shareUrl}`}
                    className={`arv-qr h-full w-full transition-opacity duration-(--duration-micro) motion-reduce:transition-none [&>svg]:h-full [&>svg]:w-full ${opened ? "opacity-15" : ""}`}
                    // SVG stammt aus der lokalen qrcode-Bibliothek (nur Pfade, kein Script)
                    dangerouslySetInnerHTML={{ __html: qr }}
                  />
                  {product?.image && !opened && (
                    <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center bg-paper p-1 ring-4 ring-paper">
                      <Image src={product.image} alt="" width={40} height={40} unoptimized={product.imageUnoptimized} className="h-10 w-10 object-contain" />
                    </span>
                  )}
                  {opened && (
                    <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
                      <span className="grid h-16 w-16 place-items-center bg-ink text-paper">
                        <Check className="size-8" strokeWidth={1.75} />
                      </span>
                    </span>
                  )}
                </>
              ) : qr === "" ? (
                <p className="grid h-full w-full place-items-center p-4 text-center text-small text-text-soft">
                  Der Code konnte nicht erzeugt werden. Kopieren Sie den Link rechts.
                </p>
              ) : (
                <>
                  <QrSkeleton />
                  <span className="sr-only">QR-Code wird erstellt</span>
                </>
              )}
            </div>
          </div>
          <p className="text-overline uppercase text-text-soft" aria-hidden={opened ? "true" : undefined}>
            {opened ? "Verbunden" : "Mit der Handykamera scannen"}
          </p>
        </div>

        {/* Text-Seite */}
        <div className="relative flex flex-col px-6 py-8 md:px-8 md:py-10">
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-2 top-2 grid h-11 w-11 place-items-center text-text-soft hover:text-text ${FOCUS}`}
            aria-label="Schließen"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
          <p className="text-overline uppercase text-text-accent">Weiter auf dem Smartphone</p>
          <h2 id={titleId} className="mt-2 pr-8 font-display text-[2rem] leading-[1.1]">
            {product?.name ? `${product.name} im eigenen Raum` : "Im eigenen Raum ansehen"}
          </h2>
          {product?.brand && <p className="mt-1 text-small text-text-soft">{product.brand}</p>}

          {/* Live-Status (Premium-Moment): sobald das Handy den Link öffnet */}
          <div aria-live="polite" className="min-h-0">
            {opened && (
              <p className="mt-5 flex items-center gap-2.5 border-l-2 border-ink bg-surface-raised px-3 py-2.5 text-ui text-text" data-testid="arv-qr-geoeffnet">
                <Check aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
                <span>
                  <span className="font-medium">Auf dem Handy geöffnet.</span> Tippen Sie dort auf „In meinem Raum ansehen“.
                </span>
              </p>
            )}
          </div>

          <ol className="mt-6 grid gap-4">
            {[
              ["Kamera öffnen", "Richten Sie die Kamera auf den Code. Eine App brauchen Sie nicht."],
              ["Link antippen", "Die Seite öffnet sich direkt mit diesem Produkt."],
              ["„In meinem Raum ansehen“", "Boden kurz abfahren, dann steht das Möbel in Originalgröße vor Ihnen."],
            ].map(([t, d], i) => {
              const done = opened && i < 2;
              return (
                <li key={t} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span
                    aria-hidden="true"
                    className={`grid h-8 w-8 place-items-center border border-ink text-small tabular-nums transition-colors duration-(--duration-micro) ${done ? "bg-ink text-paper" : ""}`}
                  >
                    {done ? <Check className="size-4" strokeWidth={2} /> : i + 1}
                  </span>
                  <span>
                    <span className="block text-ui text-text">
                      {t}
                      {done && <span className="sr-only"> (erledigt)</span>}
                    </span>
                    <span className="block text-small leading-relaxed text-text-soft">{d}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex items-stretch border border-line-strong">
            <span className="min-w-0 flex-1 truncate px-3 py-3 text-small text-text-soft" title={shareUrl}>
              {shareUrl.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-l border-line-strong px-4 text-small font-medium text-text hover:bg-ink hover:text-paper ${FOCUS}`}
            >
              {copied ? <Check aria-hidden="true" className="size-4" strokeWidth={1.75} /> : <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />}
              {copied ? "Kopiert" : "Link kopieren"}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copied ? "Link in die Zwischenablage kopiert" : ""}
          </p>
          {preview && (
            <p className="mt-3 border border-dashed border-line-strong px-3 py-2 text-small text-text-soft" data-testid="arv-qr-vorschau">
              <span className="font-medium text-text">Vorschau:</span> Link führt auf {origin.replace(/^https?:\/\//, "")}.
              {previewDead && " Dort ist der Viewer erst nach dem Livegang erreichbar. Für Gerätetests die Seite über die Tunnel-Adresse öffnen."}
            </p>
          )}
          <p className="mt-4 text-small leading-relaxed text-text-soft">
            iPhone und iPad ab iOS 12 (AR Quick Look) oder Android mit ARCore. Wir erhalten keine Kamerabilder.
          </p>
        </div>
      </div>
    </dialog>
  );
}
