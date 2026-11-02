"use client";
// Lädt die Erfolgsseite einige Male neu, solange die Zahlung noch nicht
// bestätigt ist (der Webhook kommt meist nach wenigen Sekunden). Ohne
// JavaScript hilft der sichtbare Link "Status aktualisieren".
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ everyMs = 3000, max = 10 }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= max) return undefined;
    const t = setTimeout(() => {
      router.refresh();
      setCount((c) => c + 1);
    }, everyMs);
    return () => clearTimeout(t);
  }, [count, everyMs, max, router]);
  return null;
}
