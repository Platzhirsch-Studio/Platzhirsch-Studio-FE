"use client";
// Ezarri-Konfigurator – AR mit den eigenen Maßen. Erst auf Klick: GLB aus der
// aktuellen 3D-Szene (GLTFExporter, Mosaik als Textur gebacken), dann
// <model-viewer> (lazy import). Android: Scene Viewer/WebXR, iOS: Quick Look
// (USDZ erzeugt model-viewer aus dem GLB). Ohne AR-Gerät: drehbares 3D-Modell.
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { drawMosaic, PITCH } from "@/lib/ezarri/konfigurator/preview2d";
import { useKonfCopy } from "./useKonfCopy";

export default function ArAnsicht({ apiRef, state, index, disabled }) {
  const { AKTIONEN, t } = useKonfCopy();
  const dlg = useRef(null);
  const [src, setSrc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => () => src && URL.revokeObjectURL(src), [src]);

  const start = async () => {
    setErr(null);
    setBusy(true);
    try {
      const pitch = PITCH[state.format] || PITCH[25];
      const n = Math.max(8, Math.round(1 / pitch));
      const bake = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 1024;
        drawMosaic(c.getContext("2d"), { state, index, width: 1024, height: 1024, stonePx: 1024 / n, wasser: null, kanaele: [] });
        return c;
      };
      const blob = await apiRef.current?.exportGLB(bake, n * pitch);
      if (!blob) throw new Error("kein Modell");
      await import("@google/model-viewer");
      setSrc(URL.createObjectURL(blob));
      dlg.current?.showModal();
    } catch {
      setErr(t("Das AR-Modell ließ sich auf diesem Gerät nicht erzeugen.", "The AR model could not be created on this device."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={start} disabled={disabled || busy} className="min-h-11 w-full border border-ink px-4 text-left text-ui hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-45" data-ezk-ar="">
        {busy ? t("Modell wird erzeugt …", "Creating model …") : AKTIONEN.ar}
        {disabled && <span className="block text-small">{t("erst in der 3D-Ansicht verfügbar", "available in the 3D view only")}</span>}
      </button>
      {err && (
        <p className="text-small text-error" role="status">
          {err}
        </p>
      )}
      <dialog ref={dlg} onClose={() => setSrc(null)} aria-label={t("Becken in Originalgröße", "Pool at full size")} className="m-auto h-[min(90dvh,720px)] w-[min(96vw,900px)] bg-paper p-0 shadow-overlay backdrop:bg-ink-deep/40">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <p className="text-ui">{t("Ihr Becken in Originalgröße", "Your pool at full size")}</p>
            <button type="button" onClick={() => dlg.current?.close()} className="flex size-11 items-center justify-center hover:bg-stone" aria-label={t("Schließen", "Close")}>
              <X className="size-5" aria-hidden="true" strokeWidth={1.5} />
            </button>
          </div>
          {src && (
            <model-viewer
              src={src}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls=""
              touch-action="pan-y"
              shadow-intensity="0"
              alt={t(`Becken ${state.becken.l} × ${state.becken.b} m mit dem gewählten Mosaik`, `Pool ${state.becken.l} × ${state.becken.b} m with the chosen mosaic`, "ar.alt", { l: String(state.becken.l).replace(".", ","), b: String(state.becken.b).replace(".", ",") })}
              style={{ width: "100%", flex: 1, background: "var(--color-stone)" }}
            />
          )}
          <p className="px-4 py-2 text-small text-text-soft">{t("Maßstab 1:1. Auf dem Handy erscheint „In AR ansehen“, wenn Ihr Gerät AR unterstützt.", "Scale 1:1. On a phone, “View in AR” appears if your device supports AR.")}</p>
        </div>
      </dialog>
    </>
  );
}
