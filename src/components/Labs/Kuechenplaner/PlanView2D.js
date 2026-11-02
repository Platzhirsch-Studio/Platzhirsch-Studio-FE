// Küchenplaner – Grundriss als SVG. Fallback ohne WebGL und Platzhalter,
// solange die 3D-Ansicht lädt. Nutzt dieselben Bauteile wie die 3D-Szene
// (Zeichnung in Drawings.js, interaktiv in PlanEditor.js).
import { PlanSvg } from "./Drawings";

export default function PlanView2D({ plan, kitchen, checks = null, className = "" }) {
  return <PlanSvg plan={plan} kitchen={kitchen} checks={checks} className={className} triangle={false} />;
}
