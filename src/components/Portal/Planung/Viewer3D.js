"use client";
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { Box as BoxIcon } from "lucide-react";
import RoomVisual from "./RoomVisual";
import { focusRing, useReducedMotion } from "./client";

// 3D view of a planning variant. three.js/R3F (~250 KB gz) is only fetched
// after the customer asks for it; without WebGL the vector visual is shown.

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false, loading: () => null });

let webglCache = null;
function hasWebGL() {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
const noSubscribe = () => () => {};

export default function Viewer3D({ variant }) {
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL, () => null);
  const reduced = useReducedMotion();
  const [want, setWant] = useState(false);
  const [ready, setReady] = useState(false);

  if (webgl === false) {
    return (
      <div>
        <div className="aspect-16/10 overflow-hidden bg-stone">
          <RoomVisual scene={variant.scene} title={variant.title} className="h-full w-full" />
        </div>
        <p className="mt-3 text-sm text-ink/75">Ihr Gerät unterstützt keine 3D-Darstellung (WebGL). Sie sehen die Planung als Bild.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-16/10 touch-none overflow-hidden bg-bone" aria-busy={want && !ready}>
        {want ? (
          <>
            <Scene3D scene={variant.scene} reducedMotion={reduced} onReady={() => setReady(true)} />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-bone/80 text-sm text-ink" role="status">
                3D-Ansicht wird geladen …
              </div>
            )}
          </>
        ) : (
          <>
            <RoomVisual scene={variant.scene} title={variant.title} className="h-full w-full opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => setWant(true)}
                className={`inline-flex min-h-12 items-center gap-2 bg-ink px-6 text-sm font-semibold text-white shadow-lg ${focusRing}`}
              >
                <BoxIcon size={18} aria-hidden="true" />
                3D-Ansicht laden
              </button>
            </div>
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-ink/70">
        Vereinfachtes 3D-Raummodell zur räumlichen Orientierung – nicht maßstäblich, Materialien angedeutet. Ziehen zum Drehen, zwei Finger oder Mausrad zum Zoomen.
      </p>
    </div>
  );
}
