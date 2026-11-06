"use client";
// Tastenkürzel der Zentrale (Register lib/backoffice/kuerzel/zentrale.js): Umschalt+R neu laden,
// Umschalt+A Eingabe „Aufgabe hinzufügen“ fokussieren, Umschalt+L Aufgabenliste. Einzeltasten-Schalter gilt.

import { useRouter } from "next/navigation";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";

export default function ZentraleTasten() {
  const router = useRouter();
  useKuerzel("zentrale", {
    "zentrale.neu-laden": () => router.refresh(),
    "zentrale.aufgabe-neu": () => {
      const feld = document.querySelector('[data-testid="aufgabe-schnellanlage-feld"]');
      if (!feld) return false;
      feld.focus();
      return true;
    },
    "zentrale.aufgaben-liste": () => router.push("/aufgaben"),
  });
  return null;
}
