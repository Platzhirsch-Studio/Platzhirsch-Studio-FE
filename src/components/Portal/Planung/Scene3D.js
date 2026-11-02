"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SCENES } from "./scenes";

// Procedural 3D room of a planning variant (same palette as RoomVisual).
// Loaded only on demand through next/dynamic (ssr: false) from Viewer3D.
// Units: metres; room 5 x 4 m, 2.6 m high.

function Box({ size, position, color, rough = 0.7, metal = 0 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

function Shell({ s }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color={s.floor} roughness={0.85} />
      </mesh>
      <Box size={[5, 2.6, 0.1]} position={[0, 1.3, -2.05]} color={s.wall} rough={0.95} />
      <Box size={[0.1, 2.6, 4]} position={[-2.55, 1.3, 0]} color={s.wall} rough={0.95} />
      {/* window opening on the right wall, shown as a bright pane */}
      <mesh position={[2.5, 1.4, -0.3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 1.4]} />
        <meshBasicMaterial color="#e7eef0" />
      </mesh>
    </group>
  );
}

function Kitchen({ s }) {
  const run = s.island ? 3.4 : 4;
  const x0 = s.island ? 0.25 : 0;
  return (
    <group>
      <Box size={[run, 0.86, 0.6]} position={[x0, 0.43, -1.7]} color={s.front} rough={0.55} />
      <Box size={[run + 0.04, 0.04, 0.64]} position={[x0, 0.88, -1.68]} color={s.top} rough={0.3} />
      {s.island ? (
        <>
          <Box size={[0.75, 2.3, 0.62]} position={[-1.95, 1.15, -1.69]} color={s.front} rough={0.55} />
          <Box size={[s.seats ? 2.6 : 2, 0.88, 0.95]} position={[0, 0.44, 0]} color={s.front} rough={0.55} />
          <Box size={[s.seats ? 2.7 : 2.06, 0.05, 1.05]} position={[s.seats ? -0.05 : 0, 0.9, 0]} color={s.top} rough={0.25} />
          {Array.from({ length: s.seats || 0 }, (_, i) => (
            <group key={i} position={[-0.8 + i * 0.8, 0, 0.75]}>
              <Box size={[0.38, 0.06, 0.38]} position={[0, 0.66, 0]} color={s.accent} />
              <Box size={[0.04, 0.64, 0.04]} position={[0, 0.32, 0]} color={s.metal} metal={0.6} rough={0.35} />
            </group>
          ))}
          {[-0.6, 0, 0.6].map((x) => (
            <group key={x} position={[x, 1.75, 0]}>
              <Box size={[0.01, 0.85, 0.01]} position={[0, 0.42, 0]} color={s.metal} />
              <mesh>
                <coneGeometry args={[0.15, 0.2, 24, 1, true]} />
                <meshStandardMaterial color={s.accent} side={2} roughness={0.4} metalness={0.3} />
              </mesh>
              <pointLight intensity={0.6} distance={2.5} position={[0, -0.12, 0]} color="#fff4dc" />
            </group>
          ))}
        </>
      ) : (
        <Box size={[4, 0.7, 0.35]} position={[0, 1.85, -1.82]} color={s.front} />
      )}
    </group>
  );
}

function Living({ s }) {
  const planned = s.light > 0.5;
  const w = planned ? 2.8 : 2.1;
  return (
    <group position={[0, 0, -0.6]}>
      {planned && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.6]} receiveShadow>
          <planeGeometry args={[3.2, 2.2]} />
          <meshStandardMaterial color={s.rug} roughness={1} />
        </mesh>
      )}
      <Box size={[w, 0.42, 0.95]} position={[0, 0.21, -0.6]} color={s.sofa} rough={0.95} />
      <Box size={[w, 0.45, 0.22]} position={[0, 0.62, -0.98]} color={s.sofa} rough={0.95} />
      {planned && <Box size={[0.95, 0.42, 1.7]} position={[w / 2 - 0.47, 0.21, 0.05]} color={s.sofa} rough={0.95} />}
      <mesh position={[-0.2, 0.35, 0.8]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 40]} />
        <meshStandardMaterial color={planned ? s.accent : s.metal} roughness={0.4} />
      </mesh>
      <Box size={[0.06, 0.33, 0.06]} position={[-0.2, 0.165, 0.8]} color={s.metal} />
      {planned && (
        <group position={[-1.8, 0, 0.4]}>
          <Box size={[0.35, 0.2, 0.25]} position={[0, 0.1, 0]} color="#e6e1d8" rough={0.3} />
          <Box size={[0.03, 2, 0.03]} position={[0, 1.1, 0]} color={s.metal} metal={0.7} rough={0.3} />
          <Box size={[1.2, 0.03, 0.03]} position={[0.6, 2.1, 0]} color={s.metal} metal={0.7} rough={0.3} />
          <mesh position={[1.2, 1.98, 0]}>
            <sphereGeometry args={[0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={s.metal} metalness={0.7} roughness={0.25} side={2} />
          </mesh>
          <pointLight position={[1.2, 1.85, 0]} intensity={0.8} distance={3} color="#fff4dc" />
        </group>
      )}
    </group>
  );
}

export default function Scene3D({ scene, reducedMotion, onReady }) {
  const s = SCENES[scene] || SCENES["wohnen-a"];
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop="demand"
      camera={{ position: [3.2, 2.4, 3.6], fov: 45 }}
      onCreated={() => onReady?.()}
      gl={{ antialias: true, powerPreference: "low-power" }}
    >
      <color attach="background" args={["#f7f5f1"]} />
      <hemisphereLight args={["#ffffff", "#c8b89d", 0.7 * s.light + 0.3]} />
      <directionalLight position={[4, 5, 2]} intensity={1.4 * s.light + 0.3} castShadow shadow-mapSize={[1024, 1024]} />
      <Shell s={s} />
      {s.room === "kueche" ? <Kitchen s={s} /> : <Living s={s} />}
      <OrbitControls
        makeDefault
        target={[0, 0.9, -0.5]}
        enablePan={false}
        minDistance={2.5}
        maxDistance={7}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-0.2}
        maxAzimuthAngle={Math.PI / 2}
        enableDamping={!reducedMotion}
      />
    </Canvas>
  );
}
