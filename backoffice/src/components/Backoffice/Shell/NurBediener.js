"use client";
// Rendert Kinder nur außerhalb des Kundenmodus (Palette, Kürzel-Wurzel: keine Navigation in der Kundensicht).
import { useKundenmodus } from "../Kundenmodus/Kontext";

export default function NurBediener({ children }) {
  const { an } = useKundenmodus();
  return an ? null : children;
}
