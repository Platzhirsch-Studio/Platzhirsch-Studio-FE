"use client";
/* eslint-disable react-hooks/immutability -- three.js-Objekte (Kamera, Renderer, Szene, Uniforms,
   Materialien) werden absichtlich in Effekten verändert; das ist das R3F-Muster. */
// Bodensee-Licht (N4) – Hook und Lichtkomponente für React-Three-Fiber-Szenen.
//
// Einbau in eine bestehende Szene (Küchenplaner, Ezarri-Pool, Portal-Planung),
// 5–10 Zeilen:
//
//   import { SonnenLicht } from "@/components/Licht/useSonnenlicht";
//   <Canvas frameloop="demand" shadows> …
//     <SonnenLicht zustand={licht} ziel={[0, 1, 0]} bereich={4} />
//   </Canvas>
//
// `zustand` kommt aus LichtRad (src/components/Licht/LichtRad.js) bzw.
// parseLicht() (src/lib/licht/zustand.js). Vereinbarung: −Z der Szene schaut
// durchs Fenster nach draußen (Kompassrichtung `zustand.fenster`); liegt das
// Fenster der Szene woanders, gibt `drehung` (Grad um +Y) den Versatz an.
//
// Leistung: Die Komponente rendert nichts pro Frame. Sie ruft invalidate() nur,
// wenn sich der Lichtzustand ändert (frameloop="demand"). Schattenkarte mobil
// 1024², sonst 2048². Unter dem Horizont ist die Sonne aus und wirft keinen
// Schatten; es bleiben Himmel und (optional) Kunstlicht über `kunstlicht`.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { lichtWerte } from "@/lib/licht/himmel";
import { richtungInSzene, schattenGroesse } from "@/lib/licht/szene";
import { ortVon } from "@/lib/licht/zustand";
import { sonnenstand } from "@/lib/licht/sonne";

const istMobil = (breite) =>
  breite < 768 || (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches);

/**
 * useSonnenlicht(zustand, { drehung, basis, mobil }) →
 * { sonne, licht, richtung: [x,y,z], schattenGroesse, mobil }
 * Muss innerhalb von <Canvas> laufen (nutzt useThree für invalidate/Größe).
 */
export function useSonnenlicht(zustand, { drehung = 0, basis, mobil } = {}) {
  const invalidate = useThree((s) => s.invalidate);
  const breite = useThree((s) => s.size.width);
  const { ort, lat, lon, datum, minuten, fenster } = zustand;
  const ergebnis = useMemo(() => {
    const o = ortVon({ ort, lat, lon });
    const sonne = sonnenstand(o, datum, minuten);
    const licht = lichtWerte(sonne.hoehe, basis);
    const richtung = richtungInSzene(sonne.azimut, sonne.hoehe, fenster + drehung);
    return { sonne, licht, richtung };
  }, [ort, lat, lon, datum, minuten, fenster, drehung, basis]);
  const m = mobil ?? istMobil(breite);
  useEffect(() => {
    invalidate();
  }, [ergebnis, invalidate]);
  return { ...ergebnis, mobil: m, schattenGroesse: schattenGroesse(m) };
}

/**
 * <SonnenLicht zustand ziel bereich abstand drehung kunstlicht onLicht />
 *   ziel      Punkt, auf den die Sonne zielt (Mitte des Raums)
 *   bereich   halbe Kantenlänge der Schattenkamera in m (so klein wie möglich)
 *   abstand   Abstand der Lichtquelle vom Ziel (m)
 *   himmel    false = kein HemisphereLight (wenn die Szene eigenes Umgebungslicht hat)
 *   umgebung  true = scene.environmentIntensity nach Tageszeit (HDRI-Belichtung)
 *   onLicht   Rückruf mit { sonne, licht } bei jeder Änderung (z. B. für Kunstlicht)
 */
export function SonnenLicht({ zustand, ziel = [0, 0, 0], bereich = 5, abstand = 30, drehung = 0, himmel = true, umgebung = true, basis, mobil, onLicht }) {
  const { sonne, licht, richtung, schattenGroesse: groesse } = useSonnenlicht(zustand, { drehung, basis, mobil });
  const lightRef = useRef(null);
  const targetRef = useRef(null);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  const [zx, zy, zz] = ziel;
  const position = useMemo(() => [zx + richtung[0] * abstand, zy + richtung[1] * abstand, zz + richtung[2] * abstand], [zx, zy, zz, richtung, abstand]);

  useLayoutEffect(() => {
    const l = lightRef.current;
    if (!l || !targetRef.current) return;
    l.target = targetRef.current;
    const cam = l.shadow.camera;
    cam.left = -bereich;
    cam.right = bereich;
    cam.top = bereich;
    cam.bottom = -bereich;
    cam.near = Math.max(0.5, abstand - bereich * 3);
    cam.far = abstand + bereich * 3;
    cam.updateProjectionMatrix();
    l.shadow.needsUpdate = true;
    invalidate();
  }, [bereich, abstand, position, invalidate]);

  useEffect(() => {
    if (!umgebung) return;
    const vorher = scene.environmentIntensity;
    scene.environmentIntensity = licht.hdriBelichtung;
    invalidate();
    return () => {
      scene.environmentIntensity = vorher;
    };
  }, [scene, licht.hdriBelichtung, umgebung, invalidate]);

  useEffect(() => {
    onLicht?.({ sonne, licht });
  }, [sonne, licht, onLicht]);

  const farbe = useMemo(() => new THREE.Color(licht.sonne.farbe), [licht.sonne.farbe]);

  return (
    <>
      <object3D ref={targetRef} position={[zx, zy, zz]} />
      <directionalLight
        key={groesse}
        ref={lightRef}
        position={position}
        color={farbe}
        intensity={licht.sonne.intensitaet}
        visible={licht.sonne.an}
        castShadow={licht.schatten}
        shadow-mapSize-width={groesse}
        shadow-mapSize-height={groesse}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {himmel ? <hemisphereLight color={licht.himmel.oben} groundColor="#8a8174" intensity={licht.himmel.intensitaet} /> : null}
    </>
  );
}
