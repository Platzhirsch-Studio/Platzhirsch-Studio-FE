"use client";
// Druckblatt: Bild der Ansicht (QM Runde 1, P2-5).
//  1. Standbild aus dem Konfigurator (localStorage „ezk-snap“, passend zum Entwurf ?k=;
//     gilt auch, wenn das Blatt in einem neuen Tab aufgeht)
//  2. sonst rendert das Blatt die 3D-Szene selbst unsichtbar (gleicher Lazy-Chunk wie die
//     Bühne, ruhiges Wasser) und nimmt davon ein Standbild – auch wenn mobil nur 2D lief
//  3. ohne WebGL oder bei Fehler: 2D-Draufsicht
// Dazu die Nahansicht 1:1.
import { Component, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Printer } from "lucide-react";
import { useKonfCopy } from "./useKonfCopy";
import { buildIndex } from "@/lib/ezarri/konfigurator/katalog-index";
import { drawMosaic, drawPlan } from "@/lib/ezarri/konfigurator/preview2d";
import { leseStandbild, merkeStandbild } from "@/lib/ezarri/konfigurator/standbild";

const Stage3D = dynamic(() => import("./Stage3D"), { ssr: false, loading: () => null });
class Still extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function DruckenKnopf() {
  const { t } = useKonfCopy();
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 bg-action px-5 text-ui text-paper hover:bg-action-hover">
      <Printer className="size-4" aria-hidden="true" strokeWidth={1.5} />
      {t("Drucken oder als PDF speichern", "Print or save as PDF")}
    </button>
  );
}

export default function BlattBild({ k, state, katalog }) {
  const { t } = useKonfCopy();
  const index = useMemo(() => buildIndex(katalog), [katalog]);
  const [snap, setSnap] = useState(null);
  const [render3d, setRender3d] = useState(false);
  const [plan2d, setPlan2d] = useState(false);
  const plan = useRef(null);
  const nah = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const s = leseStandbild(k);
    let gl = false;
    try {
      gl = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      gl = false;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- Speicher/WebGL gibt es nur im Browser (nach dem Mount) */
    if (s) setSnap(s);
    else if (gl) setRender3d(true);
    else setPlan2d(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [k]);

  useEffect(() => {
    if (!plan2d || !plan.current) return;
    const c = plan.current;
    c.width = 900;
    c.height = 520;
    drawPlan(c.getContext("2d"), { state, index, width: 900, height: 520 });
  }, [plan2d, state, index]);

  useEffect(() => {
    const c = nah.current;
    if (!c) return;
    c.width = c.height = 320;
    drawMosaic(c.getContext("2d"), { state, index, width: 320, height: 320, stonePx: state.format === "50" ? 40 : 22, wasser: null });
  }, [state, index]);

  const fertig3d = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const bild = apiRef.current?.snapshot?.(1400);
        if (bild) {
          setSnap(bild);
          merkeStandbild(k, bild);
        } else setPlan2d(true);
        setRender3d(false);
      }),
    );
  };
  const fehler3d = () => {
    setRender3d(false);
    setPlan2d(true);
  };

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[1fr_12rem] print:grid-cols-[1fr_12rem]">
      <figure className="m-0">
        {snap ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snap} alt={t("Visualisierung des Beckens aus dem 3D-Konfigurator", "Visualisation of the pool from the 3D configurator")} className="block w-full" data-ezk-blatt-bild="3d" />
        ) : plan2d ? (
          <canvas ref={plan} className="block aspect-[900/520] w-full bg-linen" role="img" aria-label={t("Draufsicht des Beckens mit dem gewählten Mosaik", "Top view of the pool with the chosen mosaic")} data-ezk-blatt-bild="2d" />
        ) : (
          <div className="flex aspect-[1400/817] w-full items-center justify-center bg-linen text-small text-text-soft" role="status">
            {t("Visualisierung wird erstellt …", "Creating visualisation …")}
          </div>
        )}
        <figcaption className="mt-1 text-small text-text-soft">{snap ? t("Visualisierung, Farben angenähert", "Visualisation, colours approximated") : t("Draufsicht (Visualisierung, Farben angenähert)", "Top view (visualisation, colours approximated)")}</figcaption>
      </figure>
      <figure className="m-0">
        <canvas ref={nah} className="block aspect-square w-full" role="img" aria-label={t("Nahansicht des Mosaiks, vergrößert", "Close-up of the mosaic, enlarged")} />
        <figcaption className="mt-1 text-small text-text-soft">{t("Nahansicht von Steinen und Fuge (vergrößert)", "Close-up of tiles and grout (enlarged)")}</figcaption>
      </figure>
      {render3d && (
        <div className="pointer-events-none fixed left-0 top-0 -z-10 h-[817px] w-[1400px] opacity-0 print:hidden" aria-hidden="true" data-ezk-blatt-render="">
          <Still onError={fehler3d}>
            <Stage3D state={state} index={index} vorher={null} split={0.5} reducedMotion touchLocked onReady={fertig3d} onLost={fehler3d} apiRef={apiRef} />
          </Still>
        </div>
      )}
    </div>
  );
}
